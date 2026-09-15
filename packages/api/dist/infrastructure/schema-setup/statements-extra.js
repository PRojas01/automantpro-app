// Sentencias agregadas a mano (no provienen de los SQL generados). Se aplican después de
// SCHEMA_STATEMENTS con las mismas comprobaciones de existencia. Solo agregan: nunca borran.
export const EXTRA_TABLES = ["AdminTotp", "AppSetting", "WorkOrder", "WorkOrderItem"];
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
];
//# sourceMappingURL=statements-extra.js.map