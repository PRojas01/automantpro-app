import { AgentOrchestrator } from "@automantpro/agent";
import { z } from "zod";
const sessions = new Map();
function getOrCreateSession(sessionId) {
    let session = sessions.get(sessionId);
    if (!session) {
        session = new AgentOrchestrator(process.env.LLM_API_KEY ? "openai" : "mock");
        sessions.set(sessionId, session);
    }
    return session;
}
const chatSchema = z.object({
    message: z.string().min(1).max(2000),
});
const diagnoseSchema = z.object({
    symptoms: z.string().min(1).max(2000),
});
export default async function agentRoutes(app) {
    app.post("/agent/chat", {
        handler: async (request, reply) => {
            const parsed = chatSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Mensaje inválido" },
                });
            }
            const sessionId = request.headers.authorization
                ? `token:${request.headers.authorization}`
                : `anon:${request.ip}`;
            const orchestrator = getOrCreateSession(sessionId);
            const replyText = await orchestrator.handleIncoming(sessionId, parsed.data.message);
            return { data: { reply: replyText }, error: null };
        },
    });
    app.post("/agent/diagnose", {
        handler: async (request, reply) => {
            const parsed = diagnoseSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Síntomas inválidos" },
                });
            }
            const sessionId = request.headers.authorization
                ? `token:${request.headers.authorization}`
                : `anon:${request.ip}`;
            const orchestrator = getOrCreateSession(sessionId);
            const prompt = `Necesito un diagnóstico. Síntomas: ${parsed.data.symptoms}. Da causas posibles con probabilidad y prioridad de revisión.`;
            const replyText = await orchestrator.handleIncoming(`${sessionId}:dx`, prompt);
            return { data: { reply: replyText, status: "ok" }, error: null };
        },
    });
}
//# sourceMappingURL=agent.routes.js.map