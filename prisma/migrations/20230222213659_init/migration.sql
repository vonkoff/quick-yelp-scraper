/*
  Warnings:

  - A unique constraint covering the columns `[webpage]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Company_webpage_key" ON "Company"("webpage");
