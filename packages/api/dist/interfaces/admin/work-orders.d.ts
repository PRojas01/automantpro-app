import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { WorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
export interface WorkOrderDeps {
    workOrders: WorkOrderStore;
    appointments: AppointmentStore;
    registrations: RegistrationStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerWorkOrderRoutes(app: FastifyInstance, deps: WorkOrderDeps): void;
//# sourceMappingURL=work-orders.d.ts.map