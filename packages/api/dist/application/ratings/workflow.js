// Calificaciones del taller y del almacén (docs/46). Se piden al cerrar el trabajo, cuando el
// dueño todavía recuerda cómo le fue. Una calificación baja abre la puerta a una disputa; una
// reseña no se borra: se puede ocultar con motivo.
export const SCORES = [
    { value: 5, label: "5 · Excelente" },
    { value: 4, label: "4 · Bien" },
    { value: 3, label: "3 · Aceptable" },
    { value: 2, label: "2 · Mal" },
    { value: 1, label: "1 · Muy mal" },
];
/** Por debajo de esto conviene revisar el caso: es la señal de docs/35 M4. */
export const DISPUTE_THRESHOLD = 2;
export function parseScore(input) {
    const value = typeof input === "string" ? Number(input.trim()) : typeof input === "number" ? input : NaN;
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}
export function needsReview(score) {
    return score <= DISPUTE_THRESHOLD;
}
/** Promedio con un decimal sobre las reseñas visibles; 0 si no hay ninguna. */
export function average(ratings) {
    const visibles = ratings.filter((r) => !r.hiddenAt);
    if (visibles.length === 0)
        return 0;
    const suma = visibles.reduce((total, r) => total + r.score, 0);
    return Math.round((suma / visibles.length) * 10) / 10;
}
export function stars(score) {
    const llenas = Math.round(score);
    return `${"★".repeat(Math.max(0, Math.min(5, llenas)))}${"☆".repeat(Math.max(0, 5 - llenas))}`;
}
/** Mensaje para pedirle la calificación al dueño cuando se cierra el trabajo. */
export function askMessage(input) {
    return [
        `Listo, tu vehículo salió de ${input.shopName} (${input.code}).`,
        "",
        "¿Cómo te fue? Respóndeme con un número del 1 al 5:",
        "5) Excelente · 4) Bien · 3) Aceptable · 2) Mal · 1) Muy mal",
        "",
        "Si quieres, agrega en una línea qué estuvo bien o qué falló.",
    ].join("\n");
}
/** Respuesta al dueño según lo que calificó. */
export function thanksMessage(score) {
    if (needsReview(score)) {
        return "Gracias por decírmelo. Voy a revisar el caso con el taller y te escribo con una respuesta; si quieres, abrimos un reclamo formal.";
    }
    if (score === 3)
        return "Gracias por la calificación. Cuéntame qué habría hecho la diferencia y se lo hacemos saber al taller.";
    return "¡Gracias! Se lo hago saber al taller. Tu calificación ayuda a que otros elijan mejor.";
}
//# sourceMappingURL=workflow.js.map