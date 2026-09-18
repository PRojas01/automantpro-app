import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AdminStore } from "../../infrastructure/admin/admin-store.js";
import type { StaffStore } from "../../infrastructure/staff/staff-store.js";
import { type AdminSession } from "../../application/admin/security.js";
export interface TeamDeps {
    store: AdminStore;
    staff: StaffStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerTeamRoutes(app: FastifyInstance, deps: TeamDeps): void;
//# sourceMappingURL=team.d.ts.map