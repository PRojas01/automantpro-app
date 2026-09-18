import type { SqlConnection } from "../schema-setup/apply.js";
import { type DataRequestKind, type DataRequestStatus } from "../../application/data/lopdp.js";
export interface ExportDataset {
    key: string;
    label: string;
    /** Advertencia cuando el archivo contiene datos personales. */
    personal: boolean;
    columns: Array<[string, string]>;
    sql: string;
}
export declare const DATASETS: ExportDataset[];
export interface DataRequestRow {
    id: string;
    number: number;
    userId: string;
    userName: string | null;
    kind: string;
    status: string;
    channel: string | null;
    detail: string | null;
    resolution: string | null;
    dueAt: Date | string;
    anonymizedAt: Date | string | null;
    exportedAt: Date | string | null;
    createdAt: Date | string;
    resolvedAt: Date | string | null;
}
export interface PersonalExport {
    user: Record<string, unknown>;
    vehicles: Record<string, unknown>[];
    appointments: Record<string, unknown>[];
    workOrders: Record<string, unknown>[];
    quotes: Record<string, unknown>[];
    relations: Record<string, unknown>[];
    sanctions: Record<string, unknown>[];
}
export interface DataStore {
    /** Filas de un conjunto para exportar a CSV, con tope de seguridad. */
    exportRows(dataset: string, limit?: number): Promise<Record<string, unknown>[]>;
    createRequest(input: {
        userId: string;
        kind: DataRequestKind;
        channel: string | null;
        detail: string | null;
        createdBy: string | null;
    }): Promise<string>;
    listRequests(status: string, page: number): Promise<{
        items: DataRequestRow[];
        page: number;
        pageSize: number;
    }>;
    getRequest(id: string): Promise<DataRequestRow | null>;
    requestsForUser(userId: string): Promise<DataRequestRow[]>;
    setStatus(id: string, status: DataRequestStatus, resolution: string, resolvedBy: string | null): Promise<boolean>;
    markExported(id: string): Promise<void>;
    /** Copia de los datos personales del titular (derecho de acceso). */
    personalExport(userId: string): Promise<PersonalExport | null>;
    /** Anonimiza los datos personales del titular y conserva el historial. */
    anonymizeUser(userId: string, requestId: string | null): Promise<boolean>;
}
export declare class MysqlDataStore implements DataStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    exportRows(dataset: string, limit?: number): Promise<Record<string, unknown>[]>;
    createRequest(input: {
        userId: string;
        kind: DataRequestKind;
        channel: string | null;
        detail: string | null;
        createdBy: string | null;
    }): Promise<string>;
    listRequests(status: string, page: number): Promise<{
        items: DataRequestRow[];
        page: number;
        pageSize: number;
    }>;
    getRequest(id: string): Promise<DataRequestRow | null>;
    requestsForUser(userId: string): Promise<DataRequestRow[]>;
    setStatus(id: string, status: DataRequestStatus, resolution: string, resolvedBy: string | null): Promise<boolean>;
    markExported(id: string): Promise<void>;
    personalExport(userId: string): Promise<PersonalExport | null>;
    anonymizeUser(userId: string, requestId: string | null): Promise<boolean>;
}
//# sourceMappingURL=data-store.d.ts.map