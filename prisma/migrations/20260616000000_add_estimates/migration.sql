CREATE TABLE `estimates` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `number` VARCHAR(191) NULL,
  `tenantId` BIGINT NULL,
  `customerId` BIGINT NOT NULL,
  `vehicleId` BIGINT NULL,
  `status` ENUM('DRAFT','SENT','APPROVED','REJECTED','EXPIRED','CANCELED') NOT NULL DEFAULT 'DRAFT',
  `title` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `subtotal` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `discount` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `total` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `validUntil` DATETIME(3) NULL,
  `sentAt` DATETIME(3) NULL,
  `approvedAt` DATETIME(3) NULL,
  `rejectedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `estimates_tenantId_idx` (`tenantId`),
  INDEX `estimates_customerId_idx` (`customerId`),
  INDEX `estimates_vehicleId_idx` (`vehicleId`),
  INDEX `estimates_status_idx` (`status`),
  INDEX `estimates_sentAt_idx` (`sentAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `estimate_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `estimateId` BIGINT NOT NULL,
  `tenantId` BIGINT NULL,
  `type` ENUM('SERVICE','PART','CUSTOM') NOT NULL,
  `serviceId` BIGINT NULL,
  `partId` BIGINT NULL,
  `description` VARCHAR(191) NOT NULL,
  `qty` DECIMAL(65,30) NOT NULL DEFAULT 1,
  `unitPrice` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `unitCost` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `discount` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `total` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `estimate_items_estimateId_idx` (`estimateId`),
  INDEX `estimate_items_tenantId_idx` (`tenantId`),
  INDEX `estimate_items_serviceId_idx` (`serviceId`),
  INDEX `estimate_items_partId_idx` (`partId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `estimates` ADD CONSTRAINT `estimates_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_estimateId_fkey` FOREIGN KEY (`estimateId`) REFERENCES `estimates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `servicecatalog`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `part`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
