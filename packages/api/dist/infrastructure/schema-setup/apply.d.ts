import { type SchemaStatement } from "./statements.js";
/** Todas las sentencias (generadas + agregadas) y las tablas esperadas. */
export declare const ALL_STATEMENTS: readonly SchemaStatement[];
export declare const EXPECTED_TABLES: readonly string[];
export interface SqlConnection {
    query(sql: string, params?: unknown[]): Promise<[unknown, unknown]>;
    end(): Promise<void>;
}
export type StatementStatus = "applied" | "skipped" | "failed";
export interface StatementResult {
    index: number;
    kind: SchemaStatement["kind"];
    target: string;
    status: StatementStatus;
    error?: {
        code: string;
        message: string;
    };
}
export interface SchemaStatus {
    database: string | null;
    mysqlVersion: string | null;
    present: string[];
    missing: string[];
}
export interface SchemaReport {
    database: string | null;
    mysqlVersion: string | null;
    before: {
        tables: number;
    };
    after: {
        tables: number;
    };
    applied: number;
    skipped: number;
    failed: number;
    results: StatementResult[];
}
/** Nombres de variables de base de datos que faltan (vacío si hay DATABASE_URL o todas las DB_*). */
export declare function missingDbEnv(env?: NodeJS.ProcessEnv): string[];
/** Abre una conexión con mysql2 (una sola sentencia por consulta). */
export declare function openConnection(env?: NodeJS.ProcessEnv): Promise<SqlConnection>;
export declare function getSchemaStatus(conn: SqlConnection): Promise<SchemaStatus>;
export declare function applySchema(conn: SqlConnection, statements?: readonly SchemaStatement[]): Promise<SchemaReport>;
//# sourceMappingURL=apply.d.ts.map