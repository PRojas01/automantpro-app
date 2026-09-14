export interface DatabaseEnv {
    DATABASE_URL?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_NAME?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
}
/**
 * Devuelve la URL de conexión MySQL. Prioriza DATABASE_URL explícita; si no existe,
 * la compone a partir de DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD codificando
 * usuario y contraseña con encodeURIComponent. Devuelve "" si faltan datos.
 */
export declare function buildDatabaseUrl(env?: DatabaseEnv): string;
export declare function hasDatabaseUrl(env?: DatabaseEnv): boolean;
/**
 * Aplica la URL al proceso (process.env.DATABASE_URL) solo cuando falta la variable
 * explícita, para que el cliente Prisma (que lee env("DATABASE_URL") al instanciarse)
 * pueda construir la conexión desde las DB_*. No loguea ningún valor.
 */
export declare function applyDatabaseUrl(env?: NodeJS.ProcessEnv): string;
//# sourceMappingURL=database-url.d.ts.map