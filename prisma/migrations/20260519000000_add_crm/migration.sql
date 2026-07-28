ALTER TABLE `contact_leads` ADD COLUMN `tenantId` BIGINT NULL;
ALTER TABLE `contact_leads` ADD INDEX `contact_leads_tenantId_idx` (`tenantId`);
CREATE TABLE `crm_pipelines` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenantId` BIGINT NULL,
  `name` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `crm_pipelines_tenantId_name_key` (`tenantId`, `name`),
  INDEX `crm_pipelines_tenantId_idx` (`tenantId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_pipeline_stages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenantId` BIGINT NULL,
  `pipelineId` BIGINT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  `color` VARCHAR(32) NULL,
  `isWon` BOOLEAN NOT NULL DEFAULT false,
  `isLost` BOOLEAN NOT NULL DEFAULT false,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `crm_pipeline_stages_tenantId_idx` (`tenantId`),
  INDEX `crm_pipeline_stages_pipelineId_idx` (`pipelineId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_deals` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenantId` BIGINT NULL,
  `pipelineId` BIGINT NULL,
  `stageId` BIGINT NULL,
  `customerId` BIGINT NULL,
  `leadId` BIGINT NULL,
  `ownerUserId` BIGINT NULL,
  `title` VARCHAR(191) NOT NULL,
  `value` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `status` ENUM('OPEN','WON','LOST','CANCELED') NOT NULL DEFAULT 'OPEN',
  `source` VARCHAR(191) NULL,
  `lostReason` VARCHAR(191) NULL,
  `expectedCloseAt` DATETIME(3) NULL,
  `closedAt` DATETIME(3) NULL,
  `notes` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `crm_deals_tenantId_idx` (`tenantId`),
  INDEX `crm_deals_pipelineId_idx` (`pipelineId`),
  INDEX `crm_deals_stageId_idx` (`stageId`),
  INDEX `crm_deals_customerId_idx` (`customerId`),
  INDEX `crm_deals_leadId_idx` (`leadId`),
  INDEX `crm_deals_ownerUserId_idx` (`ownerUserId`),
  INDEX `crm_deals_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_activities` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenantId` BIGINT NULL,
  `dealId` BIGINT NULL,
  `customerId` BIGINT NULL,
  `leadId` BIGINT NULL,
  `userId` BIGINT NULL,
  `type` ENUM('NOTE','CALL','WHATSAPP','EMAIL','MEETING','VISIT','PROPOSAL','FOLLOW_UP','OTHER') NOT NULL DEFAULT 'NOTE',
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `happenedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `crm_activities_tenantId_idx` (`tenantId`),
  INDEX `crm_activities_dealId_idx` (`dealId`),
  INDEX `crm_activities_customerId_idx` (`customerId`),
  INDEX `crm_activities_leadId_idx` (`leadId`),
  INDEX `crm_activities_userId_idx` (`userId`),
  INDEX `crm_activities_happenedAt_idx` (`happenedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_tasks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenantId` BIGINT NULL,
  `dealId` BIGINT NULL,
  `customerId` BIGINT NULL,
  `leadId` BIGINT NULL,
  `assignedToId` BIGINT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `status` ENUM('OPEN','DONE','CANCELED') NOT NULL DEFAULT 'OPEN',
  `dueAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `crm_tasks_tenantId_idx` (`tenantId`),
  INDEX `crm_tasks_dealId_idx` (`dealId`),
  INDEX `crm_tasks_customerId_idx` (`customerId`),
  INDEX `crm_tasks_leadId_idx` (`leadId`),
  INDEX `crm_tasks_assignedToId_idx` (`assignedToId`),
  INDEX `crm_tasks_status_idx` (`status`),
  INDEX `crm_tasks_dueAt_idx` (`dueAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `contact_leads` ADD CONSTRAINT `contact_leads_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_pipelines` ADD CONSTRAINT `crm_pipelines_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_pipeline_stages` ADD CONSTRAINT `crm_pipeline_stages_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_pipeline_stages` ADD CONSTRAINT `crm_pipeline_stages_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `crm_pipelines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `crm_pipelines`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `crm_pipeline_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `contact_leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `crm_deals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `contact_leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_tasks` ADD CONSTRAINT `crm_tasks_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_tasks` ADD CONSTRAINT `crm_tasks_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `crm_deals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_tasks` ADD CONSTRAINT `crm_tasks_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_tasks` ADD CONSTRAINT `crm_tasks_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `contact_leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `crm_tasks` ADD CONSTRAINT `crm_tasks_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
