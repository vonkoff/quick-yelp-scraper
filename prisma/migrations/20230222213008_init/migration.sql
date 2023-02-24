-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "webpage" TEXT,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
