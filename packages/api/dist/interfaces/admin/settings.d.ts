import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AdminStore } from "../../infrastructure/admin/admin-store.js";
import type { SettingsStore } from "../../infrastructure/settings/settings-store.js";
import { type SqlConnection } from "../../infrastructure/schema-setup/apply.js";
import { type AdminSession } from "../../application/admin/security.js";
export interface SettingsDeps {
    store: AdminStore;
    settings: SettingsStore;
    connect: () => Promise<SqlConnection>;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
    envNumber(): string | null;
    onChanged(): void;
}
export declare function registerSettingsRoutes(app: FastifyInstance, deps: SettingsDeps): void;
//# sourceMappingURL=settings.d.ts.map