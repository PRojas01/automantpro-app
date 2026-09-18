// Solicitudes de la LOPDP (docs/35 A3): acceso, rectificación y eliminación de datos personales.
// La eliminación no borra filas: anonimiza los datos personales y conserva el historial, como
// exige la retención documentada en docs/35 §5.
export const REQUEST_KINDS = [
    { key: "acceso", label: "Acceso", description: "Entregar copia de sus datos personales." },
    { key: "rectificacion", label: "Rectificación", description: "Corregir datos equivocados." },
    { key: "eliminacion", label: "Eliminación", description: "Anonimizar sus datos personales y conservar solo el historial." },
];
export const REQUEST_STATUS_LABELS = {
    recibida: "Recibida",
    en_proceso: "En proceso",
    atendida: "Atendida",
    rechazada: "Rechazada",
};
/** Plazo legal de respuesta en días. */
export const RESPONSE_DAYS = 15;
export const dataRequestCode = (number) => `LP-${String(number).padStart(4, "0")}`;
export function dueDate(from = new Date()) {
    return new Date(from.getTime() + RESPONSE_DAYS * 24 * 60 * 60 * 1000);
}
/** Días que faltan para el plazo; negativo si ya se pasó. */
export function daysLeft(dueAt, now = new Date()) {
    const due = dueAt instanceof Date ? dueAt : new Date(dueAt);
    return Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}
export function isOverdue(request, now = new Date()) {
    if (request.status === "atendida" || request.status === "rechazada")
        return false;
    return daysLeft(request.dueAt, now) < 0;
}
export function kindLabel(kind) {
    return REQUEST_KINDS.find((k) => k.key === kind)?.label ?? kind;
}
/** Valores con los que se reemplazan los datos personales al anonimizar. */
export function anonymizedValues(userId) {
    return { name: "Titular dado de baja", phone: `anon:${userId}`, email: null, notes: null };
}
//# sourceMappingURL=lopdp.js.map