/*
  Warnings:

  - You are about to drop the column `address` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "address",
ADD COLUMN     "addressLocalityId" INTEGER;

-- CreateTable
CREATE TABLE "AddressLocality" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AddressLocality_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddressLocality_name_key" ON "AddressLocality"("name");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_addressLocalityId_fkey" FOREIGN KEY ("addressLocalityId") REFERENCES "AddressLocality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
