import { randomBytes } from "node:crypto";
import { CITY_PAGES, SERVICE_PAGES, cityFaq, findCity, findService, serviceFaq } from "../../application/content/catalog.js";
import { cityBlocks, renderContentPage, serviceBlocks } from "./page.js";
import { publicNumber, uniqueVisitCode, wantsHtml } from "../entry/index.js";
const HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "public, max-age=600",
};
export async function contentRoutes(app, options = {}) {
    async function number() {
        try {
            const digits = ((await options.resolveNumber?.()) ?? "").replace(/\D/g, "");
            if (digits.length >= 8 && digits.length <= 15)
                return digits;
        }
        catch {
            // sin base: se usa el secreto de la plataforma
        }
        return publicNumber();
    }
    async function visitCode(ref) {
        const code = await uniqueVisitCode(options.codeTaken);
        if (options.onVisit) {
            Promise.resolve()
                .then(() => options.onVisit?.(code, ref.slice(0, 32), null))
                .catch(() => undefined);
        }
        return code;
    }
    const send = (reply, html) => {
        for (const [name, value] of Object.entries(HEADERS))
            reply.header(name, value);
        return reply.type("text/html; charset=utf-8").send(html);
    };
    app.get("/servicios", async (request, reply) => {
        if (!wantsHtml(request.headers.accept))
            return reply.callNotFound();
        const code = await visitCode("servicios");
        const lista = SERVICE_PAGES.map((page) => `<li><a href="/servicios/${page.slug}">${page.name}</a>${page.priceFrom === null ? "" : ` — desde US$ ${page.priceFrom.toFixed(0)}`}</li>`).join("");
        return send(reply, renderContentPage({
            number: await number(),
            code,
            nonce: randomBytes(16).toString("base64"),
            path: "/servicios",
            title: "Servicios de mantenimiento y reparación en Ecuador · precios referenciales",
            description: "Qué incluye cada servicio del vehículo, cuánto demora y cuánto cuesta en Ecuador: frenos, aceite, motor, suspensión, neumáticos, aire acondicionado y más. Agenda por WhatsApp.",
            h1: "Servicios de mantenimiento y reparación",
            intro: "Estos son los trabajos que coordinamos con talleres verificados, con su duración y su precio referencial en Ecuador. El precio exacto se acuerda antes de entrar al taller.",
            blocks: [{ title: "Todos los servicios", html: `<ul class="enlaces">${lista}</ul>` }],
            faq: [
                {
                    q: "¿Los precios son fijos?",
                    a: "No: son referenciales para que sepas en qué rango moverte. El precio final lo acuerdas con el taller antes de entrar, y queda escrito en la orden de trabajo.",
                },
                {
                    q: "¿Cómo sé qué le toca a mi vehículo?",
                    a: "Con la marca, el modelo, el año y el kilometraje armamos el plan de mantenimiento de tu vehículo y te decimos qué corresponde ahora y qué puede esperar.",
                },
            ],
            related: CITY_PAGES.slice(0, 5).map((city) => ({ href: `/talleres/${city.slug}`, label: `Talleres en ${city.name}` })),
            breadcrumb: [
                { href: "/", label: "Inicio" },
                { href: "/servicios", label: "Servicios" },
            ],
            chatText: "Hola AutoMantPro, quiero saber qué mantenimiento le toca a mi vehículo.",
        }));
    });
    app.get("/servicios/:slug", async (request, reply) => {
        if (!wantsHtml(request.headers.accept))
            return reply.callNotFound();
        const { slug } = request.params;
        const page = findService(slug);
        if (!page)
            return reply.callNotFound();
        const code = await visitCode(`servicio:${page.id}`);
        const otros = SERVICE_PAGES.filter((p) => p.slug !== page.slug).slice(0, 5);
        return send(reply, renderContentPage({
            number: await number(),
            code,
            nonce: randomBytes(16).toString("base64"),
            path: `/servicios/${page.slug}`,
            title: page.title,
            description: page.description,
            h1: `${page.name} para tu vehículo`,
            intro: page.description,
            blocks: serviceBlocks(page),
            faq: serviceFaq(page),
            related: [
                ...otros.map((p) => ({ href: `/servicios/${p.slug}`, label: p.name })),
                { href: "/servicios", label: "Ver todos los servicios" },
            ],
            breadcrumb: [
                { href: "/", label: "Inicio" },
                { href: "/servicios", label: "Servicios" },
                { href: `/servicios/${page.slug}`, label: page.name },
            ],
            chatText: `Hola AutoMantPro, necesito ${page.name.toLowerCase()} para mi vehículo.`,
        }));
    });
    app.get("/talleres", async (request, reply) => {
        if (!wantsHtml(request.headers.accept))
            return reply.callNotFound();
        const code = await visitCode("talleres");
        const lista = CITY_PAGES.map((city) => `<li><a href="/talleres/${city.slug}">Talleres mecánicos en ${city.name}</a> — ${city.province}</li>`).join("");
        return send(reply, renderContentPage({
            number: await number(),
            code,
            nonce: randomBytes(16).toString("base64"),
            path: "/talleres",
            title: "Talleres mecánicos verificados en Ecuador · turnos por WhatsApp",
            description: "Talleres mecánicos en Quito, Guayaquil, Cuenca y más ciudades del Ecuador: turno coordinado por WhatsApp, precio acordado antes de entrar y garantía respaldada.",
            h1: "Talleres mecánicos en Ecuador",
            intro: "Elige tu ciudad: te coordinamos el turno por WhatsApp, con el precio acordado antes de entrar y el trabajo registrado en el historial de tu vehículo.",
            blocks: [{ title: "Ciudades", html: `<ul class="enlaces">${lista}</ul>` }],
            faq: [
                {
                    q: "¿Qué pasa si mi ciudad no está en la lista?",
                    a: "Igual escríbenos: te buscamos talleres cercanos en el mapa y te avisamos cuando tengamos talleres verificados en tu zona.",
                },
            ],
            related: SERVICE_PAGES.slice(0, 5).map((p) => ({ href: `/servicios/${p.slug}`, label: p.name })),
            breadcrumb: [
                { href: "/", label: "Inicio" },
                { href: "/talleres", label: "Talleres" },
            ],
            chatText: "Hola AutoMantPro, busco un taller mecánico de confianza.",
        }));
    });
    app.get("/talleres/:slug", async (request, reply) => {
        if (!wantsHtml(request.headers.accept))
            return reply.callNotFound();
        const { slug } = request.params;
        const city = findCity(slug);
        if (!city)
            return reply.callNotFound();
        const code = await visitCode(`ciudad:${city.slug}`);
        return send(reply, renderContentPage({
            number: await number(),
            code,
            nonce: randomBytes(16).toString("base64"),
            path: `/talleres/${city.slug}`,
            title: city.title,
            description: city.description,
            h1: `Talleres mecánicos en ${city.name}`,
            intro: city.description,
            blocks: cityBlocks(city),
            faq: cityFaq(city),
            related: [
                ...SERVICE_PAGES.slice(0, 4).map((p) => ({ href: `/servicios/${p.slug}`, label: `${p.name} en ${city.name}` })),
                { href: "/talleres", label: "Talleres en otras ciudades" },
            ],
            breadcrumb: [
                { href: "/", label: "Inicio" },
                { href: "/talleres", label: "Talleres" },
                { href: `/talleres/${city.slug}`, label: city.name },
            ],
            chatText: `Hola AutoMantPro, busco un taller mecánico en ${city.name}.`,
        }));
    });
}
export default contentRoutes;
//# sourceMappingURL=index.js.map