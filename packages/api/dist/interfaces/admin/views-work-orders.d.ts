import type { ShopCandidate } from "../../application/appointments/matching.js";
import type { Page } from "../../infrastructure/admin/admin-store.js";
import type { AppointmentRow } from "../../infrastructure/appointments/appointment-store.js";
import type { ServiceHistoryRow, WorkOrderFilter, WorkOrderItemRow, WorkOrderRow } from "../../infrastructure/work-orders/work-order-store.js";
import type { Flash } from "./views-setup.js";
import type { RatingRow } from "../../infrastructure/ratings/rating-store.js";
type Row = Record<string, unknown>;
export declare function workOrdersListView(input: {
    filter: WorkOrderFilter;
    page: Page<WorkOrderRow>;
    flash?: Flash;
}): string;
export declare function newWorkOrderView(input: {
    csrf: string;
    owner: Row;
    vehicle: Row;
    appointment: AppointmentRow | null;
    shops: ShopCandidate[];
    values?: Row;
    error?: string;
}): string;
export declare function workOrderDetailView(input: {
    order: WorkOrderRow;
    items: WorkOrderItemRow[];
    csrf: string;
    flash?: Flash;
    rating?: RatingRow | null;
    canModerate?: boolean;
}): string;
export declare function userWorkOrdersSection(orders: WorkOrderRow[]): string;
export declare function historySection(history: ServiceHistoryRow[]): string;
export {};
//# sourceMappingURL=views-work-orders.d.ts.map