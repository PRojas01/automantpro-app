import { serviceTaxonomy } from "../../domain/maintenance/index.js";
export function slugify(text) {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
const money = (value) => `US$ ${value.toFixed(0)}`;
function buildServicePages() {
    return serviceTaxonomy.categories.map((category) => {
        const items = category.subservices.map((sub) => ({
            name: sub.name,
            detail: sub.detail ?? "",
            durationMin: typeof sub.durationMin === "number" ? sub.durationMin : null,
            costRefUsd: typeof sub.costRefUsd === "number" ? sub.costRefUsd : null,
            costNote: sub.costNote ?? null,
        }));
        const precios = items.map((i) => i.costRefUsd).filter((v) => typeof v === "number");
        const priceFrom = precios.length ? Math.min(...precios) : null;
        const priceTo = precios.length ? Math.max(...precios) : null;
        const rango = priceFrom === null ? "" : priceFrom === priceTo ? ` Precio referencial: ${money(priceFrom)}.` : ` Precios referenciales desde ${money(priceFrom)} hasta ${money(priceTo)}.`;
        return {
            slug: slugify(category.name),
            id: category.id,
            name: category.name,
            title: `${category.name} para tu vehículo en Ecuador · precios y talleres`,
            description: `${category.name}: qué incluye, cuánto demora y cuánto cuesta en Ecuador.${rango} Agenda en un taller verificado por WhatsApp, sin instalar nada.`,
            items,
            priceFrom,
            priceTo,
        };
    });
}
export const SERVICE_PAGES = buildServicePages();
export const CITY_PAGES = [
    { slug: "quito", name: "Quito", province: "Pichincha", zones: ["Norte", "Centro", "Sur", "Valle de los Chillos", "Cumbayá"] },
    { slug: "guayaquil", name: "Guayaquil", province: "Guayas", zones: ["Norte", "Centro", "Sur", "Vía a la Costa", "Samborondón"] },
    { slug: "cuenca", name: "Cuenca", province: "Azuay", zones: ["Centro", "El Ejido", "Totoracocha", "Ricaurte"] },
    { slug: "ambato", name: "Ambato", province: "Tungurahua", zones: ["Centro", "Ficoa", "Huachi", "Izamba"] },
    { slug: "manta", name: "Manta", province: "Manabí", zones: ["Centro", "Tarqui", "Los Esteros"] },
    { slug: "santo-domingo", name: "Santo Domingo", province: "Santo Domingo de los Tsáchilas", zones: ["Centro", "Vía Quevedo", "Vía Quinindé"] },
    { slug: "machala", name: "Machala", province: "El Oro", zones: ["Centro", "Puerto Bolívar", "Vía Pasaje"] },
    { slug: "loja", name: "Loja", province: "Loja", zones: ["Centro", "Norte", "Sur"] },
    { slug: "ibarra", name: "Ibarra", province: "Imbabura", zones: ["Centro", "Caranqui", "Alpachaca"] },
    { slug: "riobamba", name: "Riobamba", province: "Chimborazo", zones: ["Centro", "Norte", "Sur"] },
].map((city) => ({
    ...city,
    title: `Talleres mecánicos en ${city.name} · turnos y precios por WhatsApp`,
    description: `Encuentra taller mecánico en ${city.name} (${city.province}) sin dar vueltas: cuentas el problema por WhatsApp y te coordinamos el turno con precio acordado antes de entrar.`,
}));
export const findService = (slug) => SERVICE_PAGES.find((p) => p.slug === slug) ?? null;
export const findCity = (slug) => CITY_PAGES.find((p) => p.slug === slug) ?? null;
/** Preguntas frecuentes de una categoría, con los datos reales del catálogo. */
export function serviceFaq(page) {
    const principal = page.items[0];
    const faq = [
        {
            q: `¿Cuánto cuesta ${page.name.toLowerCase()} en Ecuador?`,
            a: page.priceFrom === null
                ? `El precio depende del vehículo y del trabajo. Escribiéndonos por WhatsApp con la marca, el modelo y el año te damos el precio antes de entrar al taller.`
                : `Como referencia, entre ${money(page.priceFrom)} y ${money(page.priceTo)} según el vehículo y el taller. El precio exacto se acuerda antes de entrar.`,
        },
        {
            q: `¿Cuánto demora?`,
            a: principal?.durationMin
                ? `${principal.name} toma alrededor de ${principal.durationMin} minutos en un taller con turno reservado.`
                : `Depende del trabajo; al agendar te decimos cuánto tiempo va a estar el vehículo en el taller.`,
        },
        {
            q: `¿Cómo consigo un taller de confianza para esto?`,
            a: `Nos escribes por WhatsApp, nos cuentas qué necesitas y te coordinamos el turno en un taller verificado, con orden de trabajo y garantía respaldada.`,
        },
        {
            q: `¿Necesito instalar una aplicación?`,
            a: `No. Todo ocurre en WhatsApp: no hay que instalar nada ni crear contraseñas.`,
        },
    ];
    return faq;
}
/** Preguntas frecuentes de una ciudad. */
export function cityFaq(city) {
    return [
        {
            q: `¿Cómo encuentro un taller mecánico en ${city.name}?`,
            a: `Escribes por WhatsApp qué le pasa a tu vehículo y en qué zona de ${city.name} estás (${city.zones.slice(0, 3).join(", ")}…) y te proponemos talleres cercanos; con el plan Premium, talleres verificados con el precio acordado antes de entrar.`,
        },
        {
            q: `¿Qué significa que un taller esté verificado?`,
            a: `Que revisamos su RUC, su dirección y los servicios que ofrece antes de recomendarlo, y que respondemos si algo sale mal: hay orden de trabajo, garantía y un caso de disputa si hiciera falta.`,
        },
        {
            q: `¿Atienden mi marca en ${city.name}?`,
            a: `Trabajamos con talleres multimarca y especializados para autos, camionetas, motos y comerciales livianos. Si ninguno cubre tu caso, te lo decimos de frente.`,
        },
        {
            q: `¿Cuánto cuesta usar AutoMantPro?`,
            a: `El plan gratuito incluye tu plan de mantenimiento, recordatorios y búsqueda de talleres cercanos. El plan Premium agrega talleres verificados, cotización de repuestos en varios almacenes y garantía respaldada.`,
        },
    ];
}
//# sourceMappingURL=catalog.js.map