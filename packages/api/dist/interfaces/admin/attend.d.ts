import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { CopilotService } from "../../application/copilot/service.js";
import type { AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { VisitStore } from "../../infrastructure/visits/visit-store.js";
import type { WorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
import type { QuoteStore } from "../../infrastructure/quotes/quote-store.js";
import { type PlatformSettings } from "../../application/settings/platform.js";
import type { PlanStore } from "../../infrastructure/plans/plan-store.js";
export interface AttendDeps {
    registrations: RegistrationStore;
    appointments?: AppointmentStore;
    visits?: VisitStore;
    workOrders?: WorkOrderStore;
    quotes?: QuoteStore;
    copilot?: CopilotService;
    /** Ajustes de operación: horario silencioso y línea extra de bienvenida (docs/35 A2). */
    platform?: () => Promise<PlatformSettings>;
    /** Plan del contacto y uso del mes, para saber qué ofrecerle (docs/42). */
    plans?: PlanStore;
    audit?(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
}
export declare function registerAttendRoutes(app: FastifyInstance, deps: AttendDeps): void;
//# sourceMappingURL=attend.d.ts.map