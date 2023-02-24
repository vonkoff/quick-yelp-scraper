/*
  Warnings:

  - Made the column `addressLocalityId` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_addressLocalityId_fkey";

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "addressLocalityId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_addressLocalityId_fkey" FOREIGN KEY ("addressLocalityId") REFERENCES "AddressLocality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
