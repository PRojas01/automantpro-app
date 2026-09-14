// S1-24: construye DATABASE_URL a partir de las variables DB_* del MySQL administrado
// de GoDaddy cuando DATABASE_URL no está definida. Nunca registra la URL ni la contraseña.
const DEFAULT_PORT = "3306";
/**
 * Devuelve la URL de conexión MySQL. Prioriza DATABASE_URL explícita; si no existe,
 * la compone a partir de DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD codificando
 * usuario y contraseña con encodeURIComponent. Devuelve "" si faltan datos.
 */
export function buildDatabaseUrl(env = process.env) {
    const explicit = env.DATABASE_URL?.trim();
    if (explicit)
        return explicit;
    const host = env.DB_HOST?.trim();
    const name = env.DB_NAME?.trim();
    const user = env.DB_USER?.trim();
    // Distinguir "no declarada" (undefined) de "vacía a propósito"; una vacía sí es una URL válida
    // (MySQL sin contraseña), pero si la variable no se declara no se arma la URL.
    if (env.DB_PASSWORD === undefined)
        return "";
    if (!host || !name || !user)
        return "";
    const port = env.DB_PORT?.trim() || DEFAULT_PORT;
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(env.DB_PASSWORD);
    return `mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}`;
}
export function hasDatabaseUrl(env = process.env) {
    return buildDatabaseUrl(env).length > 0;
}
/**
 * Aplica la URL al proceso (process.env.DATABASE_URL) solo cuando falta la variable
 * explícita, para que el cliente Prisma (que lee env("DATABASE_URL") al instanciarse)
 * pueda construir la conexión desde las DB_*. No loguea ningún valor.
 */
export function applyDatabaseUrl(env = process.env) {
    const explicit = env.DATABASE_URL?.trim();
    if (explicit)
        return explicit;
    const url = buildDatabaseUrl(env);
    if (url)
        env.DATABASE_URL = url;
    return url;
}
//# sourceMappingURL=database-url.js.map