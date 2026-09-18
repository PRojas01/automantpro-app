import type { RelationStore } from "../../infrastructure/relations/relation-store.js";
export interface RelationLinker {
    fromAppointment(input: {
        appointmentId: string;
        ownerId: string;
        shopUserId: string;
        subject: string | null;
        createdBy: string | null;
    }): Promise<string | null>;
    fromWorkOrder(input: {
        workOrderId: string;
        ownerId: string;
        shopUserId: string;
        subject: string | null;
        createdBy: string | null;
    }): Promise<string | null>;
    fromQuoteRequest(input: {
        requestId: string;
        requesterId: string;
        requesterRole: string;
        storeUserIds: string[];
        subject: string | null;
        createdBy: string | null;
    }): Promise<string[]>;
}
export declare function createRelationLinker(store: RelationStore): RelationLinker;
//# sourceMappingURL=linker.d.ts.map