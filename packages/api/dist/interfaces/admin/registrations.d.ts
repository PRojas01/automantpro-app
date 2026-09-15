import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import type { WorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
export interface RegistrationDeps {
    registrations: RegistrationStore;
    appointments?: AppointmentStore;
    workOrders?: WorkOrderStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerRegistrationRoutes(app: FastifyInstance, deps: RegistrationDeps): void;
//# sourceMappingURL=registrations.d.ts.map