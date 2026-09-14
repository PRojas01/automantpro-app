import { APP_SETTING_TABLE_SQL } from "../schema-setup/statements-extra.js";
export class MysqlSettingsStore {
    connect;
    tableReady = false;
    constructor(connect) {
        this.connect = connect;
    }
    async run(work) {
        const conn = await this.connect();
        try {
            if (!this.tableReady) {
                await conn.query(APP_SETTING_TABLE_SQL);
                this.tableReady = true;
            }
            return await work(conn);
        }
        finally {
            await conn.end().catch(() => undefined);
        }
    }
    get(name) {
        return this.run(async (conn) => {
            const [rows] = await conn.query("SELECT `value` FROM `AppSetting` WHERE `name` = ? LIMIT 1", [name]);
            const row = Array.isArray(rows) ? rows[0] : undefined;
            return row?.value === undefined || row.value === null ? null : String(row.value);
        });
    }
    set(name, value, updatedBy) {
        return this.run(async (conn) => {
            await conn.query("INSERT INTO `AppSetting` (`name`, `value`, `updatedBy`, `updatedAt`) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updatedBy` = VALUES(`updatedBy`), `updatedAt` = CURRENT_TIMESTAMP(3)", [name, value, updatedBy]);
        });
    }
    remove(name) {
        return this.run(async (conn) => {
            await conn.query("DELETE FROM `AppSetting` WHERE `name` = ?", [name]);
        });
    }
}
/**
 * Lectura con caché: evita una consulta por visita a la página de inicio. Los errores de la base
 * también se guardan como "sin valor" durante el TTL, para no insistir contra una base caída.
 */
export function cachedSetting(store, name, ttlMs = 60_000) {
    let value = null;
    let loadedAt = 0;
    let pending = null;
    return {
        get() {
            if (loadedAt > 0 && Date.now() - loadedAt < ttlMs)
                return Promise.resolve(value);
            if (!pending) {
                pending = store
                    .get(name)
                    .catch(() => null)
                    .then((v) => {
                    value = v;
                    loadedAt = Date.now();
                    pending = null;
                    return v;
                });
            }
            return pending;
        },
        invalidate() {
            loadedAt = 0;
        },
    };
}
//# sourceMappingURL=settings-store.js.map