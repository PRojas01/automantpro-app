import { type RankedShop } from "../../application/service-requests/workflow.js";
import type { ServiceOfferRow, ServiceRequestRow } from "../../infrastructure/service-requests/service-request-store.js";
import type { Flash } from "./views-setup.js";
export declare function serviceRequestsListView(input: {
    filter: string;
    items: ServiceRequestRow[];
    flash?: Flash;
}): string;
export declare function newServiceRequestView(input: {
    csrf: string;
    owner: {
        id: string;
        name: string;
        city?: string | null;
    };
    vehicles: Array<{
        id: string;
        label: string;
    }>;
    shops: RankedShop[];
    values?: Record<string, unknown>;
    error?: string;
}): string;
export declare function serviceRequestDetailView(input: {
    csrf: string;
    request: ServiceRequestRow;
    offers: ServiceOfferRow[];
    flash?: Flash;
}): string;
//# sourceMappingURL=views-service-requests.d.ts.map