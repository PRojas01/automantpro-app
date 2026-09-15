import type { PlanItem } from "../../domain/maintenance/types.js";
import type { Page } from "../../infrastructure/admin/admin-store.js";
import type { AppointmentFilter, AppointmentRow, EventRow } from "../../infrastructure/appointments/appointment-store.js";
import type { RankedShop } from "../../application/appointments/matching.js";
import type { Flash } from "./views-setup.js";
type Row = Record<string, unknown>;
export declare function appointmentsListView(input: {
    filter: AppointmentFilter;
    page: Page<AppointmentRow>;
    flash?: Flash;
}): string;
export declare function appointmentDetailView(input: {
    appointment: AppointmentRow;
    csrf: string;
    flash?: Flash;
    workOrderId?: string | null;
}): string;
export declare function scheduleView(input: {
    owner: Row;
    vehicles: Row[];
    vehicle: Row;
    items: PlanItem[];
    selected: string[];
    shops: RankedShop[] | null;
    sameCity: boolean;
    csrf: string;
    error?: string;
    values?: Row;
}): string;
export declare function userAppointmentsSection(appointments: AppointmentRow[]): string;
export declare function bitacoraSection(userId: string, events: EventRow[], csrf: string): string;
export {};
//# sourceMappingURL=views-appointments.d.ts.map