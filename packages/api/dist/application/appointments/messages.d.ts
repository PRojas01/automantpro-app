import type { RankedShop } from "./matching.js";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
export declare const STATUS_LABELS: Record<string, string>;
/** Cambios de estado permitidos desde cada estado. */
export declare const ALLOWED_TRANSITIONS: Record<string, AppointmentStatus[]>;
/** "2026-09-15" + "10:00" en hora de Ecuador → instante UTC; null si no es una fecha u hora válida. */
export declare function parseEcDateTime(date: unknown, time: unknown): Date | null;
/** Inicio y fin del día de hoy en Ecuador, como instantes UTC. */
export declare function ecDayRange(now?: Date): {
    start: Date;
    end: Date;
};
export declare function formatEcDateTime(value: unknown): string;
export declare function serviceNames(ids: string[]): string[];
export declare function categoriesFor(ids: string[]): string[];
export declare function selectionSummary(ids: string[]): string;
export declare function shopListMessage(shops: RankedShop[]): string;
export interface MessageAppointment {
    status: string;
    scheduledAt: Date | string;
    shopName: string;
    shopAddress: string;
    shopCity: string;
    vehicleLabel: string;
    plate: string | null;
    services: string[];
    summary: string | null;
    notes: string | null;
    cancelReason: string | null;
}
/** Mensaje para el dueño según el estado del turno. */
export declare function ownerMessage(a: MessageAppointment): string;
/** Mensaje para el taller con la solicitud. */
export declare function shopRequestMessage(a: MessageAppointment): string;
//# sourceMappingURL=messages.d.ts.map