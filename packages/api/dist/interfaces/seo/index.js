const DEFAULT_SITE = "https://automantpro.app";
/** Rastreadores de IA que se permiten expresamente, para poder aparecer en sus respuestas. */
const AI_AGENTS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
    "cohere-ai",
    "Meta-ExternalAgent",
    "Amazonbot",
    "YouBot",
];
export function robotsTxt(site) {
    const permitidos = AI_AGENTS.map((agent) => `User-agent: ${agent}\nAllow: /`).join("\n\n");
    return `# AutoMantPro · mantenimiento automotor por WhatsApp en Ecuador
User-agent: *
Allow: /
Disallow: /admin
Disallow: /wa/

${permitidos}

Sitemap: ${site}/sitemap.xml
`;
}
export function sitemapXml(site, now = new Date()) {
    const fecha = now.toISOString().slice(0, 10);
    const paginas = [
        ["/", "1.0"],
        ["/?pagina=1", "0.8"],
        ["/terminos", "0.3"],
        ["/privacidad", "0.3"],
    ];
    const urls = paginas
        .map(([path, priority]) => `  <url>\n    <loc>${site}${path.replace(/&/g, "&amp;")}</loc>\n    <lastmod>${fecha}</lastmod>\n    <priority>${priority}</priority>\n  </url>`)
        .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
/**
 * Resumen para asistentes de IA (convención llms.txt): qué es, a quién sirve y cómo se usa,
 * en texto plano y corto, que es lo que estos sistemas citan mejor.
 */
export function llmsTxt(site, phone) {
    const contacto = phone ? `https://wa.me/${phone}` : `${site}`;
    return `# AutoMantPro

> Mantenimiento automotor por WhatsApp en Ecuador: plan de mantenimiento por vehículo,
> diagnóstico asistido por IA, talleres verificados y cotización de repuestos, sin instalar apps.

## Qué resuelve
- Plan de mantenimiento a la medida del vehículo (clase, combustible, uso y kilometraje).
- Diagnóstico orientativo de síntomas y ruidos, con aviso cuando es riesgoso seguir conduciendo.
- Turnos en talleres verificados, con el precio acordado antes de entrar.
- Cotización del mismo repuesto en varios almacenes, para comparar precio, garantía y entrega.
- Historial de servicios del vehículo, útil al revenderlo.

## Para quién
- Dueños de vehículos en Ecuador (autos, camionetas, motos y comerciales livianos).
- Talleres mecánicos que quieren recibir clientes y llevar sus órdenes de trabajo.
- Almacenes de repuestos que quieren responder cotizaciones y despachar pedidos.

## Cómo se usa
Se escribe por WhatsApp: ${contacto}
No hay que instalar ninguna aplicación ni crear contraseñas.

## Planes
- Gratis: plan de mantenimiento, recordatorios y búsqueda de talleres cercanos.
- Premium: talleres verificados con cita coordinada, cotizaciones a varios almacenes,
  garantía respaldada y historial exportable.

## Enlaces
- Inicio: ${site}/
- Términos y condiciones: ${site}/terminos
- Política de privacidad (LOPDP): ${site}/privacidad
`;
}
export async function seoRoutes(app, options = {}) {
    const site = (options.site ?? process.env.PUBLIC_SITE_URL ?? DEFAULT_SITE).replace(/\/+$/, "");
    app.get("/robots.txt", async (_request, reply) => reply.type("text/plain; charset=utf-8").header("Cache-Control", "public, max-age=3600").send(robotsTxt(site)));
    app.get("/sitemap.xml", async (_request, reply) => reply.type("application/xml; charset=utf-8").header("Cache-Control", "public, max-age=3600").send(sitemapXml(site)));
    app.get("/llms.txt", async (_request, reply) => {
        let phone = null;
        try {
            phone = (await options.resolveNumber?.()) ?? null;
        }
        catch {
            phone = null;
        }
        const digits = (phone ?? process.env.WA_PUBLIC_NUMBER ?? "").replace(/\D/g, "");
        return reply
            .type("text/plain; charset=utf-8")
            .header("Cache-Control", "public, max-age=3600")
            .send(llmsTxt(site, digits.length >= 8 ? digits : null));
    });
}
export default seoRoutes;
//# sourceMappingURL=index.js.map