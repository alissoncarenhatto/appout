-- AlterTable
ALTER TABLE `financialentry` ADD COLUMN `accountId` BIGINT NULL;

-- AddForeignKey
ALTER TABLE `FinancialEntry` ADD CONSTRAINT `FinancialEntry_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `FinancialAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
