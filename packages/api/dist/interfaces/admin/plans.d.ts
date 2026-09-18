import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { PlanStore } from "../../infrastructure/plans/plan-store.js";
export interface PlanDeps {
    plans: PlanStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerPlanRoutes(app: FastifyInstance, deps: PlanDeps): void;
//# sourceMappingURL=plans.d.ts.map