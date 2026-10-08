import type { FastifyInstance } from "fastify";
import { AgentOrchestrator } from "../agent/orchestrator.js";
export declare function registerWebhookRoutes(app: FastifyInstance): Promise<void>;
export declare function getWebhookSession(phoneNumber: string): AgentOrchestrator | undefined;
export declare function clearWebhookSession(phoneNumber: string): void;
//# sourceMappingURL=webhook.d.ts.map