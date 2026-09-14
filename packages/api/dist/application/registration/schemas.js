import { z } from "zod";
import { classIds, fuelIds, serviceTaxonomy } from "../../domain/maintenance/index.js";
import { normalizeWhatsappNumber } from "../settings/whatsapp-number.js";
export const PERFILES = ["dueno", "taller", "almacen"];
export const CONSENT_VERSION = "2026-09";
export const USAGE_PROFILES = ["urbano", "carretera", "severo"];
const categoryIds = serviceTaxonomy.categories.map((c) => c.id);
/** "pbc 1234" → "PBC-1234"; null si no tiene el formato de placa de Ecuador. */
export function normalizePlate(input) {
    const value = input.toUpperCase().replace(/\s+/g, "");
    const match = /^([A-Z]{3})-?(\d{3,4})$/.exec(value);
    return match ? `${match[1]}-${match[2]}` : null;
}
/** Los campos ausentes del formulario llegan como cadena vacía, para dar mensajes propios. */
const req = (schema) => z.preprocess((v) => (v === undefined || v === null ? "" : Array.isArray(v) ? v[0] : v), schema);
const commonFields = {
    phone: req(z.string()).transform((v, ctx) => {
        const digits = normalizeWhatsappNumber(v);
        if (!digits) {
            ctx.addIssue({ code: "custom", message: "Teléfono no válido: usa un celular como 099 123 4567 o +593 99 123 4567" });
            return z.NEVER;
        }
        return `+${digits}`;
    }),
    name: req(z.string().trim().min(3, "El nombre debe tener entre 3 y 60 caracteres").max(60, "El nombre debe tener entre 3 y 60 caracteres")),
    city: req(z.string().trim().min(2, "Indica la ciudad").max(120, "Ciudad demasiado larga")),
    email: req(z.string().trim().toLowerCase()).transform((v, ctx) => {
        if (!v)
            return null;
        if (v.length > 191 || !z.string().email().safeParse(v).success) {
            ctx.addIssue({ code: "custom", message: "Correo no válido" });
            return z.NEVER;
        }
        return v;
    }),
    source: req(z.string().trim().max(40, "«Cómo nos conoció» es demasiado largo")).transform((v) => v || null),
    notes: req(z.string().trim().max(1000, "Las notas son demasiado largas")).transform((v) => v || null),
    consent: req(z.string()).refine((v) => v === "on", "Falta el consentimiento LOPDP y la aceptación de términos"),
};
const vehicleFields = {
    vehicleClass: req(z.string()).refine((v) => classIds.includes(v), "Elige la clase de vehículo"),
    fuel: req(z.string()).refine((v) => fuelIds.includes(v), "Elige el combustible"),
    make: req(z.string().trim().min(1, "Indica la marca").max(60, "Marca demasiado larga")),
    model: req(z.string().trim().min(1, "Indica el modelo").max(60, "Modelo demasiado largo")),
    year: req(z.string().trim())
        .refine((v) => /^\d{4}$/.test(v), "Año no válido")
        .transform(Number)
        .refine((y) => y >= 1970 && y <= new Date().getFullYear() + 1, "El año debe estar entre 1970 y el próximo año"),
    currentKm: req(z.string())
        .transform((v) => v.replace(/[.\s,]/g, ""))
        .refine((v) => /^\d{1,7}$/.test(v), "Kilometraje no válido")
        .transform(Number)
        .refine((n) => n <= 2_000_000, "Kilometraje no válido"),
    plate: req(z.string().trim()).transform((v, ctx) => {
        if (!v)
            return null;
        const plate = normalizePlate(v);
        if (!plate) {
            ctx.addIssue({ code: "custom", message: "Placa no válida: usa el formato ABC-1234" });
            return z.NEVER;
        }
        return plate;
    }),
    usageProfile: req(z.string()).transform((v) => USAGE_PROFILES.includes(v) ? v : "urbano"),
    reminders: z.unknown().transform((v) => v === "on"),
};
const businessFields = {
    businessName: req(z.string().trim().min(2, "Indica el nombre comercial").max(120, "Nombre comercial demasiado largo")),
    ruc: req(z.string().trim()).refine((v) => /^\d{10}001$/.test(v), "RUC no válido: 13 dígitos terminados en 001"),
    address: req(z.string().trim().min(5, "Indica la dirección").max(200, "Dirección demasiado larga")),
    zone: req(z.string().trim().max(120, "Zona demasiado larga")).transform((v) => v || null),
    hours: req(z.string().trim().max(120, "Horario demasiado largo")).transform((v) => v || null),
};
export const vehicleSchema = z.object(vehicleFields);
export const ownerSchema = z.object({ ...commonFields, ...vehicleFields });
export const shopSchema = z.object({
    ...commonFields,
    ...businessFields,
    services: z
        .preprocess((v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]), z.array(z.string()))
        .refine((list) => list.length > 0, "Elige al menos un servicio que ofrece el taller")
        .refine((list) => list.every((id) => categoryIds.includes(id)), "Servicio no válido"),
});
export const storeSchema = z.object({
    ...commonFields,
    ...businessFields,
    categories: req(z.string().trim().max(500, "Las categorías son demasiado largas")).transform((v) => v || null),
    delivery: z.unknown().transform((v) => v === "on"),
});
//# sourceMappingURL=schemas.js.map