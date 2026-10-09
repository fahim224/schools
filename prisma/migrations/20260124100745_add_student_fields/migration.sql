/*
  Warnings:

  - A unique constraint covering the columns `[studentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "currentAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "fatherName" TEXT;
ALTER TABLE "User" ADD COLUMN "fatherNameEn" TEXT;
ALTER TABLE "User" ADD COLUMN "grandfatherName" TEXT;
ALTER TABLE "User" ADD COLUMN "grandfatherNameEn" TEXT;
ALTER TABLE "User" ADD COLUMN "maternalCousin" TEXT;
ALTER TABLE "User" ADD COLUMN "maternalUncle" TEXT;
ALTER TABLE "User" ADD COLUMN "nameEn" TEXT;
ALTER TABLE "User" ADD COLUMN "paternalCousin" TEXT;
ALTER TABLE "User" ADD COLUMN "paternalUncle" TEXT;
ALTER TABLE "User" ADD COLUMN "permanentAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "studentId" TEXT;
ALTER TABLE "User" ADD COLUMN "surname" TEXT;
ALTER TABLE "User" ADD COLUMN "surnameEn" TEXT;
ALTER TABLE "User" ADD COLUMN "tazkiraNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");
