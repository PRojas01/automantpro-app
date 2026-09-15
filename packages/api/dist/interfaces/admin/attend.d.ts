import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { CopilotService } from "../../application/copilot/service.js";
import type { AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { VisitStore } from "../../infrastructure/visits/visit-store.js";
import type { WorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
import type { QuoteStore } from "../../infrastructure/quotes/quote-store.js";
export interface AttendDeps {
    registrations: RegistrationStore;
    appointments?: AppointmentStore;
    visits?: VisitStore;
    workOrders?: WorkOrderStore;
    quotes?: QuoteStore;
    copilot?: CopilotService;
    audit?(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
}
export declare function registerAttendRoutes(app: FastifyInstance, deps: AttendDeps): void;
//# sourceMappingURL=attend.d.ts.map