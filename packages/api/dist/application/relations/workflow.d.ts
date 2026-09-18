export type RelationKind = "dueno_taller" | "taller_almacen" | "dueno_almacen" | "tripartita";
export type RelationStatus = "propuesta" | "activa" | "en_disputa" | "cerrada" | "bloqueada";
export type RelationChannel = "mediado" | "grupo";
export type PartyRole = "dueno" | "taller" | "almacen";
export type SanctionLevel = "advertencia" | "suspension_busquedas" | "suspension" | "baja";
export declare const RELATION_KIND_LABELS: Record<RelationKind, string>;
export declare const RELATION_STATUS_LABELS: Record<RelationStatus, string>;
export declare const PARTY_ROLE_LABELS: Record<PartyRole, string>;
/** Una relación nunca se borra: se cierra o se bloquea (docs/35 §5). */
export declare const RELATION_TRANSITIONS: Record<RelationStatus, RelationStatus[]>;
export declare const RELATION_OPEN_STATUSES: readonly RelationStatus[];
export declare function canTransition(from: string, to: string): boolean;
export declare const relationCode: (number: number) => string;
export declare const disputeCode: (number: number) => string;
export declare const SANCTION_LEVELS: Array<{
    key: SanctionLevel;
    label: string;
    /** Paso en la escala: sirve para proponer el siguiente y para ordenar. */
    step: number;
    defaultDays: number | null;
    blocksSearch: boolean;
    blocksService: boolean;
    description: string;
}>;
export declare function sanctionLevel(level: string): {
    key: SanctionLevel;
    label: string;
    /** Paso en la escala: sirve para proponer el siguiente y para ordenar. */
    step: number;
    defaultDays: number | null;
    blocksSearch: boolean;
    blocksService: boolean;
    description: string;
} | null;
export declare function sanctionLabel(level: string): string;
export interface SanctionRecord {
    level: string;
    startsAt: Date | string;
    endsAt: Date | string | null;
    liftedAt: Date | string | null;
}
/** Una sanción está vigente si no se levantó y no venció. */
export declare function isActive(sanction: SanctionRecord, now?: Date): boolean;
/** El paso siguiente de la escala según lo que ya tuvo esa persona (nunca salta pasos). */
export declare function nextSanctionLevel(history: Array<{
    level: string;
}>): SanctionLevel;
export declare function sanctionEffects(sanctions: SanctionRecord[], now?: Date): {
    blocksSearch: boolean;
    blocksService: boolean;
};
/** Fecha de fin según los días indicados; null cuando la sanción no vence. */
export declare function sanctionEnd(level: string, days: number | null, from?: Date): Date | null;
export interface PartyView {
    userId: string;
    role: string;
    name: string;
    phone: string | null;
    consentShareContact: boolean;
    mutedAt: Date | string | null;
}
/**
 * Encabezado de contexto del mensaje reenviado (docs/35 §2.A): quién escribe y sobre qué, sin
 * incluir el teléfono de nadie.
 */
export declare function relayHeader(input: {
    fromRole: string;
    fromName: string;
    code: string;
    subject: string | null;
}): string;
/** Mensaje completo que el operador envía por WhatsApp a la otra parte. */
export declare function relayMessage(input: {
    fromRole: string;
    fromName: string;
    code: string;
    subject: string | null;
    body: string;
}): string;
/** El teléfono de una parte solo se muestra si esa parte dio su consentimiento. */
export declare function visibleContact(party: PartyView): string | null;
/** Un grupo de WhatsApp necesita el consentimiento de todas las partes (docs/35 §2.C). */
export declare function groupAllowed(parties: PartyView[]): boolean;
/** Horas que la relación lleva esperando respuesta de la otra parte. */
export declare function waitingHours(waitingSince: Date | string | null, now?: Date): number | null;
/** La otra parte a la que hay que reenviar lo que escribió `fromUserId`. */
export declare function counterpart(parties: PartyView[], fromUserId: string): PartyView | null;
//# sourceMappingURL=workflow.d.ts.map