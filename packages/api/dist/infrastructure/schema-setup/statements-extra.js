// Sentencias agregadas a mano (no provienen de los SQL generados). Se aplican después de
// SCHEMA_STATEMENTS con las mismas comprobaciones de existencia.
export const EXTRA_TABLES = ["AdminTotp"];
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
];
//# sourceMappingURL=statements-extra.js.map