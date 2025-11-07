/*
  Warnings:

  - You are about to drop the column `customerId` on the `vehicle` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `vehicle` DROP FOREIGN KEY `Vehicle_customerId_fkey`;

-- AlterTable
ALTER TABLE `vehicle` DROP COLUMN `customerId`;

-- CreateTable
CREATE TABLE `CustomerVehicle` (
    `customerId` BIGINT NOT NULL,
    `vehicleId` BIGINT NOT NULL,

    PRIMARY KEY (`customerId`, `vehicleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerVehicle` ADD CONSTRAINT `CustomerVehicle_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerVehicle` ADD CONSTRAINT `CustomerVehicle_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
