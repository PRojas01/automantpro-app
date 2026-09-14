import { SCHEMA_STATEMENTS, EXPECTED_TABLES as GENERATED_TABLES } from "./statements.js";
import { EXTRA_STATEMENTS, EXTRA_TABLES } from "./statements-extra.js";
/** Todas las sentencias (generadas + agregadas) y las tablas esperadas. */
export const ALL_STATEMENTS = [...SCHEMA_STATEMENTS, ...EXTRA_STATEMENTS];
export const EXPECTED_TABLES = [...GENERATED_TABLES, ...EXTRA_TABLES];
const DB_ENV = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
/** Nombres de variables de base de datos que faltan (vacío si hay DATABASE_URL o todas las DB_*). */
export function missingDbEnv(env = process.env) {
    if (env.DATABASE_URL?.trim())
        return [];
    return DB_ENV.filter((name) => !env[name]?.trim());
}
/** Abre una conexión con mysql2 (una sola sentencia por consulta). */
export async function openConnection(env = process.env) {
    const mysql = await import("mysql2/promise");
    if (env.DATABASE_URL?.trim()) {
        return (await mysql.createConnection({ uri: env.DATABASE_URL, multipleStatements: false }));
    }
    return (await mysql.createConnection({
        host: env.DB_HOST,
        port: Number(env.DB_PORT) || 3306,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        multipleStatements: false,
        connectTimeout: 10_000,
    }));
}
function firstRow(result) {
    const rows = result[0];
    return Array.isArray(rows) ? rows[0] : undefined;
}
async function count(conn, sql, params) {
    const row = firstRow(await conn.query(sql, params));
    return Number(row?.n ?? 0);
}
function split(target) {
    const dot = target.indexOf(".");
    return dot < 0 ? [target, ""] : [target.slice(0, dot), target.slice(dot + 1)];
}
const tableExists = (conn, table) => count(conn, "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", [table]);
const columnExists = (conn, table, column) => count(conn, "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?", [table, column]);
const indexExists = (conn, table, index) => count(conn, "SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?", [table, index]);
const foreignKeyExists = (conn, table, constraint) => count(conn, "SELECT COUNT(*) AS n FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = 'FOREIGN KEY'", [table, constraint]);
/** Decide si una sentencia debe ejecutarse (true) o ya está aplicada (false). */
async function shouldApply(conn, statement) {
    const [table, name] = split(statement.target);
    switch (statement.kind) {
        case "createTable":
            return (await tableExists(conn, table)) === 0;
        case "addColumn":
            return (await tableExists(conn, table)) > 0 && (await columnExists(conn, table, name)) === 0;
        case "modifyColumn":
        case "update":
            // MODIFY y el UPDATE de relleno son idempotentes: se ejecutan si la columna existe.
            return (await columnExists(conn, table, name)) > 0;
        case "createIndex":
            return (await tableExists(conn, table)) > 0 && (await indexExists(conn, table, name)) === 0;
        case "addForeignKey":
            return (await foreignKeyExists(conn, table, name)) === 0;
        default:
            return false;
    }
}
async function listTables(conn) {
    const [rows] = await conn.query("SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()");
    return Array.isArray(rows) ? rows.map((r) => String(r.name)) : [];
}
async function serverInfo(conn) {
    const row = firstRow(await conn.query("SELECT DATABASE() AS db, VERSION() AS version"));
    return {
        database: row?.db ? String(row.db) : null,
        mysqlVersion: row?.version ? String(row.version) : null,
    };
}
export async function getSchemaStatus(conn) {
    const info = await serverInfo(conn);
    const present = await listTables(conn);
    const presentSet = new Set(present.map((t) => t.toLowerCase()));
    return {
        ...info,
        present: EXPECTED_TABLES.filter((t) => presentSet.has(t.toLowerCase())),
        missing: EXPECTED_TABLES.filter((t) => !presentSet.has(t.toLowerCase())),
    };
}
export async function applySchema(conn, statements = ALL_STATEMENTS) {
    const info = await serverInfo(conn);
    const beforeTables = (await listTables(conn)).length;
    const results = [];
    for (const [index, statement] of statements.entries()) {
        const base = { index, kind: statement.kind, target: statement.target };
        try {
            if (!(await shouldApply(conn, statement))) {
                results.push({ ...base, status: "skipped" });
                continue;
            }
            await conn.query(statement.sql);
            results.push({ ...base, status: "applied" });
        }
        catch (err) {
            const e = err;
            results.push({
                ...base,
                status: "failed",
                error: { code: e.code ?? "UNKNOWN", message: e.sqlMessage ?? e.message ?? "Error desconocido" },
            });
            break; // se detiene en el primer fallo
        }
    }
    const afterTables = (await listTables(conn)).length;
    return {
        ...info,
        before: { tables: beforeTables },
        after: { tables: afterTables },
        applied: results.filter((r) => r.status === "applied").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        failed: results.filter((r) => r.status === "failed").length,
        results,
    };
}
//# sourceMappingURL=apply.js.map