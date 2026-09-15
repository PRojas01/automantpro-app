import type { Page } from "../../infrastructure/admin/admin-store.js";
import type { PendingVerification, Row, UserDetail } from "../../infrastructure/registration/registration-store.js";
import type { Perfil } from "../../application/registration/schemas.js";
import type { Flash } from "./views-setup.js";
import type { AppointmentRow, EventRow } from "../../infrastructure/appointments/appointment-store.js";
import type { ServiceHistoryRow, WorkOrderRow } from "../../infrastructure/work-orders/work-order-store.js";
export declare const ROLE_LABELS: Record<string, string>;
export declare function usersListView(input: {
    query: string;
    page: Page<Row>;
}): string;
export declare function newUserView(input: {
    perfil: Perfil;
    csrf: string;
    values: Row;
    error?: string;
}): string;
export declare function userDetailView(input: {
    detail: UserDetail;
    csrf: string;
    flash?: Flash;
    plans: Record<string, string | null>;
    error?: string;
    values?: Row;
    appointments?: AppointmentRow[];
    events?: EventRow[];
    workOrders?: WorkOrderRow[];
    history?: ServiceHistoryRow[];
}): string;
export declare function verificationsView(input: {
    items: PendingVerification[];
    flash?: Flash;
}): string;
//# sourceMappingURL=views-registrations.d.ts.map