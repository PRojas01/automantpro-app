// Sentencias agregadas a mano (no provienen de los SQL generados). Se aplican después de
// SCHEMA_STATEMENTS con las mismas comprobaciones de existencia. Solo agregan: nunca borran.
export const EXTRA_TABLES = ["AdminTotp", "AppSetting"];
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
];
//# sourceMappingURL=statements-extra.js.map