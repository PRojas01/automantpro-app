import type { SqlConnection } from "../schema-setup/apply.js";
export interface AdminAccount {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    totpSecret: string | null;
}
export interface DashboardData {
    usersByRole: Record<string, number>;
    vehicles: number;
    shopsByStatus: Record<string, number>;
    stores: number;
    appointmentsToday: number;
    appointmentsPending: number;
    conversations: number;
    messages24h: number;
}
export interface Page<T> {
    items: T[];
    page: number;
    pageSize: number;
}
export interface AdminStore {
    findAdminByEmail(email: string): Promise<AdminAccount | null>;
    findAdminById(id: string): Promise<AdminAccount | null>;
    /** Administradores activos con segundo factor configurado. */
    countAdmins(): Promise<number>;
    updateAdminProfile(id: string, input: {
        email: string;
        name: string;
    }): Promise<void>;
    updateAdminPassword(id: string, passwordHash: string): Promise<void>;
    updateAdminTotp(id: string, secret: string): Promise<void>;
    upsertAdmin(input: {
        email: string;
        name: string;
        passwordHash: string;
        totpSecret: string;
        phone: string;
    }): Promise<string>;
    recordAudit(input: {
        eventType: string;
        actorUserId?: string | null;
        reason?: string | null;
    }): Promise<void>;
    dashboard(): Promise<DashboardData>;
    listUsers(page: number): Promise<Page<Record<string, unknown>>>;
    listVehicles(page: number): Promise<Page<Record<string, unknown>>>;
    listShops(page: number): Promise<Page<Record<string, unknown>>>;
    listAudit(page: number): Promise<Page<Record<string, unknown>>>;
}
export declare class MysqlAdminStore implements AdminStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    findAdminByEmail(email: string): Promise<AdminAccount | null>;
    upsertAdmin(input: {
        email: string;
        name: string;
        passwordHash: string;
        totpSecret: string;
        phone: string;
    }): Promise<string>;
    findAdminById(id: string): Promise<AdminAccount | null>;
    countAdmins(): Promise<number>;
    updateAdminProfile(id: string, input: {
        email: string;
        name: string;
    }): Promise<void>;
    updateAdminPassword(id: string, passwordHash: string): Promise<void>;
    updateAdminTotp(id: string, secret: string): Promise<void>;
    recordAudit(input: {
        eventType: string;
        actorUserId?: string | null;
        reason?: string | null;
    }): Promise<void>;
    dashboard(): Promise<DashboardData>;
    listUsers(page: number): Promise<Page<Record<string, unknown>>>;
    listVehicles(page: number): Promise<Page<Record<string, unknown>>>;
    listShops(page: number): Promise<Page<Record<string, unknown>>>;
    listAudit(page: number): Promise<Page<Record<string, unknown>>>;
}
//# sourceMappingURL=admin-store.d.ts.map