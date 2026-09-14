const DEFAULT_MAX_LENGTH = 1_024;
/** Da formato a un número de kilómetros con separador de miles es-EC (p. ej. 45.000). */
export function formatKm(value) {
    const rounded = String(Math.round(value));
    return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
/** Da formato a una duración: "1 h 30 min" o "45 min". */
export function formatDuration(totalMin) {
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    if (hours === 0)
        return `${minutes} min`;
    if (minutes === 0)
        return `${hours} h`;
    return `${hours} h ${minutes} min`;
}
function formatCost(costRefUsd) {
    const rounded = Math.round(costRefUsd);
    return `~$${rounded}`;
}
function fits(pageLines, newLine, maxLength) {
    const joined = pageLines.length > 0 ? pageLines.join("\n") : "";
    return joined.length === 0 ? newLine.length <= maxLength : joined.length + 1 + newLine.length <= maxLength;
}
/**
 * Arma páginas de texto (cada una ≤ maxLength) repetiendo el encabezado
 * en cada página; el pie solo va en la última.
 */
export function paginateText(headerLines, blocks, footerLines, maxLength = DEFAULT_MAX_LENGTH) {
    let current = [...headerLines];
    const pages = [];
    const flush = () => {
        pages.push(current);
        current = [...headerLines];
    };
    for (let i = 0; i < blocks.length; i += 1) {
        const block = blocks[i];
        if (!fits(current, block, maxLength))
            flush();
        current.push(block);
    }
    for (const footerLine of footerLines) {
        if (!fits(current, footerLine, maxLength))
            flush();
        current.push(footerLine);
    }
    if (current.length > 0 || pages.length === 0) {
        pages.push(current);
    }
    return pages.map((page) => page.join("\n"));
}
function alDiaLine(items, budget) {
    if (items.length === 0) {
        return "🟢 Al día: ninguno pendiente";
    }
    const names = items.map((i) => i.serviceName);
    const candidate = (shownCount) => {
        const shown = names.slice(0, shownCount).join(", ");
        const extra = names.length - shownCount;
        const suffix = extra > 0 ? ` y ${extra} más` : "";
        return `🟢 Al día: ${shown}${suffix}`;
    };
    if (budget !== undefined) {
        for (let shown = names.length; shown >= 1; shown -= 1) {
            const line = candidate(shown);
            if (line.length <= budget)
                return line;
        }
    }
    return candidate(5);
}
/**
 * Formatea el plan como texto de WhatsApp (docs/33 §3 paso 2).
 * Devuelve una o más páginas, cada una ≤ 1024 caracteres.
 */
export function formatPlanWhatsApp(ctx) {
    const maxLength = ctx.maxLength ?? DEFAULT_MAX_LENGTH;
    const { plan } = ctx;
    let readingSuffix = "";
    if (plan.lastReadingDaysAgo !== null) {
        readingSuffix =
            plan.lastReadingDaysAgo === 0
                ? " (actualizado hoy)"
                : ` (actualizado hace ${plan.lastReadingDaysAgo} días)`;
    }
    const header = `${ctx.label} · ${formatKm(plan.odometerKm)} km${readingSuffix}`;
    const vencidos = plan.items.filter((i) => i.status === "vencido");
    const proximos = plan.items.filter((i) => i.status === "proximo");
    const alDia = plan.items.filter((i) => i.status === "al_dia");
    const numbered = [...vencidos, ...proximos];
    const blocks = [];
    const pushGroup = (title, group) => {
        blocks.push(title);
        if (group.length === 0) {
            blocks.push("· ninguno");
            return;
        }
        for (const item of group) {
            const cost = formatCost(item.costRefUsd);
            blocks.push(`${numbered.indexOf(item) + 1}) ${item.serviceName} · ${item.reason} · ${cost}`);
        }
    };
    pushGroup("🔴 Vencidos", vencidos);
    pushGroup("🟡 Próximos", proximos);
    blocks.push(alDiaLine(alDia, maxLength - header.length - 1));
    const firstOption = numbered.length + 1;
    const footer = [
        "",
        "Responde con los números que quieres atender (ej.: 1,3)",
        `${firstOption}) Ver el plan completo   ${firstOption + 1}) Actualizar kilometraje   0) Menú`,
    ];
    return paginateText([header], blocks, footer, maxLength);
}
/**
 * Formatea la selección de servicios (docs/33 §3 paso 3):
 * resumen de lo elegido con total referencial, duración y acciones.
 */
export function formatServiceSelection(selected) {
    const lines = ["Seleccionaste:"];
    let totalCost = 0;
    let totalMin = 0;
    for (const service of selected) {
        lines.push(`• ${service.name} (${formatCost(service.costRefUsd)})`);
        totalCost += service.costRefUsd;
        totalMin += service.durationMin;
    }
    lines.push(`Total referencial: ${formatCost(totalCost)} · ${formatDuration(totalMin)} aprox.`);
    lines.push("");
    lines.push("1) ✅ Buscar talleres para esto");
    lines.push("2) ➕ Agregar otro servicio");
    lines.push("3) ✏️ Quitar uno");
    lines.push("0) Menú");
    return lines.join("\n");
}
//# sourceMappingURL=plan-formatter.js.map