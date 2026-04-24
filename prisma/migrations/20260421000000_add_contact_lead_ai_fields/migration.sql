-- AlterTable
ALTER TABLE `contact_leads`
    ADD COLUMN `aiStatus` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'SPAM') NULL AFTER `score`,
    ADD COLUMN `aiConfidence` DOUBLE NULL AFTER `aiStatus`,
    ADD COLUMN `aiReason` TEXT NULL AFTER `aiConfidence`,
    ADD COLUMN `classificationSource` VARCHAR(191) NOT NULL DEFAULT 'RULE' AFTER `aiReason`,
    ADD COLUMN `classificationModel` VARCHAR(191) NULL AFTER `classificationSource`;
