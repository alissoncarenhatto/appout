-- AlterTable
ALTER TABLE `part` ADD COLUMN `description` VARCHAR(191) NULL;

-- RenameIndex
ALTER TABLE `part` RENAME INDEX `Part_sku_key` TO `part_sku_key`;

-- RenameIndex
ALTER TABLE `vehicle` RENAME INDEX `Vehicle_plate_key` TO `vehicle_plate_key`;
