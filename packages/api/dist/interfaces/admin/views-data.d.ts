import { type DataRequestRow } from "../../infrastructure/data/data-store.js";
import type { Flash } from "./views-setup.js";
export declare function exportsView(input: {
    counts: Record<string, number> | null;
    flash?: Flash;
}): string;
export declare function dataRequestsView(input: {
    csrf: string;
    filter: string;
    items: DataRequestRow[];
    flash?: Flash;
}): string;
/** Tarjeta en la ficha del titular: solicitudes propias y alta de una nueva. */
export declare function userDataRequestsCard(userId: string, items: DataRequestRow[], csrf: string): string;
//# sourceMappingURL=views-data.d.ts.map