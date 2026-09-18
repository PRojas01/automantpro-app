import type { Page } from "../../infrastructure/admin/admin-store.js";
import type { PendingVerification, Row, UserDetail } from "../../infrastructure/registration/registration-store.js";
import type { Perfil } from "../../application/registration/schemas.js";
import type { Flash } from "./views-setup.js";
import type { RelationRow, SanctionRow } from "../../infrastructure/relations/relation-store.js";
import type { DataRequestRow } from "../../infrastructure/data/data-store.js";
import type { SubscriptionRow } from "../../infrastructure/plans/plan-store.js";
import type { UsageCount } from "../../application/plans/plans.js";
import type { AppointmentRow, EventRow } from "../../infrastructure/appointments/appointment-store.js";
import type { ServiceHistoryRow, WorkOrderRow } from "../../infrastructure/work-orders/work-order-store.js";
import type { UserQuotes } from "../../infrastructure/quotes/quote-store.js";
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
    quotes?: UserQuotes | null;
    relations?: RelationRow[];
    sanctions?: SanctionRow[];
    canSanction?: boolean;
    dataRequests?: DataRequestRow[];
    canLopdp?: boolean;
    subscriptions?: SubscriptionRow[];
    usage?: UsageCount;
    canPayments?: boolean;
}): string;
export declare function verificationsView(input: {
    items: PendingVerification[];
    flash?: Flash;
}): string;
//# sourceMappingURL=views-registrations.d.ts.map