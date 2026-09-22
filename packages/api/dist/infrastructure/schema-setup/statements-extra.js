// Sentencias agregadas a mano (no provienen de los SQL generados). Se aplican después de
// SCHEMA_STATEMENTS con las mismas comprobaciones de existencia. Solo agregan: nunca borran.
export const EXTRA_TABLES = [
    "AdminTotp",
    "AppSetting",
    "WorkOrder",
    "WorkOrderItem",
    "QuoteRequest",
    "Quote",
    "Relationship",
    "RelationshipParty",
    "RelationshipMessage",
    "Dispute",
    "Sanction",
    "DataRequest",
    "Visit",
    "ServiceRequest",
    "ServiceOffer",
];
/** Ajustes editables desde el panel (por ejemplo, el número público de WhatsApp). */
export const APP_SETTING_TABLE_SQL = "CREATE TABLE IF NOT EXISTS `AppSetting` (\n    `name` VARCHAR(191) NOT NULL,\n    `value` TEXT NOT NULL,\n    `updatedBy` VARCHAR(191) NULL,\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    PRIMARY KEY (`name`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
function addColumn(table, column, definition) {
    return { kind: "addColumn", target: `${table}.${column}`, sql: `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}` };
}
export const EXTRA_STATEMENTS = [
    {
        kind: "createTable",
        target: "AdminTotp",
        sql: "CREATE TABLE IF NOT EXISTS `AdminTotp` (\n    `userId` VARCHAR(191) NOT NULL,\n    `secret` VARCHAR(191) NOT NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    PRIMARY KEY (`userId`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "addForeignKey",
        target: "AdminTotp.AdminTotp_userId_fkey",
        sql: "ALTER TABLE `AdminTotp` ADD CONSTRAINT `AdminTotp_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "createTable",
        target: "AppSetting",
        sql: APP_SETTING_TABLE_SQL,
    },
    // Registro por perfil (docs/33 §2.3): datos básicos, consentimiento y datos del vehículo o negocio.
    addColumn("User", "city", "VARCHAR(191) NULL"),
    addColumn("User", "consentAt", "DATETIME(3) NULL"),
    addColumn("User", "consentVersion", "VARCHAR(191) NULL"),
    addColumn("User", "source", "VARCHAR(191) NULL"),
    addColumn("User", "notes", "TEXT NULL"),
    // Rol del equipo del panel; nulo en las cuentas creadas antes de los roles (administrador).
    addColumn("User", "staffRole", "VARCHAR(20) NULL"),
    addColumn("Vehicle", "vehicleClass", "VARCHAR(191) NULL"),
    addColumn("Vehicle", "fuel", "VARCHAR(191) NULL"),
    addColumn("Vehicle", "plate", "VARCHAR(191) NULL"),
    addColumn("Vehicle", "usageProfile", "VARCHAR(191) NULL"),
    addColumn("Vehicle", "remindersOptIn", "BOOLEAN NOT NULL DEFAULT false"),
    addColumn("Shop", "ruc", "VARCHAR(191) NULL"),
    addColumn("Shop", "zone", "VARCHAR(191) NULL"),
    addColumn("Shop", "hours", "VARCHAR(191) NULL"),
    addColumn("Shop", "contactName", "VARCHAR(191) NULL"),
    addColumn("Shop", "email", "VARCHAR(191) NULL"),
    addColumn("Store", "ruc", "VARCHAR(191) NULL"),
    addColumn("Store", "zone", "VARCHAR(191) NULL"),
    addColumn("Store", "hours", "VARCHAR(191) NULL"),
    addColumn("Store", "contactName", "VARCHAR(191) NULL"),
    addColumn("Store", "email", "VARCHAR(191) NULL"),
    addColumn("Store", "categories", "TEXT NULL"),
    addColumn("Store", "delivery", "BOOLEAN NOT NULL DEFAULT false"),
    addColumn("Store", "verificationStatus", "ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending'"),
    // Turnos agendados desde el panel (docs/34 D5 y T3).
    addColumn("Appointment", "services", "JSON NULL"),
    addColumn("Appointment", "notes", "TEXT NULL"),
    addColumn("Appointment", "cancelReason", "VARCHAR(191) NULL"),
    addColumn("Appointment", "updatedAt", "DATETIME(3) NULL"),
    // Órdenes de trabajo del taller (docs/34 T4–T6).
    {
        kind: "createTable",
        target: "WorkOrder",
        sql: "CREATE TABLE IF NOT EXISTS `WorkOrder` (\n    `id` VARCHAR(191) NOT NULL,\n    `number` INTEGER NOT NULL,\n    `shopId` VARCHAR(191) NOT NULL,\n    `ownerId` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NOT NULL,\n    `appointmentId` VARCHAR(191) NULL,\n    `status` VARCHAR(40) NOT NULL DEFAULT 'recepcion',\n    `intakeKm` INTEGER NULL,\n    `intakeNotes` TEXT NULL,\n    `diagnosis` TEXT NULL,\n    `rejectionReason` VARCHAR(191) NULL,\n    `cancelReason` VARCHAR(191) NULL,\n    `exitKm` INTEGER NULL,\n    `warrantyDays` INTEGER NULL,\n    `nextService` VARCHAR(191) NULL,\n    `diagnosisOutcome` VARCHAR(20) NULL,\n    `outcomeNote` VARCHAR(191) NULL,\n    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `closedAt` DATETIME(3) NULL,\n\n    UNIQUE INDEX `WorkOrder_number_key`(`number`),\n    INDEX `WorkOrder_shopId_status_idx`(`shopId`, `status`),\n    INDEX `WorkOrder_vehicleId_idx`(`vehicleId`),\n    INDEX `WorkOrder_appointmentId_idx`(`appointmentId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "createTable",
        target: "WorkOrderItem",
        sql: "CREATE TABLE IF NOT EXISTS `WorkOrderItem` (\n    `id` VARCHAR(191) NOT NULL,\n    `workOrderId` VARCHAR(191) NOT NULL,\n    `kind` VARCHAR(20) NOT NULL,\n    `description` VARCHAR(191) NOT NULL,\n    `brand` VARCHAR(191) NULL,\n    `partCode` VARCHAR(191) NULL,\n    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1,\n    `unitPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `WorkOrderItem_workOrderId_idx`(`workOrderId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "addForeignKey",
        target: "WorkOrder.WorkOrder_shopId_fkey",
        sql: "ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "WorkOrder.WorkOrder_ownerId_fkey",
        sql: "ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "WorkOrder.WorkOrder_vehicleId_fkey",
        sql: "ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "WorkOrderItem.WorkOrderItem_workOrderId_fkey",
        sql: "ALTER TABLE `WorkOrderItem` ADD CONSTRAINT `WorkOrderItem_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE",
    },
    // Cotizaciones de repuestos y pedidos a almacenes (docs/34 D9, A4, A5 y T9).
    {
        kind: "createTable",
        target: "QuoteRequest",
        sql: "CREATE TABLE IF NOT EXISTS `QuoteRequest` (\n    `id` VARCHAR(191) NOT NULL,\n    `number` INTEGER NOT NULL,\n    `requesterId` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NULL,\n    `workOrderId` VARCHAR(191) NULL,\n    `partName` VARCHAR(191) NOT NULL,\n    `partCode` VARCHAR(191) NULL,\n    `quantity` INTEGER NOT NULL DEFAULT 1,\n    `city` VARCHAR(191) NOT NULL,\n    `notes` TEXT NULL,\n    `status` VARCHAR(20) NOT NULL DEFAULT 'abierta',\n    `closeReason` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    UNIQUE INDEX `QuoteRequest_number_key`(`number`),\n    INDEX `QuoteRequest_requesterId_idx`(`requesterId`),\n    INDEX `QuoteRequest_status_createdAt_idx`(`status`, `createdAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "createTable",
        target: "Quote",
        sql: "CREATE TABLE IF NOT EXISTS `Quote` (\n    `id` VARCHAR(191) NOT NULL,\n    `requestId` VARCHAR(191) NOT NULL,\n    `storeId` VARCHAR(191) NOT NULL,\n    `status` VARCHAR(20) NOT NULL DEFAULT 'invitado',\n    `unitPrice` DECIMAL(10, 2) NULL,\n    `brand` VARCHAR(191) NULL,\n    `availability` VARCHAR(191) NULL,\n    `warrantyDays` INTEGER NULL,\n    `deliveryTime` VARCHAR(191) NULL,\n    `validDays` INTEGER NULL,\n    `notes` VARCHAR(191) NULL,\n    `lossReason` VARCHAR(40) NULL,\n    `respondedAt` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    UNIQUE INDEX `Quote_requestId_storeId_key`(`requestId`, `storeId`),\n    INDEX `Quote_storeId_status_idx`(`storeId`, `status`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "addForeignKey",
        target: "QuoteRequest.QuoteRequest_requesterId_fkey",
        sql: "ALTER TABLE `QuoteRequest` ADD CONSTRAINT `QuoteRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "Quote.Quote_requestId_fkey",
        sql: "ALTER TABLE `Quote` ADD CONSTRAINT `Quote_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `QuoteRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "Quote.Quote_storeId_fkey",
        sql: "ALTER TABLE `Quote` ADD CONSTRAINT `Quote_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    // Relaciones moderadas entre dueños, talleres y almacenes (docs/35 §5). Una relación no se
    // borra nunca: se cierra o se bloquea, y toda intervención queda en la auditoría.
    {
        kind: "createTable",
        target: "Relationship",
        sql: "CREATE TABLE IF NOT EXISTS `Relationship` (\n    `id` VARCHAR(191) NOT NULL,\n    `number` INTEGER NOT NULL,\n    `kind` VARCHAR(20) NOT NULL,\n    `status` VARCHAR(20) NOT NULL DEFAULT 'activa',\n    `channel` VARCHAR(10) NOT NULL DEFAULT 'mediado',\n    `groupInviteUrl` VARCHAR(255) NULL,\n    `groupApprovedBy` VARCHAR(191) NULL,\n    `groupApprovedAt` DATETIME(3) NULL,\n    `originType` VARCHAR(20) NOT NULL DEFAULT 'manual',\n    `originId` VARCHAR(191) NULL,\n    `subject` VARCHAR(191) NULL,\n    `relayPaused` TINYINT(1) NOT NULL DEFAULT 0,\n    `lastMessageAt` DATETIME(3) NULL,\n    `waitingSince` DATETIME(3) NULL,\n    `createdBy` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `closedAt` DATETIME(3) NULL,\n    `closeReason` VARCHAR(191) NULL,\n\n    UNIQUE INDEX `Relationship_number_key`(`number`),\n    UNIQUE INDEX `Relationship_origin_key`(`originType`, `originId`),\n    INDEX `Relationship_status_lastMessageAt_idx`(`status`, `lastMessageAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "createTable",
        target: "RelationshipParty",
        sql: "CREATE TABLE IF NOT EXISTS `RelationshipParty` (\n    `id` VARCHAR(191) NOT NULL,\n    `relationshipId` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `role` VARCHAR(20) NOT NULL,\n    `consentShareContact` TINYINT(1) NOT NULL DEFAULT 0,\n    `consentAt` DATETIME(3) NULL,\n    `mutedAt` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    UNIQUE INDEX `RelationshipParty_relationshipId_userId_key`(`relationshipId`, `userId`),\n    INDEX `RelationshipParty_userId_idx`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "createTable",
        target: "RelationshipMessage",
        sql: "CREATE TABLE IF NOT EXISTS `RelationshipMessage` (\n    `id` VARCHAR(191) NOT NULL,\n    `relationshipId` VARCHAR(191) NOT NULL,\n    `fromUserId` VARCHAR(191) NULL,\n    `toUserId` VARCHAR(191) NULL,\n    `body` TEXT NOT NULL,\n    `kind` VARCHAR(20) NOT NULL DEFAULT 'reenvio',\n    `relayedAt` DATETIME(3) NULL,\n    `flagged` TINYINT(1) NOT NULL DEFAULT 0,\n    `flagReason` VARCHAR(191) NULL,\n    `createdBy` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `RelationshipMessage_relationshipId_createdAt_idx`(`relationshipId`, `createdAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "createTable",
        target: "Dispute",
        sql: "CREATE TABLE IF NOT EXISTS `Dispute` (\n    `id` VARCHAR(191) NOT NULL,\n    `number` INTEGER NOT NULL,\n    `relationshipId` VARCHAR(191) NULL,\n    `openedBy` VARCHAR(191) NULL,\n    `againstUserId` VARCHAR(191) NULL,\n    `claimantUserId` VARCHAR(191) NULL,\n    `reason` TEXT NOT NULL,\n    `status` VARCHAR(20) NOT NULL DEFAULT 'abierta',\n    `resolution` TEXT NULL,\n    `resolvedBy` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `resolvedAt` DATETIME(3) NULL,\n\n    UNIQUE INDEX `Dispute_number_key`(`number`),\n    INDEX `Dispute_status_createdAt_idx`(`status`, `createdAt`),\n    INDEX `Dispute_relationshipId_idx`(`relationshipId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "createTable",
        target: "Sanction",
        sql: "CREATE TABLE IF NOT EXISTS `Sanction` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `level` VARCHAR(30) NOT NULL,\n    `reason` VARCHAR(500) NOT NULL,\n    `relationshipId` VARCHAR(191) NULL,\n    `disputeId` VARCHAR(191) NULL,\n    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `endsAt` DATETIME(3) NULL,\n    `liftedAt` DATETIME(3) NULL,\n    `liftedBy` VARCHAR(191) NULL,\n    `liftReason` VARCHAR(191) NULL,\n    `createdBy` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Sanction_userId_startsAt_idx`(`userId`, `startsAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    // Calificaciones del taller y del almacén (docs/46). La tabla Rating ya existe en el esquema
    // generado: se amplía para saber de qué trabajo salió cada calificación y para poder ocultar
    // una reseña con motivo, sin borrarla.
    addColumn("Rating", "kind", "VARCHAR(20) NULL"),
    addColumn("Rating", "workOrderId", "VARCHAR(191) NULL"),
    addColumn("Rating", "quoteRequestId", "VARCHAR(191) NULL"),
    addColumn("Rating", "hiddenAt", "DATETIME(3) NULL"),
    addColumn("Rating", "hiddenBy", "VARCHAR(191) NULL"),
    addColumn("Rating", "hiddenReason", "VARCHAR(191) NULL"),
    {
        kind: "createIndex",
        target: "Rating.Rating_toId_createdAt_idx",
        sql: "CREATE INDEX `Rating_toId_createdAt_idx` ON `Rating`(`toId`, `createdAt`)",
    },
    {
        kind: "createIndex",
        target: "Rating.Rating_workOrderId_idx",
        sql: "CREATE INDEX `Rating_workOrderId_idx` ON `Rating`(`workOrderId`)",
    },
    addColumn("Shop", "ratingCount", "INTEGER NOT NULL DEFAULT 0"),
    addColumn("Store", "ratingAvg", "DOUBLE NOT NULL DEFAULT 0"),
    addColumn("Store", "ratingCount", "INTEGER NOT NULL DEFAULT 0"),
    // Solicitudes de especialista (docs/45): el dueño describe lo que necesita y la solicitud llega
    // a los talleres verificados que coinciden por especialidad y ciudad. Cada taller responde con
    // precio y disponibilidad; el dueño elige uno.
    {
        kind: "createTable",
        target: "ServiceRequest",
        sql: "CREATE TABLE IF NOT EXISTS `ServiceRequest` (\n    `id` VARCHAR(191) NOT NULL,\n    `number` INTEGER NOT NULL,\n    `ownerId` VARCHAR(191) NOT NULL,\n    `vehicleId` VARCHAR(191) NULL,\n    `category` VARCHAR(40) NOT NULL,\n    `description` TEXT NOT NULL,\n    `city` VARCHAR(191) NULL,\n    `zone` VARCHAR(120) NULL,\n    `status` VARCHAR(20) NOT NULL DEFAULT 'abierta',\n    `chosenOfferId` VARCHAR(191) NULL,\n    `closeReason` VARCHAR(191) NULL,\n    `createdBy` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    UNIQUE INDEX `ServiceRequest_number_key`(`number`),\n    INDEX `ServiceRequest_status_createdAt_idx`(`status`, `createdAt`),\n    INDEX `ServiceRequest_ownerId_idx`(`ownerId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "createTable",
        target: "ServiceOffer",
        sql: "CREATE TABLE IF NOT EXISTS `ServiceOffer` (\n    `id` VARCHAR(191) NOT NULL,\n    `requestId` VARCHAR(191) NOT NULL,\n    `shopId` VARCHAR(191) NOT NULL,\n    `status` VARCHAR(20) NOT NULL DEFAULT 'invitado',\n    `priceUsd` DECIMAL(10, 2) NULL,\n    `durationMin` INTEGER NULL,\n    `availability` VARCHAR(191) NULL,\n    `warrantyDays` INTEGER NULL,\n    `notes` VARCHAR(191) NULL,\n    `respondedAt` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    UNIQUE INDEX `ServiceOffer_requestId_shopId_key`(`requestId`, `shopId`),\n    INDEX `ServiceOffer_shopId_status_idx`(`shopId`, `status`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "addForeignKey",
        target: "ServiceRequest.ServiceRequest_ownerId_fkey",
        sql: "ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "ServiceOffer.ServiceOffer_requestId_fkey",
        sql: "ALTER TABLE `ServiceOffer` ADD CONSTRAINT `ServiceOffer_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "ServiceOffer.ServiceOffer_shopId_fkey",
        sql: "ALTER TABLE `ServiceOffer` ADD CONSTRAINT `ServiceOffer_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    // Visitas a la página de inicio (docs/43): el código AMP-XXXXX es único, se liga al teléfono
    // cuando la persona escribe y al usuario cuando se registra. Sin datos personales hasta que
    // alguien escribe.
    {
        kind: "createTable",
        target: "Visit",
        sql: "CREATE TABLE IF NOT EXISTS `Visit` (\n    `code` VARCHAR(16) NOT NULL,\n    `ref` VARCHAR(32) NULL,\n    `profile` VARCHAR(20) NULL,\n    `phone` VARCHAR(20) NULL,\n    `userId` VARCHAR(191) NULL,\n    `claimedAt` DATETIME(3) NULL,\n    `linkedAt` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Visit_createdAt_idx`(`createdAt`),\n    INDEX `Visit_phone_idx`(`phone`),\n    INDEX `Visit_userId_idx`(`userId`),\n    PRIMARY KEY (`code`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    // Suscripciones y verificación de pagos (docs/42). La tabla Subscription ya existe en el
    // esquema generado: aquí solo se amplía con lo que necesita el cobro manual. El pago queda
    // pendiente hasta que un administrador lo verifica.
    addColumn("Subscription", "number", "INTEGER NULL"),
    addColumn("Subscription", "status", "VARCHAR(20) NOT NULL DEFAULT 'activa'"),
    addColumn("Subscription", "months", "INTEGER NULL"),
    addColumn("Subscription", "amountUsd", "DECIMAL(10, 2) NULL"),
    addColumn("Subscription", "method", "VARCHAR(20) NULL"),
    addColumn("Subscription", "reference", "VARCHAR(191) NULL"),
    addColumn("Subscription", "notes", "TEXT NULL"),
    addColumn("Subscription", "verifiedBy", "VARCHAR(191) NULL"),
    addColumn("Subscription", "verifiedAt", "DATETIME(3) NULL"),
    addColumn("Subscription", "decisionReason", "VARCHAR(191) NULL"),
    addColumn("Subscription", "createdBy", "VARCHAR(191) NULL"),
    addColumn("Subscription", "createdAt", "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)"),
    addColumn("Subscription", "updatedAt", "DATETIME(3) NULL"),
    {
        // Un plan sin vencimiento (una cortesía, por ejemplo) necesita que la fecha admita nulo.
        kind: "modifyColumn",
        target: "Subscription.expiresAt",
        sql: "ALTER TABLE `Subscription` MODIFY COLUMN `expiresAt` DATETIME(3) NULL",
    },
    {
        kind: "createIndex",
        target: "Subscription.Subscription_status_createdAt_idx",
        sql: "CREATE INDEX `Subscription_status_createdAt_idx` ON `Subscription`(`status`, `createdAt`)",
    },
    // Solicitudes de la LOPDP (docs/35 A3): acceso, rectificación y eliminación.
    {
        kind: "createTable",
        target: "DataRequest",
        sql: "CREATE TABLE IF NOT EXISTS `DataRequest` (\n    `id` VARCHAR(191) NOT NULL,\n    `number` INTEGER NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `kind` VARCHAR(20) NOT NULL,\n    `status` VARCHAR(20) NOT NULL DEFAULT 'recibida',\n    `channel` VARCHAR(30) NULL,\n    `detail` TEXT NULL,\n    `resolution` TEXT NULL,\n    `dueAt` DATETIME(3) NOT NULL,\n    `anonymizedAt` DATETIME(3) NULL,\n    `exportedAt` DATETIME(3) NULL,\n    `createdBy` VARCHAR(191) NULL,\n    `resolvedBy` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `resolvedAt` DATETIME(3) NULL,\n\n    UNIQUE INDEX `DataRequest_number_key`(`number`),\n    INDEX `DataRequest_status_dueAt_idx`(`status`, `dueAt`),\n    INDEX `DataRequest_userId_idx`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    },
    {
        kind: "addForeignKey",
        target: "DataRequest.DataRequest_userId_fkey",
        sql: "ALTER TABLE `DataRequest` ADD CONSTRAINT `DataRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "RelationshipParty.RelationshipParty_relationshipId_fkey",
        sql: "ALTER TABLE `RelationshipParty` ADD CONSTRAINT `RelationshipParty_relationshipId_fkey` FOREIGN KEY (`relationshipId`) REFERENCES `Relationship`(`id`) ON DELETE CASCADE ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "RelationshipParty.RelationshipParty_userId_fkey",
        sql: "ALTER TABLE `RelationshipParty` ADD CONSTRAINT `RelationshipParty_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "RelationshipMessage.RelationshipMessage_relationshipId_fkey",
        sql: "ALTER TABLE `RelationshipMessage` ADD CONSTRAINT `RelationshipMessage_relationshipId_fkey` FOREIGN KEY (`relationshipId`) REFERENCES `Relationship`(`id`) ON DELETE CASCADE ON UPDATE CASCADE",
    },
    {
        kind: "addForeignKey",
        target: "Sanction.Sanction_userId_fkey",
        sql: "ALTER TABLE `Sanction` ADD CONSTRAINT `Sanction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE",
    },
    addColumn("Order", "quoteRequestId", "VARCHAR(191) NULL"),
    addColumn("Order", "quoteId", "VARCHAR(191) NULL"),
    addColumn("Order", "stage", "VARCHAR(20) NULL"),
    addColumn("Order", "total", "DECIMAL(10, 2) NULL"),
    addColumn("Order", "cancelReason", "VARCHAR(191) NULL"),
    addColumn("Order", "updatedAt", "DATETIME(3) NULL"),
];
//# sourceMappingURL=statements-extra.js.map