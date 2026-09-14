import { prisma } from "./prisma.js";
const SENSITIVE_KEYS = new Set([
    "phone",
    "email",
    "ruc",
    "name",
    "plate",
    "vin",
    "lat",
    "lng",
]);
export const REDACTED_MARKER = "***";
/**
 * Sustituye por el marcador los valores bajo claves sensibles, en profundidad
 * (objetos anidados y arrays). Devuelve una copia; no muta el valor original.
 */
export function redactPayload(value) {
    if (Array.isArray(value)) {
        return value.map((item) => redactPayload(item));
    }
    if (value !== null && typeof value === "object") {
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            out[key] = SENSITIVE_KEYS.has(key) ? REDACTED_MARKER : redactPayload(val);
        }
        return out;
    }
    return value;
}
// Sink por defecto: persiste en MySQL a través del cliente Prisma (carga diferida).
const defaultSink = (data) => prisma.event.create({ data: data });
/**
 * Registra un evento de dominio. Antes de persistir redacta el payload.
 * Acepta un `sink` inyectable para pruebas y para otros adaptadores de persistencia.
 */
export async function recordEvent(input, sink = defaultSink) {
    const safe = {
        type: input.type,
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        payload: redactPayload(input.payload) ?? null,
    };
    return sink(safe);
}
//# sourceMappingURL=events.js.map