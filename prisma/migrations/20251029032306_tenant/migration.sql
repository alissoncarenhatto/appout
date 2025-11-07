-- CreateTable
CREATE TABLE `User` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `document` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vehicle` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `customerId` BIGINT NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `vin` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `Vehicle_plate_key`(`plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceCatalog` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `defaultPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `defaultDurationMin` INTEGER NULL DEFAULT 60,
    `cost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Part` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `cost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `stockQty` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Part_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkOrder` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(191) NULL,
    `customerId` BIGINT NOT NULL,
    `vehicleId` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `WorkOrder_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkOrderService` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `workOrderId` BIGINT NOT NULL,
    `serviceId` BIGINT NOT NULL,
    `qty` DECIMAL(65, 30) NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `unitCost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkOrderPart` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `workOrderId` BIGINT NOT NULL,
    `partId` BIGINT NOT NULL,
    `qty` DECIMAL(65, 30) NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `unitCost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `workOrderId` BIGINT NOT NULL,
    `method` ENUM('CASH', 'CARD', 'PIX', 'TRANSFER', 'OTHER') NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrderService` ADD CONSTRAINT `WorkOrderService_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrderService` ADD CONSTRAINT `WorkOrderService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceCatalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrderPart` ADD CONSTRAINT `WorkOrderPart_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrderPart` ADD CONSTRAINT `WorkOrderPart_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
