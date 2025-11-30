/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,name]` on the table `brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,sku]` on the table `part` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `servicecatalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,plate]` on the table `vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `customervehicle` DROP FOREIGN KEY `CustomerVehicle_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `customervehicle` DROP FOREIGN KEY `CustomerVehicle_vehicleId_fkey`;

-- DropForeignKey
ALTER TABLE `model` DROP FOREIGN KEY `Model_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_workOrderId_fkey`;

-- DropForeignKey
ALTER TABLE `vehicle` DROP FOREIGN KEY `Vehicle_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `vehicle` DROP FOREIGN KEY `Vehicle_modelId_fkey`;

-- DropForeignKey
ALTER TABLE `workorder` DROP FOREIGN KEY `WorkOrder_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `workorder` DROP FOREIGN KEY `WorkOrder_vehicleId_fkey`;

-- DropForeignKey
ALTER TABLE `workorderpart` DROP FOREIGN KEY `WorkOrderPart_partId_fkey`;

-- DropForeignKey
ALTER TABLE `workorderpart` DROP FOREIGN KEY `WorkOrderPart_workOrderId_fkey`;

-- DropForeignKey
ALTER TABLE `workorderservice` DROP FOREIGN KEY `WorkOrderService_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `workorderservice` DROP FOREIGN KEY `WorkOrderService_workOrderId_fkey`;

-- DropIndex
DROP INDEX `Brand_name_key` ON `brand`;

-- DropIndex
DROP INDEX `part_sku_key` ON `part`;

-- DropIndex
DROP INDEX `vehicle_plate_key` ON `vehicle`;

-- DropIndex
DROP INDEX `WorkOrder_number_key` ON `workorder`;

-- AlterTable
ALTER TABLE `brand` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `model` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `part` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `servicecatalog` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `vehicle` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `workorder` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `workorderpart` ADD COLUMN `tenantId` BIGINT NULL;

-- AlterTable
ALTER TABLE `workorderservice` ADD COLUMN `tenantId` BIGINT NULL;

-- CreateTable
CREATE TABLE `tenant` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tenant_name_key`(`name`),
    UNIQUE INDEX `tenant_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `brand_tenantId_idx` ON `brand`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `brand_tenantId_name_key` ON `brand`(`tenantId`, `name`);

-- CreateIndex
CREATE INDEX `customer_tenantId_idx` ON `customer`(`tenantId`);

-- CreateIndex
CREATE INDEX `model_tenantId_idx` ON `model`(`tenantId`);

-- CreateIndex
CREATE INDEX `part_tenantId_idx` ON `part`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `part_tenantId_sku_key` ON `part`(`tenantId`, `sku`);

-- CreateIndex
CREATE INDEX `servicecatalog_tenantId_idx` ON `servicecatalog`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `servicecatalog_tenantId_name_key` ON `servicecatalog`(`tenantId`, `name`);

-- CreateIndex
CREATE INDEX `user_tenantId_idx` ON `user`(`tenantId`);

-- CreateIndex
CREATE INDEX `vehicle_tenantId_idx` ON `vehicle`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `vehicle_tenantId_plate_key` ON `vehicle`(`tenantId`, `plate`);

-- CreateIndex
CREATE INDEX `workorder_tenantId_idx` ON `workorder`(`tenantId`);

-- CreateIndex
CREATE INDEX `workorderpart_tenantId_idx` ON `workorderpart`(`tenantId`);

-- CreateIndex
CREATE INDEX `workorderservice_tenantId_idx` ON `workorderservice`(`tenantId`);

-- AddForeignKey
ALTER TABLE `brand` ADD CONSTRAINT `brand_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer` ADD CONSTRAINT `customer_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model` ADD CONSTRAINT `model_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model` ADD CONSTRAINT `model_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `part` ADD CONSTRAINT `part_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `workorder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicecatalog` ADD CONSTRAINT `servicecatalog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `model`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customervehicle` ADD CONSTRAINT `customervehicle_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customervehicle` ADD CONSTRAINT `customervehicle_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorder` ADD CONSTRAINT `workorder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorder` ADD CONSTRAINT `workorder_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorder` ADD CONSTRAINT `workorder_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorderpart` ADD CONSTRAINT `workorderpart_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `part`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorderpart` ADD CONSTRAINT `workorderpart_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `workorder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorderpart` ADD CONSTRAINT `workorderpart_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorderservice` ADD CONSTRAINT `workorderservice_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `servicecatalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorderservice` ADD CONSTRAINT `workorderservice_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `workorder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorderservice` ADD CONSTRAINT `workorderservice_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `customervehicle` RENAME INDEX `CustomerVehicle_vehicleId_fkey` TO `customervehicle_vehicleId_idx`;

-- RenameIndex
ALTER TABLE `model` RENAME INDEX `Model_brandId_fkey` TO `model_brandId_idx`;

-- RenameIndex
ALTER TABLE `payment` RENAME INDEX `Payment_workOrderId_fkey` TO `payment_workOrderId_idx`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_email_key` TO `user_email_key`;

-- RenameIndex
ALTER TABLE `vehicle` RENAME INDEX `Vehicle_modelId_fkey` TO `vehicle_modelId_idx`;

-- RenameIndex
ALTER TABLE `workorder` RENAME INDEX `WorkOrder_customerId_fkey` TO `workorder_customerId_idx`;

-- RenameIndex
ALTER TABLE `workorder` RENAME INDEX `WorkOrder_vehicleId_fkey` TO `workorder_vehicleId_idx`;

-- RenameIndex
ALTER TABLE `workorderpart` RENAME INDEX `WorkOrderPart_partId_fkey` TO `workorderpart_partId_idx`;

-- RenameIndex
ALTER TABLE `workorderpart` RENAME INDEX `WorkOrderPart_workOrderId_fkey` TO `workorderpart_workOrderId_idx`;

-- RenameIndex
ALTER TABLE `workorderservice` RENAME INDEX `WorkOrderService_serviceId_fkey` TO `workorderservice_serviceId_idx`;

-- RenameIndex
ALTER TABLE `workorderservice` RENAME INDEX `WorkOrderService_workOrderId_fkey` TO `workorderservice_workOrderId_idx`;
