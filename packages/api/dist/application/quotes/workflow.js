import { formatUsd } from "../work-orders/workflow.js";
// Cotizaciones de repuestos y pedidos a almacenes (docs/34 D9, A4, A5 y T9): estados, comparativa
// y mensajes para WhatsApp. El pedido comparte con el almacén solo lo necesario, sin el teléfono
// del cliente.
export const REQUEST_LABELS = {
    abierta: "Abierta",
    con_pedido: "Con pedido",
    sin_pedido: "Cerrada sin pedido",
};
export const QUOTE_LABELS = {
    invitado: "Esperando respuesta",
    cotizado: "Cotizó",
    sin_stock: "No tiene",
    elegida: "Elegida",
    descartada: "No elegida",
};
export const ORDER_STAGE_LABELS = {
    confirmado: "Confirmado",
    preparando: "Preparando",
    despachado: "Despachado",
    entregado: "Entregado",
    cancelado: "Cancelado",
};
export const ORDER_STAGE_TRANSITIONS = {
    confirmado: ["preparando", "cancelado"],
    preparando: ["despachado", "entregado", "cancelado"],
    despachado: ["entregado", "cancelado"],
    entregado: [],
    cancelado: [],
};
/** Equivalencia con el estado original de la tabla Order, que usa la API existente. */
export const ORDER_STATUS_FOR_STAGE = {
    confirmado: "requested",
    preparando: "accepted",
    despachado: "accepted",
    entregado: "fulfilled",
    cancelado: "cancelled",
};
export const LOSS_REASONS = [
    ["precio", "Precio"],
    ["tiempo", "Tiempo de entrega"],
    ["existencias", "Existencias"],
    ["otro", "Otro"],
];
export const MAX_STORES_PER_REQUEST = 5;
export const quoteRequestCode = (number) => `CQ-${String(number).padStart(5, "0")}`;
const round = (value) => Math.round(value * 100) / 100;
/** Cotizaciones con precio, de la más barata a la más cara. */
export function rankQuotes(quotes) {
    return quotes
        .filter((q) => (q.status === "cotizado" || q.status === "elegida") && q.unitPrice !== null)
        .sort((a, b) => a.unitPrice - b.unitPrice || a.storeName.localeCompare(b.storeName, "es"));
}
function quoteLine(q, quantity) {
    const price = q.unitPrice ?? 0;
    const parts = [`${q.storeName} · ${formatUsd(price)} c/u${quantity > 1 ? ` (total ${formatUsd(round(price * quantity))})` : ""}`];
    if (q.brand)
        parts.push(q.brand);
    if (q.availability)
        parts.push(q.availability);
    if (q.deliveryTime)
        parts.push(`entrega ${q.deliveryTime}`);
    if (q.warrantyDays)
        parts.push(`garantía ${q.warrantyDays} días`);
    if (q.validDays)
        parts.push(`válida ${q.validDays} días`);
    return parts.join(" · ");
}
const partText = (r) => `${r.partName}${r.quantity > 1 ? ` x${r.quantity}` : ""}`;
export function storeRequestMessage(r) {
    const lines = [`📦 Solicitud de cotización — AutoMantPro ${quoteRequestCode(r.number)}`, `Repuesto: ${partText(r)}`];
    if (r.partCode)
        lines.push(`Código: ${r.partCode}`);
    if (r.vehicleLabel)
        lines.push(`Vehículo: ${r.vehicleLabel}`);
    lines.push(`Ciudad: ${r.city}`);
    if (r.notes)
        lines.push(`Notas: ${r.notes}`);
    lines.push("", "Por favor responde con: precio unitario, marca, disponibilidad, garantía y tiempo de entrega.", "Si no lo tienes, responde «No tengo».");
    return lines.join("\n");
}
export function comparisonMessage(r, quotes) {
    const ranked = rankQuotes(quotes);
    const without = quotes.filter((q) => q.status === "sin_stock").map((q) => q.storeName);
    const waiting = quotes.filter((q) => q.status === "invitado").length;
    const lines = [`💰 Cotizaciones para ${partText(r)} (${quoteRequestCode(r.number)})`, ""];
    if (ranked.length === 0) {
        lines.push("Aún estamos esperando las respuestas de los almacenes. Te aviso apenas lleguen.");
    }
    else {
        ranked.forEach((q, i) => lines.push(`${i + 1}) ${quoteLine(q, r.quantity)}`));
    }
    if (without.length > 0)
        lines.push("", `No lo tienen: ${without.join(", ")}`);
    if (waiting > 0 && ranked.length > 0)
        lines.push(`Faltan ${waiting} ${waiting === 1 ? "almacén por responder" : "almacenes por responder"}.`);
    if (ranked.length > 0)
        lines.push("", "Responde con el número de la opción que prefieres.");
    return lines.join("\n");
}
export function requesterOrderMessage(o) {
    const code = quoteRequestCode(o.requestNumber);
    const part = `${o.partName}${o.quantity > 1 ? ` x${o.quantity}` : ""}${o.brand ? ` (${o.brand})` : ""}`;
    switch (o.stage) {
        case "preparando":
            return `📦 ${o.storeName} está preparando tu pedido de ${part} (${code}).`;
        case "despachado":
            return `🚚 Tu pedido de ${part} ya salió de ${o.storeName}${o.deliveryTime ? `; entrega estimada: ${o.deliveryTime}` : ""} (${code}).`;
        case "entregado":
            return `✅ Tu pedido de ${part} fue entregado (${code}).\n\n¿Cómo te fue con ${o.storeName}? Califica del 1 al 5.`;
        case "cancelado":
            return `❌ Tu pedido de ${part} en ${o.storeName} fue cancelado${o.cancelReason ? `: ${o.cancelReason}` : ""} (${code}).\n¿Quieres que pidamos otra cotización?`;
        default:
            return `🧾 Pedido confirmado con ${o.storeName}\nRepuesto: ${part}\nTotal: ${formatUsd(o.total)}${o.deliveryTime ? `\nEntrega: ${o.deliveryTime}` : ""}\n\nTe aviso cada avance (${code}).`;
    }
}
export function storeOrderMessage(o) {
    const code = quoteRequestCode(o.requestNumber);
    if (o.stage === "cancelado")
        return `❌ El pedido ${code} de ${o.partName} fue cancelado${o.cancelReason ? `: ${o.cancelReason}` : ""}.`;
    return `✅ Pedido confirmado — AutoMantPro ${code}\nRepuesto: ${o.partName}${o.quantity > 1 ? ` x${o.quantity}` : ""}${o.brand ? ` (${o.brand})` : ""}\nTotal acordado: ${formatUsd(o.total)}\n\nCoordinamos la entrega por este chat. Avísanos cuando esté preparado y cuando salga.`;
}
export function lostQuoteMessage(r) {
    return `Gracias por cotizar ${r.partName} (${quoteRequestCode(r.number)}). Esta vez el cliente eligió otra opción.\n¿Nos cuentas qué pesó más: precio, tiempo de entrega o existencias? Nos ayuda a enviarte solicitudes que puedas ganar.`;
}
//# sourceMappingURL=workflow.js.map