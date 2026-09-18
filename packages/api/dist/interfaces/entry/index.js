import { randomBytes, randomInt } from "node:crypto";
import { buildLinks, renderEntryPage, sanitizeProfile } from "./page.js";
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
const VISITS_PER_HOUR = 30;
/** Robots que generan vistas previas de enlaces o indexan: reciben la página, no la redirección. */
const PREVIEW_BOTS = /facebookexternalhit|facebot|whatsapp|twitterbot|slackbot|telegrambot|linkedinbot|discordbot|googlebot|bingbot|applebot|pinterest|skypeuripreview|redditbot|embedly/i;
export function isPreviewBot(userAgent) {
    return typeof userAgent === "string" && PREVIEW_BOTS.test(userAgent);
}
async function effectiveNumber(options) {
    if (options.resolveNumber) {
        try {
            const digits = ((await options.resolveNumber()) ?? "").replace(/\D/g, "");
            if (digits.length >= 8 && digits.length <= 15)
                return digits;
        }
        catch {
            // base de datos no disponible: se usa el secreto de la plataforma
        }
    }
    return publicNumber();
}
export async function entryRoutes(app, options = {}) {
    const visitWindows = new Map();
    const allowVisit = (ip) => {
        const now = Date.now();
        const current = visitWindows.get(ip);
        if (!current || now - current.start > 60 * 60 * 1000) {
            if (visitWindows.size > 5000)
                visitWindows.clear();
            visitWindows.set(ip, { count: 1, start: now });
            return true;
        }
        current.count += 1;
        return current.count <= VISITS_PER_HOUR;
    };
    // Solo GET: Fastify expone HEAD automáticamente con el mismo manejador (sin cuerpo).
    app.get("/", async (request, reply) => {
        if (request.method === "HEAD" || !wantsHtml(request.headers.accept)) {
            return reply.send(API_STATUS);
        }
        const nonce = randomBytes(16).toString("base64");
        const query = (request.query ?? {});
        const code = newVisitCode();
        const ref = sanitizeRef(query.ref);
        const profile = sanitizeProfile(query.perfil);
        const bot = isPreviewBot(request.headers["user-agent"]);
        const number = await effectiveNumber(options);
        if (!bot && options.onVisit && allowVisit(request.ip)) {
            // En segundo plano: la página no espera a la base de datos y un fallo no la rompe.
            Promise.resolve()
                .then(() => options.onVisit?.(code, ref, profile))
                .catch(() => undefined);
        }
        // Modo de inicio (docs/41): por defecto se muestra el menú de perfiles y cada opción vuelve
        // aquí con ?perfil= para abrir el chat con esa respuesta escrita. En modo "directo" se salta
        // el menú. Un ?perfil= explícito siempre va al chat, en cualquiera de los dos modos.
        let mode = "menu";
        if (options.entryMode && !profile) {
            try {
                mode = (await options.entryMode()) === "directo" ? "directo" : "menu";
            }
            catch {
                mode = "menu";
            }
        }
        // La página queda para robots de vista previa, para ?pagina, para el menú y si no hay número.
        if (number && !bot && !("pagina" in query) && (mode === "directo" || profile)) {
            return reply
                .header("Cache-Control", "no-store")
                .header("Referrer-Policy", "no-referrer")
                .redirect(buildLinks(number, code, ref, profile).wame, 302);
        }
        const html = renderEntryPage({ number, code, ref, nonce, menu: mode === "menu" });
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