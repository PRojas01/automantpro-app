import { createHmac, timingSafeEqual } from "node:crypto";
const WHATSAPP_API = "https://graph.facebook.com/v21.0";
function getConfig() {
    return {
        token: process.env.WHATSAPP_TOKEN ?? "",
        phoneNumberId: process.env.WHATSAPP_PHONE_ID ?? "",
        webhookSecret: process.env.WEBHOOK_SECRET ?? "",
    };
}
export function verifyWebhookSignature(body, signatureHeader) {
    const config = getConfig();
    if (!config.webhookSecret) {
        // Sin secreto configurado no se puede verificar nada: se rechaza (nunca se omite la verificación).
        console.warn("WEBHOOK_SECRET no configurado: se rechaza la petición del webhook");
        return false;
    }
    if (!signatureHeader) {
        return false;
    }
    const expectedPrefix = "sha256=";
    if (!signatureHeader.startsWith(expectedPrefix)) {
        return false;
    }
    const signature = signatureHeader.slice(expectedPrefix.length);
    const bodyBuffer = typeof body === "string" ? Buffer.from(body, "utf-8") : body;
    const hmac = createHmac("sha256", config.webhookSecret).update(bodyBuffer).digest("hex");
    try {
        return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(hmac, "hex"));
    }
    catch {
        return false;
    }
}
export async function sendWhatsAppMessage(to, text) {
    const config = getConfig();
    if (!config.token || !config.phoneNumberId) {
        return { success: false, error: "WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not configured" };
    }
    const url = `${WHATSAPP_API}/${config.phoneNumberId}/messages`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.token}`,
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: { body: text },
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `WhatsApp API ${response.status}: ${errText}` };
        }
        const data = (await response.json());
        return {
            success: true,
            messageId: data.messages?.[0]?.id,
        };
    }
    catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
export function generateWaMeLink(shopPhone, diagnosticSummary) {
    const cleaned = shopPhone.replace(/[^0-9+]/g, "");
    const international = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
    let link = `https://wa.me/${international}`;
    if (diagnosticSummary) {
        const encoded = encodeURIComponent(diagnosticSummary);
        link += `?text=${encoded}`;
    }
    return link;
}
export function parseWebhookBody(body) {
    const messages = [];
    const entries = body.entry;
    if (!entries)
        return { messages };
    for (const entry of entries) {
        for (const change of entry.changes) {
            const rawMessages = change.value.messages ?? [];
            for (const msg of rawMessages) {
                if (msg.type === "text" && msg.text?.body) {
                    messages.push({
                        from: msg.from,
                        id: msg.id,
                        text: msg.text.body,
                    });
                }
            }
        }
    }
    return { messages };
}
//# sourceMappingURL=send.js.map