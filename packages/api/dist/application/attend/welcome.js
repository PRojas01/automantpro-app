import { ecDayRange, formatEcDateTime } from "../appointments/messages.js";
import { planItemsFor } from "../registration/plan-text.js";
import { normalizeWhatsappNumber } from "../settings/whatsapp-number.js";
import { ORDER_STAGE_LABELS, quoteRequestCode } from "../quotes/workflow.js";
import { IN_SHOP_STATUSES, OPEN_STATUSES, WORK_ORDER_LABELS, formatUsd, workOrderCode } from "../work-orders/workflow.js";
export const NEW_CONTACT_MESSAGE = "¡Hola! 👋 Bienvenido a AutoMantPro 🚗\nTu vehículo, tu taller y tus repuestos, conectados en un solo chat.\n\n¿Quién eres?\n1) 🚗 Soy nuevo y tengo un vehículo\n2) 🔧 Soy nuevo y tengo un taller\n3) 📦 Soy nuevo y tengo un almacén de repuestos\n4) 🔑 Ya tengo cuenta (te escribo desde otro número)\n\nResponde con el número.";
const MENUS = {
    dueno: "¿Qué necesitas hoy?\n1) 🚗 Mis vehículos y su plan\n2) 🔍 Tengo un síntoma o ruido\n3) 📅 Agendar en un taller\n4) 📦 Cotizar un repuesto\n5) 🙋 Hablar con una persona",
    taller: "¿Qué hacemos hoy?\n1) 📅 Agenda de hoy\n2) 🔔 Solicitudes de turno\n3) 🧾 Órdenes de trabajo\n4) 👥 Mis clientes\n5) 🔧 Mi taller y servicios\n6) 🙋 Hablar con una persona",
    almacen: "¿Qué hacemos hoy?\n1) 💬 Cotizaciones por responder\n2) 📦 Mis pedidos\n3) 📋 Catálogo\n4) 🏪 Mi almacén\n5) 🙋 Hablar con una persona",
};
const firstName = (name) => String(name ?? "").trim().split(/\s+/)[0] ?? "";
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export function pendingTasks(ctx) {
    const { detail } = ctx;
    if (!detail)
        return [];
    const now = ctx.now ?? new Date();
    const role = String(detail.user.role);
    const userId = String(detail.user.id);
    const tasks = [];
    // Un turno de hace menos de 2 horas todavía se considera vigente.
    const current = (a) => new Date(a.scheduledAt).getTime() >= now.getTime() - 2 * 60 * 60 * 1000;
    if (!detail.user.consentAt) {
        tasks.push({ text: "Falta registrar el consentimiento LOPDP: pídelo antes de guardar más datos.", forCustomer: false });
    }
    if (role === "dueno") {
        for (const a of ctx.appointments.filter((x) => x.ownerId === userId && current(x))) {
            if (a.status === "confirmed") {
                tasks.push({ text: `📅 Tienes turno el ${formatEcDateTime(a.scheduledAt)} en ${a.shopName}.`, forCustomer: true });
            }
            else if (a.status === "pending") {
                tasks.push({
                    text: `⏳ Tu solicitud de turno en ${a.shopName} para el ${formatEcDateTime(a.scheduledAt)} espera confirmación del taller.`,
                    forCustomer: true,
                });
            }
        }
        if (detail.vehicles.length === 0) {
            tasks.push({ text: "No tiene vehículos registrados: agrega el primero desde su ficha.", forCustomer: false });
        }
        for (const vehicle of detail.vehicles) {
            const overdue = planItemsFor(vehicle).filter((i) => i.status === "vencido").length;
            if (overdue > 0) {
                const label = [vehicle.make, vehicle.model].filter(Boolean).join(" ");
                tasks.push({ text: `🔴 El plan de tu ${label} tiene ${plural(overdue, "servicio vencido", "servicios vencidos")}.`, forCustomer: true });
            }
        }
    }
    const business = role === "taller" ? detail.shop : role === "almacen" ? detail.store : null;
    if (business) {
        const label = role === "taller" ? "taller" : "almacén";
        if (business.verificationStatus === "pending") {
            tasks.push({ text: `🕒 Tu ${label} está en verificación; te aviso apenas quede aprobado.`, forCustomer: true });
        }
        else if (business.verificationStatus === "rejected") {
            tasks.push({ text: `⚠️ Tu registro de ${label} tiene una observación pendiente por corregir.`, forCustomer: true });
        }
    }
    if (role === "taller") {
        const mine = ctx.appointments.filter((a) => a.shopUserId === userId);
        const requests = mine.filter((a) => a.status === "pending" && current(a)).length;
        if (requests > 0) {
            tasks.push({ text: `🔔 Tienes ${plural(requests, "solicitud de turno", "solicitudes de turno")} por responder.`, forCustomer: true });
        }
        const { start, end } = ecDayRange(now);
        const today = mine.filter((a) => {
            const t = new Date(a.scheduledAt).getTime();
            return a.status === "confirmed" && t >= start.getTime() && t < end.getTime();
        }).length;
        if (today > 0)
            tasks.push({ text: `📅 Hoy atiendes ${plural(today, "turno", "turnos")}.`, forCustomer: true });
    }
    const orders = ctx.workOrders ?? [];
    if (role === "dueno") {
        for (const o of orders.filter((x) => x.ownerId === userId)) {
            if (o.status === "presupuesto_enviado") {
                tasks.push({ text: `🧾 Tienes un presupuesto por aprobar en ${o.shopName} (${workOrderCode(o.number)}): ${formatUsd(o.total)}.`, forCustomer: true });
            }
            else if (IN_SHOP_STATUSES.includes(o.status)) {
                tasks.push({ text: `🔧 Tu ${o.vehicleLabel} está en ${o.shopName} (${workOrderCode(o.number)}): ${String(WORK_ORDER_LABELS[o.status]).toLowerCase()}.`, forCustomer: true });
            }
        }
    }
    if (role === "taller") {
        const open = orders.filter((o) => o.shopUserId === userId && OPEN_STATUSES.includes(o.status)).length;
        if (open > 0)
            tasks.push({ text: `🧾 Tienes ${plural(open, "orden de trabajo abierta", "órdenes de trabajo abiertas")}.`, forCustomer: true });
    }
    const quotes = ctx.quotes;
    if (quotes) {
        for (const r of quotes.requests.filter((x) => x.status === "abierta")) {
            tasks.push({ text: `💰 Tu solicitud de cotización de ${r.partName} (${quoteRequestCode(r.number)}) está en curso; te envío la comparativa apenas respondan los almacenes.`, forCustomer: true });
        }
        for (const o of quotes.orders.filter((x) => x.requesterId === userId && ["confirmado", "preparando", "despachado"].includes(x.stage))) {
            tasks.push({ text: `📦 Tu pedido de ${o.partName} en ${o.storeName} está ${String(ORDER_STAGE_LABELS[o.stage]).toLowerCase()}.`, forCustomer: true });
        }
        if (role === "almacen") {
            const toAnswer = quotes.storeQuotes.filter((q) => q.status === "invitado" && q.requestStatus === "abierta").length;
            if (toAnswer > 0)
                tasks.push({ text: `📨 Tienes ${plural(toAnswer, "solicitud de cotización", "solicitudes de cotización")} por responder.`, forCustomer: true });
            const toShip = quotes.orders.filter((o) => o.storeUserId === userId && ["confirmado", "preparando"].includes(o.stage)).length;
            if (toShip > 0)
                tasks.push({ text: `🧾 Tienes ${plural(toShip, "pedido", "pedidos")} por despachar.`, forCustomer: true });
        }
    }
    const lastNote = ctx.events.find((ev) => ev.type === "operator.note");
    if (lastNote) {
        tasks.push({ text: `Última nota (${formatEcDateTime(lastNote.createdAt)}): ${String(lastNote.payload.text ?? "")}`, forCustomer: false });
    }
    return tasks;
}
/** Mensaje de ingreso: bienvenida para un contacto nuevo; saludo, pendientes y menú para uno registrado. */
export function welcomeMessage(ctx, options = {}) {
    // La línea extra se configura en Ajustes → Operación (docs/35 A2).
    const intro = options.intro?.trim() ? `${options.intro.trim()}\n\n` : "";
    if (!ctx.detail)
        return `${intro}${NEW_CONTACT_MESSAGE}`;
    const role = String(ctx.detail.user.role);
    const name = firstName(ctx.detail.user.name);
    const pendings = pendingTasks(ctx)
        .filter((t) => t.forCustomer)
        .map((t) => t.text);
    const parts = [`¡Hola${name ? ` ${name}` : ""}! 👋 Qué gusto saludarte de nuevo.`];
    if (pendings.length > 0)
        parts.push(pendings.join("\n"));
    parts.push(MENUS[role] ?? "¿En qué te puedo ayudar hoy?");
    return `${intro}${parts.join("\n\n")}`;
}
/**
 * Detecta el perfil que declaró el contacto en su primer mensaje. Reconoce lo que escribe el menú
 * de inicio ("soy dueño de un vehículo", "tengo un taller"…) y las variantes más comunes.
 */
export function detectProfileIntent(input) {
    const text = input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    if (/\bya tengo cuenta\b|\bya estoy registrad|\bmi cuenta\b/.test(text))
        return "cuenta";
    if (/\balmacen\b|\brepuester|\bvendo repuestos\b|\btienda de repuestos\b/.test(text))
        return "almacen";
    if (/\btaller\b|\bmecanic|\blubricadora\b/.test(text))
        return "taller";
    if (/\bdueno\b|\bmi (carro|auto|vehiculo|moto|camioneta)\b|\btengo un (vehiculo|carro|auto|moto)\b/.test(text))
        return "dueno";
    return null;
}
/** Extrae el celular y el código de visita de un número o de un mensaje pegado por el operador. */
export function parseContactInput(input) {
    const text = input.slice(0, 2000);
    const code = /\bAMP-[A-HJ-NP-Z2-9]{4}\b/i.exec(text)?.[0]?.toUpperCase() ?? null;
    const rest = code ? text.split(new RegExp(code, "i")).join(" ") : text;
    for (const candidate of rest.match(/\+?\d[\d\s().-]{6,}\d/g) ?? []) {
        const digits = normalizeWhatsappNumber(candidate);
        if (digits)
            return { phone: `+${digits}`, code };
    }
    return { phone: null, code };
}
//# sourceMappingURL=welcome.js.map