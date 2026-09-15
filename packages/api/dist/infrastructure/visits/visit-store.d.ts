import type { SqlConnection } from "../schema-setup/apply.js";
export interface Visit {
    code: string;
    ref: string | null;
    createdAt: Date | string;
}
export interface VisitStore {
    record(code: string, ref: string | null): Promise<void>;
    /** Visita con ese código en los últimos 7 días, o null. */
    find(code: string, now?: Date): Promise<Visit | null>;
}
export declare class MysqlVisitStore implements VisitStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    record(code: string, ref: string | null): Promise<void>;
    find(code: string, now?: Date): Promise<Visit | null>;
}
//# sourceMappingURL=visit-store.d.ts.map