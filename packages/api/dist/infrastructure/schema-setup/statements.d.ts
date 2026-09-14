export type StatementKind = "createTable" | "update" | "addColumn" | "modifyColumn" | "createIndex" | "addForeignKey";
export interface SchemaStatement {
    kind: StatementKind;
    target: string;
    sql: string;
}
export declare const EXPECTED_TABLES: readonly string[];
export declare const SCHEMA_STATEMENTS: readonly SchemaStatement[];
//# sourceMappingURL=statements.d.ts.map