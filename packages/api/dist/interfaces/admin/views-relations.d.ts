import { relayMessage } from "../../application/relations/workflow.js";
import type { DisputeRow, Paged, RelationDetail, RelationRow, SanctionRow } from "../../infrastructure/relations/relation-store.js";
import type { Flash } from "./views-setup.js";
export declare function relationsListView(input: {
    filter: string;
    page: Paged<RelationRow>;
    waitingHours: number;
    flash?: Flash;
}): string;
export declare function relationDetailView(input: {
    csrf: string;
    detail: RelationDetail;
    sanctions: SanctionRow[];
    canSanction: boolean;
    canDispute: boolean;
    relay?: {
        to: string;
        text: string;
    };
    flash?: Flash;
}): string;
export declare function disputesListView(input: {
    csrf: string;
    filter: string;
    page: Paged<DisputeRow>;
    canResolve: boolean;
    flash?: Flash;
}): string;
export declare function sanctionsListView(input: {
    csrf: string;
    page: Paged<SanctionRow>;
    canLift: boolean;
    flash?: Flash;
}): string;
/** Texto listo para reenviar a la otra parte. */
export { relayMessage };
//# sourceMappingURL=views-relations.d.ts.map