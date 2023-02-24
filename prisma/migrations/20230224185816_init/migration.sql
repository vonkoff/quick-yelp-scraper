/*
  Warnings:

  - Added the required column `postalCodeId` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "postalCodeId" INTEGER NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PostalCode" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PostalCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostalCode_name_key" ON "PostalCode"("name");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_postalCodeId_fkey" FOREIGN KEY ("postalCodeId") REFERENCES "PostalCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
