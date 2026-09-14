import { randomBytes, randomInt } from "node:crypto";
import { renderEntryPage } from "./page.js";
// Página de entrada en la raíz (docs/33 §1). Los navegadores reciben la página que abre
// WhatsApp; la plataforma (GoDaddy revisa GET / y HEAD /) y los clientes sin Accept HTML
// siguen recibiendo el JSON de estado, para no romper el chequeo de salud.
export const API_STATUS = { status: "ok", service: "AutoMantPro API" };
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function wantsHtml(accept) {
    if (!accept)
        return false;
    return accept
        .split(",")
        .some((part) => part.trim().toLowerCase().startsWith("text/html"));
}
export function sanitizeRef(ref) {
    if (typeof ref !== "string")
        return null;
    return /^[A-Za-z0-9_-]{1,32}$/.test(ref) ? ref : null;
}
export function publicNumber() {
    const digits = (process.env.WA_PUBLIC_NUMBER ?? "").replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? digits : null;
}
export function newVisitCode() {
    let code = "";
    for (let i = 0; i < 4; i++)
        code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    return `AMP-${code}`;
}
export async function entryRoutes(app) {
    // Solo GET: Fastify expone HEAD automáticamente con el mismo manejador (sin cuerpo).
    app.get("/", async (request, reply) => {
        if (request.method === "HEAD" || !wantsHtml(request.headers.accept)) {
            return reply.send(API_STATUS);
        }
        const nonce = randomBytes(16).toString("base64");
        const query = request.query;
        const html = renderEntryPage({
            number: publicNumber(),
            code: newVisitCode(),
            ref: sanitizeRef(query?.ref),
            nonce,
        });
        return reply
            .header("Content-Security-Policy", `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`)
            .header("X-Content-Type-Options", "nosniff")
            .header("Referrer-Policy", "no-referrer")
            .header("X-Frame-Options", "DENY")
            .header("Cache-Control", "no-store")
            .type("text/html; charset=utf-8")
            .send(html);
    });
}
export default entryRoutes;
//# sourceMappingURL=index.js.map