export type DataRequestKind = "acceso" | "rectificacion" | "eliminacion";
export type DataRequestStatus = "recibida" | "en_proceso" | "atendida" | "rechazada";
export declare const REQUEST_KINDS: Array<{
    key: DataRequestKind;
    label: string;
    description: string;
}>;
export declare const REQUEST_STATUS_LABELS: Record<DataRequestStatus, string>;
/** Plazo legal de respuesta en días. */
export declare const RESPONSE_DAYS = 15;
export declare const dataRequestCode: (number: number) => string;
export declare function dueDate(from?: Date): Date;
/** Días que faltan para el plazo; negativo si ya se pasó. */
export declare function daysLeft(dueAt: Date | string, now?: Date): number;
export declare function isOverdue(request: {
    status: string;
    dueAt: Date | string;
}, now?: Date): boolean;
export declare function kindLabel(kind: string): string;
/** Valores con los que se reemplazan los datos personales al anonimizar. */
export declare function anonymizedValues(userId: string): {
    name: string;
    phone: string;
    email: null;
    notes: null;
};
//# sourceMappingURL=lopdp.d.ts.map