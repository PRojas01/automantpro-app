// Generado desde scripts/db/automantpro_mysql_schema_v2_seguro.sql y automantpro_mysql_v1_a_v2_seguro.sql
// (probados en MySQL 8). No editar a mano: regenerar si cambia el esquema.
export const EXPECTED_TABLES = [
    "User",
    "Vehicle",
    "ServiceSchedule",
    "Alert",
    "Shop",
    "Store",
    "Product",
    "ProductVehicle",
    "Appointment",
    "Service",
    "Order",
    "OrderLine",
    "Session",
    "Conversation",
    "Message",
    "Event",
    "AuditLog",
    "ToolCall",
    "LlmUsage",
    "PromptVersion",
    "Feedback",
    "DiagnosisOutcome",
    "Subscription",
    "Transaction",
    "Rating"
];
export const SCHEMA_STATEMENTS = [
    {
        "kind": "createTable",
        "target": "User",
        "sql": "CREATE TABLE IF NOT EXISTS `User` (\n    `id` VARCHAR(191) NOT NULL,\n    `email` VARCHAR(191) NULL,\n    `phone` VARCHAR(191) NOT NULL,\n    `passwordHash` VARCHAR(191) NOT NULL,\n    `role` ENUM('dueno', 'taller', 'almacen', 'admin') NOT NULL,\n    `name` VARCHAR(191) NOT NULL,\n    `locale` VARCHAR(191) NOT NULL DEFAULT 'es',\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n    `deletedAt` DATETIME(3) NULL,\n\n    UNIQUE INDEX `User_email_key`(`email`),\n    UNIQUE INDEX `User_phone_key`(`phone`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Vehicle",
        "sql": "CREATE TABLE IF NOT EXISTS `Vehicle` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `make` VARCHAR(191) NOT NULL,\n    `model` VARCHAR(191) NOT NULL,\n    `year` INTEGER NOT NULL,\n    `currentKm` INTEGER NOT NULL,\n    `plan` JSON NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n    `deletedAt` DATETIME(3) NULL,\n\n    INDEX `Vehicle_userId_idx`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "ServiceSchedule",
        "sql": "CREATE TABLE IF NOT EXISTS `ServiceSchedule` (\n    `id` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NOT NULL,\n    `task` VARCHAR(191) NOT NULL,\n    `intervalKm` INTEGER NULL,\n    `dueDate` DATETIME(3) NULL,\n    `lastDoneAt` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `ServiceSchedule_vehicleId_idx`(`vehicleId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Alert",
        "sql": "CREATE TABLE IF NOT EXISTS `Alert` (\n    `id` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NOT NULL,\n    `label` VARCHAR(191) NOT NULL,\n    `dueKm` INTEGER NULL,\n    `dueAt` DATETIME(3) NULL,\n    `triggeredAt` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Alert_vehicleId_idx`(`vehicleId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Shop",
        "sql": "CREATE TABLE IF NOT EXISTS `Shop` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `name` VARCHAR(191) NOT NULL,\n    `address` VARCHAR(191) NOT NULL,\n    `city` VARCHAR(191) NOT NULL,\n    `lat` DOUBLE NULL,\n    `lng` DOUBLE NULL,\n    `specialties` JSON NULL,\n    `verificationStatus` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',\n    `ratingAvg` DOUBLE NOT NULL DEFAULT 0,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    UNIQUE INDEX `Shop_userId_key`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Store",
        "sql": "CREATE TABLE IF NOT EXISTS `Store` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `name` VARCHAR(191) NOT NULL,\n    `address` VARCHAR(191) NOT NULL,\n    `city` VARCHAR(191) NOT NULL,\n    `lat` DOUBLE NULL,\n    `lng` DOUBLE NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    UNIQUE INDEX `Store_userId_key`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Product",
        "sql": "CREATE TABLE IF NOT EXISTS `Product` (\n    `id` VARCHAR(191) NOT NULL,\n    `storeId` VARCHAR(191) NOT NULL,\n    `name` VARCHAR(191) NOT NULL,\n    `price` DECIMAL(10, 2) NOT NULL,\n    `stock` INTEGER NULL DEFAULT 0,\n    `image` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    INDEX `Product_storeId_idx`(`storeId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "ProductVehicle",
        "sql": "CREATE TABLE IF NOT EXISTS `ProductVehicle` (\n    `id` VARCHAR(191) NOT NULL,\n    `productId` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NOT NULL,\n\n    UNIQUE INDEX `ProductVehicle_productId_vehicleId_key`(`productId`, `vehicleId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Appointment",
        "sql": "CREATE TABLE IF NOT EXISTS `Appointment` (\n    `id` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NOT NULL,\n    `shopId` VARCHAR(191) NOT NULL,\n    `ownerId` VARCHAR(191) NOT NULL,\n    `scheduledAt` DATETIME(3) NOT NULL,\n    `status` ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',\n    `summary` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Appointment_shopId_scheduledAt_idx`(`shopId`, `scheduledAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Service",
        "sql": "CREATE TABLE IF NOT EXISTS `Service` (\n    `id` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NOT NULL,\n    `shopId` VARCHAR(191) NOT NULL,\n    `appointmentId` VARCHAR(191) NULL,\n    `description` TEXT NOT NULL,\n    `cost` DECIMAL(10, 2) NULL,\n    `photos` JSON NULL,\n    `status` VARCHAR(191) NOT NULL DEFAULT 'done',\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Service_vehicleId_idx`(`vehicleId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Order",
        "sql": "CREATE TABLE IF NOT EXISTS `Order` (\n    `id` VARCHAR(191) NOT NULL,\n    `orderType` ENUM('service', 'repuesto') NOT NULL,\n    `fromUserId` VARCHAR(191) NOT NULL,\n    `toShopId` VARCHAR(191) NULL,\n    `toStoreId` VARCHAR(191) NULL,\n    `status` ENUM('requested', 'accepted', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'requested',\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Order_fromUserId_idx`(`fromUserId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "OrderLine",
        "sql": "CREATE TABLE IF NOT EXISTS `OrderLine` (\n    `id` VARCHAR(191) NOT NULL,\n    `orderId` VARCHAR(191) NOT NULL,\n    `productId` VARCHAR(191) NULL,\n    `itemName` VARCHAR(191) NOT NULL,\n    `qty` INTEGER NOT NULL DEFAULT 1,\n    `unitPrice` DECIMAL(10, 2) NULL,\n\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Session",
        "sql": "CREATE TABLE IF NOT EXISTS `Session` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `role` ENUM('dueno', 'taller', 'almacen', 'admin') NOT NULL DEFAULT 'dueno',\n    `flow` VARCHAR(191) NULL,\n    `step` VARCHAR(191) NULL,\n    `data` JSON NULL,\n    `expiresAt` DATETIME(3) NOT NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Session_userId_role_idx`(`userId`, `role`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Conversation",
        "sql": "CREATE TABLE IF NOT EXISTS `Conversation` (\n    `id` VARCHAR(191) NOT NULL,\n    `userAId` VARCHAR(191) NOT NULL,\n    `userBId` VARCHAR(191) NULL,\n    `agent` BOOLEAN NOT NULL DEFAULT false,\n    `summary` TEXT NULL,\n    `turnCount` INTEGER NOT NULL DEFAULT 0,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    INDEX `Conversation_userAId_updatedAt_idx`(`userAId`, `updatedAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Message",
        "sql": "CREATE TABLE IF NOT EXISTS `Message` (\n    `id` VARCHAR(191) NOT NULL,\n    `conversationId` VARCHAR(191) NOT NULL,\n    `wamid` VARCHAR(191) NULL,\n    `from` VARCHAR(191) NOT NULL,\n    `direction` ENUM('incoming', 'outgoing') NOT NULL DEFAULT 'incoming',\n    `type` ENUM('text', 'audio', 'image', 'button', 'location', 'document', 'video', 'sticker', 'reaction', 'contacts', 'unknown') NOT NULL DEFAULT 'text',\n    `body` TEXT NULL,\n    `payload` JSON NULL,\n    `costUsd` DECIMAL(10, 6) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    UNIQUE INDEX `Message_wamid_key`(`wamid`),\n    INDEX `Message_conversationId_createdAt_idx`(`conversationId`, `createdAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Event",
        "sql": "CREATE TABLE IF NOT EXISTS `Event` (\n    `id` VARCHAR(191) NOT NULL,\n    `type` VARCHAR(191) NOT NULL,\n    `actorUserId` VARCHAR(191) NULL,\n    `actorRole` ENUM('dueno', 'taller', 'almacen', 'admin') NULL,\n    `entityType` VARCHAR(191) NULL,\n    `entityId` VARCHAR(191) NULL,\n    `payload` JSON NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Event_type_createdAt_idx`(`type`, `createdAt`),\n    INDEX `Event_actorUserId_idx`(`actorUserId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "AuditLog",
        "sql": "CREATE TABLE IF NOT EXISTS `AuditLog` (\n    `id` VARCHAR(191) NOT NULL,\n    `eventType` VARCHAR(191) NOT NULL,\n    `actorUserId` VARCHAR(191) NULL,\n    `actorRole` ENUM('dueno', 'taller', 'almacen', 'admin') NULL,\n    `entityType` VARCHAR(191) NULL,\n    `entityId` VARCHAR(191) NULL,\n    `before` JSON NULL,\n    `after` JSON NULL,\n    `reason` TEXT NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `AuditLog_createdAt_idx`(`createdAt`),\n    INDEX `AuditLog_actorUserId_idx`(`actorUserId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "ToolCall",
        "sql": "CREATE TABLE IF NOT EXISTS `ToolCall` (\n    `id` VARCHAR(191) NOT NULL,\n    `conversationId` VARCHAR(191) NULL,\n    `agent` VARCHAR(191) NOT NULL,\n    `tool` VARCHAR(191) NOT NULL,\n    `args` JSON NULL,\n    `resultStatus` VARCHAR(191) NOT NULL,\n    `durationMs` INTEGER NOT NULL DEFAULT 0,\n    `confirmedByUser` BOOLEAN NOT NULL DEFAULT false,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `ToolCall_conversationId_idx`(`conversationId`),\n    INDEX `ToolCall_tool_idx`(`tool`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "LlmUsage",
        "sql": "CREATE TABLE IF NOT EXISTS `LlmUsage` (\n    `id` VARCHAR(191) NOT NULL,\n    `agent` VARCHAR(191) NOT NULL,\n    `function` VARCHAR(191) NOT NULL,\n    `provider` VARCHAR(191) NOT NULL,\n    `model` VARCHAR(191) NOT NULL,\n    `promptVersion` VARCHAR(191) NULL,\n    `inputTokens` INTEGER NOT NULL DEFAULT 0,\n    `outputTokens` INTEGER NOT NULL DEFAULT 0,\n    `cachedTokens` INTEGER NOT NULL DEFAULT 0,\n    `costUsd` DECIMAL(10, 6) NULL,\n    `latencyMs` INTEGER NULL,\n    `outcome` ENUM('ok', 'fallback', 'error') NOT NULL DEFAULT 'ok',\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `LlmUsage_createdAt_idx`(`createdAt`),\n    INDEX `LlmUsage_agent_idx`(`agent`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "PromptVersion",
        "sql": "CREATE TABLE IF NOT EXISTS `PromptVersion` (\n    `id` VARCHAR(191) NOT NULL,\n    `agent` VARCHAR(191) NOT NULL,\n    `version` VARCHAR(191) NOT NULL,\n    `textHash` VARCHAR(191) NULL,\n    `evalScore` DOUBLE NULL,\n    `publishedAt` DATETIME(3) NULL,\n    `active` BOOLEAN NOT NULL DEFAULT false,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    UNIQUE INDEX `PromptVersion_textHash_key`(`textHash`),\n    UNIQUE INDEX `PromptVersion_agent_version_key`(`agent`, `version`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Feedback",
        "sql": "CREATE TABLE IF NOT EXISTS `Feedback` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NULL,\n    `target` VARCHAR(191) NOT NULL,\n    `score` INTEGER NOT NULL,\n    `comment` TEXT NULL,\n    `sentiment` VARCHAR(191) NULL,\n    `reason` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Feedback_userId_idx`(`userId`),\n    INDEX `Feedback_score_idx`(`score`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "DiagnosisOutcome",
        "sql": "CREATE TABLE IF NOT EXISTS `DiagnosisOutcome` (\n    `id` VARCHAR(191) NOT NULL,\n    `diagnosisId` VARCHAR(191) NOT NULL,\n    `workOrderId` VARCHAR(191) NULL,\n    `outcome` ENUM('confirmed', 'partial', 'incorrect') NOT NULL,\n    `realCause` TEXT NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `DiagnosisOutcome_diagnosisId_idx`(`diagnosisId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Subscription",
        "sql": "CREATE TABLE IF NOT EXISTS `Subscription` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `plan` VARCHAR(191) NOT NULL,\n    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `expiresAt` DATETIME(3) NOT NULL,\n    `active` BOOLEAN NOT NULL DEFAULT true,\n\n    INDEX `Subscription_userId_idx`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Transaction",
        "sql": "CREATE TABLE IF NOT EXISTS `Transaction` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `kind` VARCHAR(191) NOT NULL,\n    `amount` DECIMAL(10, 2) NOT NULL,\n    `status` VARCHAR(191) NOT NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Transaction_userId_idx`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "createTable",
        "target": "Rating",
        "sql": "CREATE TABLE IF NOT EXISTS `Rating` (\n    `id` VARCHAR(191) NOT NULL,\n    `fromId` VARCHAR(191) NOT NULL,\n    `toId` VARCHAR(191) NOT NULL,\n    `score` INTEGER NOT NULL,\n    `comment` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    },
    {
        "kind": "update",
        "target": "Service.description",
        "sql": "UPDATE `Service` SET `description` = '' WHERE `description` IS NULL"
    },
    {
        "kind": "modifyColumn",
        "target": "Service.description",
        "sql": "ALTER TABLE `Service` MODIFY `description` TEXT NOT NULL"
    },
    {
        "kind": "addColumn",
        "target": "Conversation.summary",
        "sql": "ALTER TABLE `Conversation` ADD COLUMN `summary` TEXT NULL"
    },
    {
        "kind": "addColumn",
        "target": "Conversation.turnCount",
        "sql": "ALTER TABLE `Conversation` ADD COLUMN `turnCount` INTEGER NOT NULL DEFAULT 0"
    },
    {
        "kind": "addColumn",
        "target": "Conversation.updatedAt",
        "sql": "ALTER TABLE `Conversation` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)"
    },
    {
        "kind": "addColumn",
        "target": "Message.costUsd",
        "sql": "ALTER TABLE `Message` ADD COLUMN `costUsd` DECIMAL(10, 6) NULL"
    },
    {
        "kind": "addColumn",
        "target": "Message.direction",
        "sql": "ALTER TABLE `Message` ADD COLUMN `direction` ENUM('incoming', 'outgoing') NOT NULL DEFAULT 'incoming'"
    },
    {
        "kind": "addColumn",
        "target": "Message.payload",
        "sql": "ALTER TABLE `Message` ADD COLUMN `payload` JSON NULL"
    },
    {
        "kind": "addColumn",
        "target": "Message.type",
        "sql": "ALTER TABLE `Message` ADD COLUMN `type` ENUM('text', 'audio', 'image', 'button', 'location', 'document', 'video', 'sticker', 'reaction', 'contacts', 'unknown') NOT NULL DEFAULT 'text'"
    },
    {
        "kind": "addColumn",
        "target": "Message.wamid",
        "sql": "ALTER TABLE `Message` ADD COLUMN `wamid` VARCHAR(191) NULL"
    },
    {
        "kind": "modifyColumn",
        "target": "Message.body",
        "sql": "ALTER TABLE `Message` MODIFY `body` TEXT NULL"
    },
    {
        "kind": "createIndex",
        "target": "Conversation.Conversation_userAId_updatedAt_idx",
        "sql": "CREATE INDEX `Conversation_userAId_updatedAt_idx` ON `Conversation`(`userAId`, `updatedAt`)"
    },
    {
        "kind": "createIndex",
        "target": "Message.Message_wamid_key",
        "sql": "CREATE UNIQUE INDEX `Message_wamid_key` ON `Message`(`wamid`)"
    },
    {
        "kind": "createIndex",
        "target": "Message.Message_conversationId_createdAt_idx",
        "sql": "CREATE INDEX `Message_conversationId_createdAt_idx` ON `Message`(`conversationId`, `createdAt`)"
    },
    {
        "kind": "addForeignKey",
        "target": "Vehicle.Vehicle_userId_fkey",
        "sql": "ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "ServiceSchedule.ServiceSchedule_vehicleId_fkey",
        "sql": "ALTER TABLE `ServiceSchedule` ADD CONSTRAINT `ServiceSchedule_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Alert.Alert_vehicleId_fkey",
        "sql": "ALTER TABLE `Alert` ADD CONSTRAINT `Alert_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Shop.Shop_userId_fkey",
        "sql": "ALTER TABLE `Shop` ADD CONSTRAINT `Shop_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Store.Store_userId_fkey",
        "sql": "ALTER TABLE `Store` ADD CONSTRAINT `Store_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Product.Product_storeId_fkey",
        "sql": "ALTER TABLE `Product` ADD CONSTRAINT `Product_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "ProductVehicle.ProductVehicle_productId_fkey",
        "sql": "ALTER TABLE `ProductVehicle` ADD CONSTRAINT `ProductVehicle_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "ProductVehicle.ProductVehicle_vehicleId_fkey",
        "sql": "ALTER TABLE `ProductVehicle` ADD CONSTRAINT `ProductVehicle_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Appointment.Appointment_vehicleId_fkey",
        "sql": "ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Appointment.Appointment_shopId_fkey",
        "sql": "ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Appointment.Appointment_ownerId_fkey",
        "sql": "ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Service.Service_vehicleId_fkey",
        "sql": "ALTER TABLE `Service` ADD CONSTRAINT `Service_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Service.Service_shopId_fkey",
        "sql": "ALTER TABLE `Service` ADD CONSTRAINT `Service_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Order.Order_fromUserId_fkey",
        "sql": "ALTER TABLE `Order` ADD CONSTRAINT `Order_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Order.Order_toStoreId_fkey",
        "sql": "ALTER TABLE `Order` ADD CONSTRAINT `Order_toStoreId_fkey` FOREIGN KEY (`toStoreId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "OrderLine.OrderLine_orderId_fkey",
        "sql": "ALTER TABLE `OrderLine` ADD CONSTRAINT `OrderLine_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "OrderLine.OrderLine_productId_fkey",
        "sql": "ALTER TABLE `OrderLine` ADD CONSTRAINT `OrderLine_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Conversation.Conversation_userAId_fkey",
        "sql": "ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_userAId_fkey` FOREIGN KEY (`userAId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Conversation.Conversation_userBId_fkey",
        "sql": "ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_userBId_fkey` FOREIGN KEY (`userBId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Message.Message_conversationId_fkey",
        "sql": "ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Subscription.Subscription_userId_fkey",
        "sql": "ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    },
    {
        "kind": "addForeignKey",
        "target": "Transaction.Transaction_userId_fkey",
        "sql": "ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
    }
];
//# sourceMappingURL=statements.js.map