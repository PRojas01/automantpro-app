import type { SqlConnection } from "../schema-setup/apply.js";
import type { Page } from "../admin/admin-store.js";
export type Row = Record<string, unknown>;
export interface NewUser {
    phone: string;
    name: string;
    email: string | null;
    city: string;
    consentVersion: string;
    source: string | null;
    notes: string | null;
    passwordHash: string;
}
export interface NewVehicle {
    make: string;
    model: string;
    year: number;
    currentKm: number;
    vehicleClass: string;
    fuel: string;
    plate: string | null;
    usageProfile: string;
    remindersOptIn: boolean;
}
export interface NewBusiness {
    name: string;
    address: string;
    city: string;
    zone: string | null;
    ruc: string;
    hours: string | null;
    contactName: string;
    email: string | null;
}
export interface NewShop extends NewBusiness {
    services: string[];
}
export interface NewStore extends NewBusiness {
    categories: string | null;
    delivery: boolean;
}
export interface UserDetail {
    user: Row;
    vehicles: Row[];
    shop: (Row & {
        services: string[];
    }) | null;
    store: Row | null;
}
export type VerificationKind = "shop" | "store";
export interface PendingVerification {
    kind: VerificationKind;
    id: string;
    userId: string;
    name: string;
    city: string;
    ruc: string | null;
    createdAt: Date | string;
}
export interface RegistrationStore {
    createOwner(user: NewUser, vehicle: NewVehicle): Promise<string>;
    createShop(user: NewUser, shop: NewShop): Promise<string>;
    createStore(user: NewUser, store: NewStore): Promise<string>;
    addVehicle(userId: string, vehicle: NewVehicle): Promise<string>;
    searchUsers(query: string, page: number): Promise<Page<Row>>;
    getUserDetail(id: string): Promise<UserDetail | null>;
    pendingVerifications(): Promise<PendingVerification[]>;
    setVerification(kind: VerificationKind, id: string, status: "verified" | "rejected"): Promise<boolean>;
    recentUsers(limit: number): Promise<Row[]>;
    pendingCount(): Promise<number>;
}
export declare class MysqlRegistrationStore implements RegistrationStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    private transaction;
    private uuid;
    private insertUser;
    private insertVehicle;
    createOwner(user: NewUser, vehicle: NewVehicle): Promise<string>;
    createShop(user: NewUser, shop: NewShop): Promise<string>;
    createStore(user: NewUser, store: NewStore): Promise<string>;
    addVehicle(userId: string, vehicle: NewVehicle): Promise<string>;
    searchUsers(query: string, page: number): Promise<Page<Row>>;
    getUserDetail(id: string): Promise<UserDetail | null>;
    pendingVerifications(): Promise<PendingVerification[]>;
    setVerification(kind: VerificationKind, id: string, status: "verified" | "rejected"): Promise<boolean>;
    recentUsers(limit: number): Promise<Row[]>;
    pendingCount(): Promise<number>;
}
//# sourceMappingURL=registration-store.d.ts.map