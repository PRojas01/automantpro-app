import type { Role } from "@prisma/client";
export declare const REDACTED_MARKER = "***";
export type JsonRecord = Record<string, unknown>;
/**
 * Sustituye por el marcador los valores bajo claves sensibles, en profundidad
 * (objetos anidados y arrays). Devuelve una copia; no muta el valor original.
 */
export declare function redactPayload(value: unknown): unknown;
export interface EventData {
    type: string;
    actorUserId?: string | null;
    actorRole?: Role | null;
    entityType?: string | null;
    entityId?: string | null;
    payload?: JsonRecord | null;
}
export type EventSink = (data: EventData) => Promise<unknown>;
/**
 * Registra un evento de dominio. Antes de persistir redacta el payload.
 * Acepta un `sink` inyectable para pruebas y para otros adaptadores de persistencia.
 */
export declare function recordEvent(input: EventData, sink?: EventSink): Promise<unknown>;
//# sourceMappingURL=events.d.ts.map