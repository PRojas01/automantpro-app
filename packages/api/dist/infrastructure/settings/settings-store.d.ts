import type { SqlConnection } from "../schema-setup/apply.js";
export interface SettingsStore {
    get(name: string): Promise<string | null>;
    set(name: string, value: string, updatedBy: string | null): Promise<void>;
    remove(name: string): Promise<void>;
}
export declare class MysqlSettingsStore implements SettingsStore {
    private readonly connect;
    private tableReady;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    get(name: string): Promise<string | null>;
    set(name: string, value: string, updatedBy: string | null): Promise<void>;
    remove(name: string): Promise<void>;
}
export interface CachedSetting {
    get(): Promise<string | null>;
    invalidate(): void;
}
/**
 * Lectura con caché: evita una consulta por visita a la página de inicio. Los errores de la base
 * también se guardan como "sin valor" durante el TTL, para no insistir contra una base caída.
 */
export declare function cachedSetting(store: SettingsStore, name: string, ttlMs?: number): CachedSetting;
//# sourceMappingURL=settings-store.d.ts.map