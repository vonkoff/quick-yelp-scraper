import { categories } from './utils/categories';
// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
const { chromium } = require('playwright-extra');

// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
const stealth = require('puppeteer-extra-plugin-stealth')();

// Add the plugin to playwright (any number of plugins can be added)
chromium.use(stealth);

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

async function LaunchBrowser(url: URL, category: string, state: string) {
  await chromium
    .launch({ headless: true })
    .then(async (browser: { newPage: () => any; close: () => any }) => {
      const page = await browser.newPage();

      let start = 0;

      let notFound =
        (await page.getByText(/Sorry|Suggestions for improving/gi).count()) ===
        0
          ? false
          : true;

      logger.log({
        level: 'info',
        message: 'Hello distributed log files!',
      });

      while (notFound === false) {
        url.searchParams.set('start', `${start}`);
        await page.goto(url.href);

        notFound =
          (await page
            .getByText(/Sorry|Suggestions for improving/gi)
            .count()) === 0
            ? false
            : true;

        const find_results = await page.locator('h3:has(a)');

        const count = await find_results.count();
        const linkArr = [];
        for (let i = 0; i < count; i++) {
          const innerHTML = await find_results.nth(i).innerHTML();
          const href = await innerHTML.match(/href="([^"]*)/)[1];
          if (href.startsWith('/biz')) linkArr.push(href);

          console.log(href);
        }

        // List of biz pages to search
        BizUrlLoop: for await (const link of linkArr) {
          try {
            await page.goto('https://www.yelp.com' + link);
          } catch (error) {
            console.error('Failed going to extracted yelp page');
            continue BizUrlLoop;
          }

          await delay(5000);

          const jsonSchema = await page.locator(
            'script[type="application/ld+json"]'
          );

          const jsonSchemaCount = await jsonSchema.count();
          console.log('amount of Json Scripts: ', jsonSchemaCount);

          let jsonObj,
            gotJSON = false;

          JSONLOOP: for (let i = 0; i < jsonSchemaCount; i++) {
            const jsonSchemaNow = await jsonSchema.nth(i).innerText();
            jsonObj = await JSON.parse(jsonSchemaNow);
            console.log(jsonObj);
            if (
              jsonObj['@type'] === 'LocalBusiness' ||
              jsonObj['@type'] === 'Restaurant'
            ) {
              console.log('got to if TRUE');
              gotJSON = true;
              break JSONLOOP;
            }
          }
          if (gotJSON === false) {
            continue BizUrlLoop;
          }

          console.log(
            'BEFORE: ',
            jsonObj.name,
            jsonObj.telephone,
            jsonObj.address.streetAddress,
            jsonObj.address.addressLocality,
            jsonObj.address.postalCode
          );

          const name = await jsonObj.name
            .replaceAll('&amp;', '&')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&quot;', '"')
            .replaceAll('&apos;', "'");
          const phone = await jsonObj.telephone;
          const street = await jsonObj.address.streetAddress;
          const addressLocality = await jsonObj.address.addressLocality;
          const postalCode = await jsonObj.address.postalCode;

          console.log(
            jsonObj.name,
            jsonObj.telephone,
            jsonObj.address.streetAddress,
            jsonObj.address.addressLocality,
            jsonObj.address.postalCode
          );

          delay(10_000);

          // const name = await page.locator('h1.css-1se8maq').innerHTML();

          const webpageBool = await page
            .getByText(/^(http|https):/i)
            .isVisible();

          // const phoneBool = await page
          //   .getByText(/^\(\d{3}\) \d{3}-\d{4}/i)
          //   .nth(-1)
          //   .isVisible();

          // const addressBool = await page
          //   .locator('p.css-qyp8bo', { hasText: /\w{2} \d{5}$/i })
          //   .isVisible();

          const webpage = webpageBool
            ? await page.getByText(/^(http|https):/i).innerHTML()
            : null;

          // const phone = phoneBool
          //   ? await page
          //       .getByText(/^\(\d{3}\) \d{3}-\d{4}/i)
          //       .nth(-1)
          //       .innerHTML()
          //   : null;
          // const address = addressBool
          //   ? await page
          //       .locator('p.css-qyp8bo', { hasText: /\w{2} \d{5}$/i })
          //       .innerHTML()
          //   : null;

          console.log('webpage: ', webpage);

          const webpageExists =
            webpage === null
              ? false
              : await prisma.company.findUnique({
                  where: {
                    webpage: webpage,
                  },
                });

          // If webpage exists then continue to loop to other biz pages
          if (webpageExists) continue;

          let urls = null;
          const emailArr: string[] = [];
          // If webpage already found to exist want to make the object false so don't go into if function
          if (webpage) {
            try {
              await page.goto(webpage);
            } catch (error) {}
            delay(3000);

            // Sometimes pages would be blocked (red lock)
            // so have to skip it
            try {
              urls = await page.$$eval('a', (elements: any[]) =>
                elements
                  .filter((el) => /^(http|https):\/\/[^ "]+$/.test(el))
                  .map((el) => el.href)
              );
            } catch (error) {}
            console.log(urls);

            if (urls !== null) {
              console.log(url);
              for await (const url of urls) {
                try {
                  await page.goto(url);
                  const html = await page.content();
                  const contentAsText = await html.toString();
                  const listOfEmails = await contentAsText.match(
                    /([a-zA-Z0-9._-]+@[a-zA-Z]+\.[a-zA-Z]+)/gi
                  );
                  if (listOfEmails !== null) emailArr.push(...listOfEmails);
                  console.log(listOfEmails);
                } catch (error) {
                  console.log(error);
                }
              }
            }
          }

          // Remove duplicates
          const emailArrRemov = [...new Set(emailArr)];

          const prismaCategory = await prisma.categories.findUnique({
            where: {
              name: category,
            },
          });

          await prisma.categories.upsert({
            where: { name: category },
            update: {},
            create: { name: category },
          });

          const prismaState = await prisma.states.upsert({
            where: { name: state },
            update: {},
            create: { name: state },
          });

          const prismaAddressLocality = await prisma.addressLocality.upsert({
            where: { name: addressLocality },
            update: {},
            create: { name: addressLocality },
          });

          const prismaPostalCode = await prisma.postalCode.upsert({
            where: { name: postalCode },
            update: {},
            create: { name: postalCode },
          });

          // if webpage is null then it will go to else
          // If urls null then will go to else statement
          if (webpage && urls) {
            await prisma.company.upsert({
              where: {
                name_stateId: { name: name, stateId: prismaState!.id },
              },
              update: {},
              create: {
                name: name,
                street: street,
                postalCodeId: prismaPostalCode!.id,
                addressLocalityId: prismaAddressLocality!.id,
                webpage: webpage,
                phone: phone ? phone : null,
                email:
                  emailArrRemov.length === 0 ? null : emailArrRemov.toString(),
                categoryId: prismaCategory!.id,
                stateId: prismaState!.id,
              },
            });
          } else {
            await prisma.company.upsert({
              where: {
                name_stateId: { name: name, stateId: prismaState!.id },
              },
              update: {},
              create: {
                name: name,
                street: street,
                postalCodeId: prismaPostalCode!.id,
                addressLocalityId: prismaAddressLocality!.id,
                phone: phone,
                email:
                  emailArrRemov.length === 0 ? null : emailArrRemov.toString(),
                categoryId: prismaCategory!.id,
                stateId: prismaState!.id,
              },
            });
          }
        }
        start += 10;
      }

      await browser.close();
    });
}

async function go() {
  for await (const category of categories) {
    await prisma.categories.upsert({
      where: { name: category },
      update: {},
      create: { name: category },
    });
  }

  const response = await fetch(
    'https://countriesnow.space/api/v0.1/countries/states',
    {
      method: 'post',
      body: JSON.stringify({
        country: 'United States',
      }),
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const result = await response.json();
  const states = result.data.states;

  for await (const item of states) {
    const state = item.name;
    const body = {
      country: 'United States',
      state: state,
    };

    const cityresponse = await fetch(
      'https://countriesnow.space/api/v0.1/countries/state/cities',
      {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const cityArr = await cityresponse.json();
    console.log('state: ', state);
    for await (const city of cityArr.data) {
      let url = new URL('https://www.yelp.com/search?');
      for await (const category of categories) {
        url.searchParams.set('find_desc', category);
        url.searchParams.set('find_loc', `${city}, ${item.state_code}`);
        await LaunchBrowser(url, category, state);
        // ! DELETE TO GO FURTHER
        // break;
      }
      // ! DELETE TO GO FURTHER
      // break;
    }
    // ! DELETE TO GO FURTHER
    // break;
  }
}

go()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
