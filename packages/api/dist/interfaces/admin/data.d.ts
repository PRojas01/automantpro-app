import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import { type DataStore } from "../../infrastructure/data/data-store.js";
export interface DataDeps {
    data: DataStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerDataRoutes(app: FastifyInstance, deps: DataDeps): void;
//# sourceMappingURL=data.d.ts.map