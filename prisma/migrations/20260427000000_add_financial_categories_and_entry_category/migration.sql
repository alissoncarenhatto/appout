-- CreateTable
CREATE TABLE `FinancialCategory` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(32) NULL,
    `icon` VARCHAR(64) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `tenantId` BIGINT NULL,

    INDEX `FinancialCategory_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `FinancialCategory_tenantId_name_key`(`tenantId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `FinancialEntry` ADD COLUMN `categoryId` BIGINT NULL;

-- CreateIndex
CREATE INDEX `FinancialEntry_categoryId_idx` ON `FinancialEntry`(`categoryId`);
CREATE INDEX `FinancialEntry_accountId_idx` ON `FinancialEntry`(`accountId`);
CREATE INDEX `FinancialEntry_paymentMethodId_idx` ON `FinancialEntry`(`paymentMethodId`);
CREATE INDEX `FinancialEntry_workOrderId_idx` ON `FinancialEntry`(`workOrderId`);
CREATE INDEX `FinancialEntry_dueDate_idx` ON `FinancialEntry`(`dueDate`);

-- AddForeignKey
ALTER TABLE `FinancialCategory` ADD CONSTRAINT `FinancialCategory_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialEntry` ADD CONSTRAINT `FinancialEntry_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FinancialCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
