import type { SqlConnection } from "../schema-setup/apply.js";
import type { Page } from "../admin/admin-store.js";
import type { ShopCandidate } from "../../application/appointments/matching.js";
export type AppointmentFilter = "hoy" | "proximos" | "pendientes" | "todos";
export interface AppointmentRow {
    id: string;
    scheduledAt: Date | string;
    status: string;
    summary: string | null;
    services: string[];
    notes: string | null;
    cancelReason: string | null;
    createdAt: Date | string;
    vehicleId: string;
    vehicleLabel: string;
    plate: string | null;
    ownerId: string;
    ownerName: string;
    ownerPhone: string;
    shopId: string;
    shopName: string;
    shopAddress: string;
    shopCity: string;
    shopUserId: string;
    shopPhone: string;
}
export interface NewAppointment {
    ownerId: string;
    vehicleId: string;
    shopId: string;
    scheduledAt: Date;
    summary: string;
    services: string[];
    notes: string | null;
}
export interface EventRow {
    type: string;
    payload: Record<string, unknown>;
    createdAt: Date | string;
}
export interface NewEvent {
    type: string;
    actorUserId: string | null;
    entityType: string;
    entityId: string;
    payload: Record<string, unknown>;
}
export interface AppointmentStore {
    /** Talleres verificados de la ciudad (cadena vacía: de todas las ciudades). */
    verifiedShops(city: string): Promise<ShopCandidate[]>;
    createAppointment(input: NewAppointment): Promise<string>;
    getAppointment(id: string): Promise<AppointmentRow | null>;
    listAppointments(filter: AppointmentFilter, page: number, now?: Date): Promise<Page<AppointmentRow>>;
    /** Turnos donde el usuario es el dueño o el titular del taller. */
    listForUser(userId: string): Promise<AppointmentRow[]>;
    setStatus(id: string, status: "confirmed" | "completed" | "cancelled", cancelReason: string | null): Promise<boolean>;
    recordEvent(input: NewEvent): Promise<void>;
    userEvents(userId: string, limit: number): Promise<EventRow[]>;
}
/** Excluye a quien tiene una sanción vigente que bloquea búsquedas (docs/35 M5). */
export declare const NOT_SANCTIONED: (alias: string) => string;
export declare class MysqlAppointmentStore implements AppointmentStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    verifiedShops(city: string): Promise<ShopCandidate[]>;
    createAppointment(input: NewAppointment): Promise<string>;
    getAppointment(id: string): Promise<AppointmentRow | null>;
    listAppointments(filter: AppointmentFilter, page: number, now?: Date): Promise<Page<AppointmentRow>>;
    listForUser(userId: string): Promise<AppointmentRow[]>;
    setStatus(id: string, status: "confirmed" | "completed" | "cancelled", cancelReason: string | null): Promise<boolean>;
    recordEvent(input: NewEvent): Promise<void>;
    userEvents(userId: string, limit: number): Promise<EventRow[]>;
}
//# sourceMappingURL=appointment-store.d.ts.map