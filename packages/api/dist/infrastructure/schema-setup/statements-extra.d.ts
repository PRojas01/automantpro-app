import type { SchemaStatement } from "./statements.js";
export declare const EXTRA_TABLES: readonly string[];
/** Ajustes editables desde el panel (por ejemplo, el número público de WhatsApp). */
export declare const APP_SETTING_TABLE_SQL = "CREATE TABLE IF NOT EXISTS `AppSetting` (\n    `name` VARCHAR(191) NOT NULL,\n    `value` TEXT NOT NULL,\n    `updatedBy` VARCHAR(191) NULL,\n    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    PRIMARY KEY (`name`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
export declare const EXTRA_STATEMENTS: readonly SchemaStatement[];
//# sourceMappingURL=statements-extra.d.ts.map