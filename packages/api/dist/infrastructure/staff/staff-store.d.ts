import type { SqlConnection } from "../schema-setup/apply.js";
export interface StaffMember {
    id: string;
    email: string;
    name: string;
    staffRole: string | null;
    active: boolean;
    hasTotp: boolean;
    createdAt: Date | string;
}
export interface StaffStore {
    list(): Promise<StaffMember[]>;
    find(id: string): Promise<StaffMember | null>;
    emailTaken(email: string): Promise<boolean>;
    /** Crea el miembro sin segundo factor: lo registra él mismo en su primer ingreso. */
    create(input: {
        email: string;
        name: string;
        passwordHash: string;
        staffRole: string;
        phone: string;
    }): Promise<string>;
    setTotp(id: string, secret: string): Promise<void>;
    setRole(id: string, staffRole: string): Promise<void>;
    setActive(id: string, active: boolean): Promise<void>;
    /** Administradores activos; nunca debe quedar en cero. */
    countActiveAdmins(): Promise<number>;
}
export declare class MysqlStaffStore implements StaffStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    list(): Promise<StaffMember[]>;
    find(id: string): Promise<StaffMember | null>;
    emailTaken(email: string): Promise<boolean>;
    create(input: {
        email: string;
        name: string;
        passwordHash: string;
        staffRole: string;
        phone: string;
    }): Promise<string>;
    setTotp(id: string, secret: string): Promise<void>;
    setRole(id: string, staffRole: string): Promise<void>;
    setActive(id: string, active: boolean): Promise<void>;
    countActiveAdmins(): Promise<number>;
}
//# sourceMappingURL=staff-store.d.ts.map