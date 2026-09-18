import type { SqlConnection } from "../schema-setup/apply.js";
export interface Visit {
    code: string;
    ref: string | null;
    /** Opción elegida en el menú de inicio, si lo hubo. */
    profile: string | null;
    phone: string | null;
    userId: string | null;
    userName?: string | null;
    claimedAt?: Date | string | null;
    linkedAt?: Date | string | null;
    createdAt: Date | string;
}
export interface VisitStats {
    ref: string | null;
    profile: string | null;
    visitas: number;
    escribieron: number;
    registrados: number;
}
export interface VisitStore {
    record(code: string, ref: string | null, profile?: string | null): Promise<void>;
    /** Visita con ese código en los últimos 7 días, o null. */
    find(code: string, now?: Date): Promise<Visit | null>;
    /** ¿Ese código ya existe? Sirve para no repetirlo al generarlo. */
    exists(code: string): Promise<boolean>;
    /** Liga la visita al teléfono desde el que escribieron. */
    claim(code: string, phone: string): Promise<void>;
    /** Liga la visita al usuario cuando se registra. */
    link(code: string, userId: string): Promise<void>;
    /** Visitas recientes, para la bandeja de origen del panel. */
    list(page: number): Promise<{
        items: Visit[];
        page: number;
        pageSize: number;
    }>;
    /** Resumen por origen y perfil elegido: visitas, cuántas escribieron y cuántas se registraron. */
    stats(days: number): Promise<VisitStats[]>;
}
export declare class MysqlVisitStore implements VisitStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    record(code: string, ref: string | null, profile?: string | null): Promise<void>;
    exists(code: string): Promise<boolean>;
    find(code: string, now?: Date): Promise<Visit | null>;
    claim(code: string, phone: string): Promise<void>;
    link(code: string, userId: string): Promise<void>;
    list(page: number): Promise<{
        items: Visit[];
        page: number;
        pageSize: number;
    }>;
    stats(days: number): Promise<VisitStats[]>;
}
//# sourceMappingURL=visit-store.d.ts.map