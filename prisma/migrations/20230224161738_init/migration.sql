/*
  Warnings:

  - A unique constraint covering the columns `[name,stateId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Company_name_stateId_key" ON "Company"("name", "stateId");
