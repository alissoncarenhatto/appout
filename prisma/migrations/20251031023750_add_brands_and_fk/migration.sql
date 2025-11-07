/*
  Warnings:

  - You are about to drop the column `brand` on the `vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vehicle` DROP COLUMN `brand`,
    ADD COLUMN `brandId` BIGINT NULL;

-- CreateTable
CREATE TABLE `Brand` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Brand_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
