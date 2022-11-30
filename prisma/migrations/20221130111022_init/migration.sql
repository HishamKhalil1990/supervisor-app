/*
  Warnings:

  - Added the required column `Supervisor` to the `requestItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requestitems` ADD COLUMN `Supervisor` VARCHAR(191) NOT NULL;
