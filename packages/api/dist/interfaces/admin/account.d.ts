import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AdminStore } from "../../infrastructure/admin/admin-store.js";
import { type AdminSession } from "../../application/admin/security.js";
export interface AccountDeps {
    store: AdminStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function resetAccountStateForTests(): void;
export declare function registerAccountRoutes(app: FastifyInstance, deps: AccountDeps): void;
//# sourceMappingURL=account.d.ts.map