/*
  Warnings:

  - Added the required column `credentialID` to the `passkey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "passkey" ADD COLUMN     "credentialID" TEXT NOT NULL;
