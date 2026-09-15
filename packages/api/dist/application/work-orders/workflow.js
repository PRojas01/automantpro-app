// Órdenes de trabajo del taller (docs/34 T4, T5, T6 y D6): estados, montos y mensajes para
// WhatsApp. Regla: ningún trabajo cobrable se ejecuta sin la aprobación del dueño.
export const WORK_ORDER_LABELS = {
    recepcion: "Recepción",
    presupuesto_enviado: "Presupuesto enviado",
    aprobado: "Aprobado",
    rechazado: "Presupuesto rechazado",
    en_ejecucion: "En ejecución",
    esperando_repuesto: "Esperando repuesto",
    cerrada: "Cerrada",
    cancelada: "Cancelada",
};
/** Cambios de estado permitidos. El cierre (cerrada) se hace con su propio formulario. */
export const WORK_ORDER_TRANSITIONS = {
    recepcion: ["presupuesto_enviado", "cancelada"],
    presupuesto_enviado: ["aprobado", "rechazado", "cancelada"],
    rechazado: ["presupuesto_enviado", "cancelada"],
    aprobado: ["en_ejecucion", "cancelada"],
    en_ejecucion: ["esperando_repuesto", "cerrada"],
    esperando_repuesto: ["en_ejecucion", "cerrada"],
    cerrada: [],
    cancelada: [],
};
/** Estados en los que se puede editar el presupuesto y el diagnóstico. */
export const EDITABLE_STATUSES = ["recepcion", "rechazado"];
export const OPEN_STATUSES = ["recepcion", "presupuesto_enviado", "aprobado", "rechazado", "en_ejecucion", "esperando_repuesto"];
export const IN_SHOP_STATUSES = ["aprobado", "en_ejecucion", "esperando_repuesto"];
export const ITEM_KINDS = [
    ["repuesto", "Repuesto"],
    ["mano_obra", "Mano de obra"],
];
export const DIAGNOSIS_OUTCOMES = [
    ["confirmado", "El diagnóstico se confirmó"],
    ["parcial", "Se confirmó en parte"],
    ["incorrecto", "La causa era otra"],
    ["no_aplica", "No hubo diagnóstico previo"],
];
export const workOrderCode = (number) => `OT-${String(number).padStart(5, "0")}`;
/** "45,50", "45.50", "1.234,56" o "$ 20" → número con hasta 2 decimales; null si no es válido. */
export function parseAmount(input) {
    if (typeof input !== "string")
        return null;
    let value = input.trim().replace(/[\s$]/g, "");
    if (!value)
        return null;
    if (value.includes(",") && value.includes("."))
        value = value.replace(/\./g, "").replace(",", ".");
    else
        value = value.replace(",", ".");
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(value))
        return null;
    return Number(value);
}
export function formatUsd(value) {
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
}
export const lineTotal = (item) => Math.round(item.quantity * item.unitPrice * 100) / 100;
export function itemsTotal(items) {
    return Math.round(items.reduce((sum, item) => sum + lineTotal(item), 0) * 100) / 100;
}
const km = (value) => `${Number(value).toLocaleString("es-EC")} km`;
const vehicleText = (o) => `${o.vehicleLabel}${o.plate ? ` · ${o.plate}` : ""}`;
function itemLines(items) {
    return items
        .map((i) => {
        const quantity = i.quantity !== 1 ? ` x${String(i.quantity).replace(".", ",")}` : "";
        const brand = i.brand ? ` (${i.brand})` : "";
        return `• ${i.kind === "mano_obra" ? "Mano de obra: " : ""}${i.description}${brand}${quantity} — ${formatUsd(lineTotal(i))}`;
    })
        .join("\n");
}
export function quoteMessage(o, items) {
    const diagnosis = o.diagnosis ? `\n🔎 Diagnóstico: ${o.diagnosis}` : "";
    return `🧾 Presupuesto ${workOrderCode(o.number)} — ${o.shopName}\n🚗 ${vehicleText(o)}${diagnosis}\n\n${itemLines(items)}\n\nTotal: ${formatUsd(itemsTotal(items))}\n\nResponde:\n1) ✅ Apruebo\n2) ❌ No apruebo (cuéntame el motivo)\n\nEl taller no hará ningún trabajo con costo sin tu aprobación.`;
}
/** Mensaje para el dueño según el estado de la orden. */
export function ownerWorkOrderMessage(o, items) {
    const code = workOrderCode(o.number);
    switch (o.status) {
        case "presupuesto_enviado":
            return quoteMessage(o, items);
        case "aprobado":
            return `✅ Registramos tu aprobación del presupuesto ${code} por ${formatUsd(o.total)}.\nEl taller ${o.shopName} empieza el trabajo en tu ${o.vehicleLabel}.`;
        case "rechazado":
            return `Registramos que no apruebas el presupuesto ${code}${o.rejectionReason ? `: ${o.rejectionReason}` : ""}.\n¿Quieres que el taller te proponga otra opción?`;
        case "en_ejecucion":
            return `🔧 Tu ${o.vehicleLabel} está en trabajo en ${o.shopName} (${code}). Te aviso apenas esté listo.`;
        case "esperando_repuesto":
            return `⏳ Estamos esperando un repuesto para tu ${o.vehicleLabel} (${code}). Te aviso cuando el trabajo continúe.`;
        case "cerrada": {
            const lines = [
                `🏁 Trabajo terminado — ${code}`,
                `🔧 ${o.shopName}`,
                `🚗 ${vehicleText(o)}${o.exitKm !== null ? ` · ${km(o.exitKm)}` : ""}`,
                "",
                itemLines(items),
                "",
                `Total: ${formatUsd(o.total)}`,
            ];
            if (o.warrantyDays)
                lines.push(`🛡️ Garantía: ${o.warrantyDays} días`);
            if (o.nextService)
                lines.push(`📅 Próximo servicio: ${o.nextService}`);
            lines.push("", "¿Cómo te fue? Califica el servicio del 1 al 5.");
            return lines.join("\n");
        }
        case "cancelada":
            return `La orden ${code} en ${o.shopName} fue cancelada${o.cancelReason ? `: ${o.cancelReason}` : ""}.`;
        default:
            return `📋 Recibimos tu ${o.vehicleLabel} en ${o.shopName}${o.intakeKm !== null ? ` con ${km(o.intakeKm)}` : ""} (${code}).\nTe enviaremos el presupuesto antes de hacer cualquier trabajo.`;
    }
}
/** Mensaje para el taller cuando el dueño responde el presupuesto. */
export function shopWorkOrderMessage(o) {
    const code = workOrderCode(o.number);
    if (o.status === "aprobado")
        return `✅ El cliente aprobó el presupuesto ${code} por ${formatUsd(o.total)}. Puedes iniciar el trabajo.`;
    if (o.status === "rechazado")
        return `❌ El cliente no aprobó el presupuesto ${code}${o.rejectionReason ? `: ${o.rejectionReason}` : ""}.`;
    return null;
}
/** Texto que queda en el historial del vehículo al cerrar la orden. */
export function historyDescription(o, items) {
    const parts = [`${workOrderCode(o.number)}: ${items.map((i) => i.description).join(", ") || "sin ítems"}`];
    if (o.diagnosis)
        parts.push(`Diagnóstico: ${o.diagnosis}`);
    if (o.warrantyDays)
        parts.push(`Garantía ${o.warrantyDays} días`);
    if (o.nextService)
        parts.push(`Próximo: ${o.nextService}`);
    return parts.join(" · ").slice(0, 2000);
}
//# sourceMappingURL=workflow.js.map