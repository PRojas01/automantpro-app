import { verifyWebhookSignature, parseWebhookBody, sendWhatsAppMessage } from "./send.js";
import { AgentOrchestrator } from "../agent/orchestrator.js";
const sessions = new Map();
function getOrCreateSession(phoneNumber) {
    let session = sessions.get(phoneNumber);
    if (!session) {
        session = new AgentOrchestrator(process.env.LLM_API_KEY ? "openai" : "mock");
        sessions.set(phoneNumber, session);
    }
    return session;
}
export async function registerWebhookRoutes(app) {
    app.get("/webhook", async (request, reply) => {
        const query = request.query;
        const mode = query["hub.mode"];
        const token = query["hub.verify_token"];
        const challenge = query["hub.challenge"];
        if (mode === "subscribe" && token === process.env.WEBHOOK_SECRET) {
            await reply.code(200).send(challenge);
        }
        else {
            await reply.code(403).send({ error: "Verification failed" });
        }
    });
    app.post("/webhook", async (request, reply) => {
        const signature = request.headers["x-hub-signature-256"];
        const rawBody = JSON.stringify(request.body);
        if (!verifyWebhookSignature(rawBody, signature)) {
            await reply.code(401).send({ error: "Invalid signature" });
            return;
        }
        const { messages } = parseWebhookBody(request.body);
        for (const msg of messages) {
            const orchestrator = getOrCreateSession(msg.from);
            const response = await orchestrator.handleIncoming(msg.from, msg.text);
            await sendWhatsAppMessage(msg.from, response);
        }
        await reply.code(200).send({ status: "ok" });
    });
}
export function getWebhookSession(phoneNumber) {
    return sessions.get(phoneNumber);
}
export function clearWebhookSession(phoneNumber) {
    sessions.delete(phoneNumber);
}
//# sourceMappingURL=webhook.js.map