/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `categoryId` on the `Subject` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "SchoolClass" ADD COLUMN "academicYear" TEXT;
ALTER TABLE "SchoolClass" ADD COLUMN "createdById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "experience" TEXT;
ALTER TABLE "User" ADD COLUMN "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN "joinedDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "qrCode" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Category";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "academicYear" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Grade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 0,
    "present" INTEGER NOT NULL DEFAULT 0,
    "absent" INTEGER NOT NULL DEFAULT 0,
    "sick" INTEGER NOT NULL DEFAULT 0,
    "leave" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "academicYear" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchoolSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolName" TEXT NOT NULL DEFAULT 'لیسه عالی خصوصی نیکان',
    "schoolNameEn" TEXT,
    "headerTitle1" TEXT DEFAULT 'وزارت معارف',
    "headerTitle2" TEXT DEFAULT 'ریاست معارف ولایت کابل',
    "headerTitle3" TEXT DEFAULT 'آمریت معارف حوزه دوازدهم تعلیمی',
    "logoLeft" TEXT,
    "logoRight" TEXT,
    "signatureLabel1" TEXT DEFAULT 'مهر و امضاء مدیر لیسه',
    "signatureLabel2" TEXT DEFAULT 'امضاء نگران صنف',
    "signatureLabel3" TEXT DEFAULT 'امضاء سرمعلم',
    "signatureLabel4" TEXT DEFAULT 'هیئت ممتحن',
    "signatureLabel5" TEXT DEFAULT 'هیئت ممتحن (۲)',
    "signatureLabel6" TEXT DEFAULT 'آمریت حوزه تعلیمی',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_ParentChildren" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ParentChildren_A_fkey" FOREIGN KEY ("A") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ParentChildren_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Subject" ("createdAt", "id", "name", "teacherId") SELECT "createdAt", "id", "name", "teacherId" FROM "Subject";
DROP TABLE "Subject";
ALTER TABLE "new_Subject" RENAME TO "Subject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_academicYear_key" ON "Enrollment"("studentId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_subjectId_classId_type_key" ON "Grade"("studentId", "subjectId", "classId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_classId_type_key" ON "Attendance"("studentId", "classId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "_ParentChildren_AB_unique" ON "_ParentChildren"("A", "B");

-- CreateIndex
CREATE INDEX "_ParentChildren_B_index" ON "_ParentChildren"("B");
