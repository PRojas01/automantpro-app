// Exportaciones en CSV (docs/35 A4). Se escapa todo y se agrega la marca BOM para que Excel en
// Windows abra los acentos bien. El separador es el punto y coma, como espera Excel en español.
const SEPARATOR = ";";
function cell(value) {
    if (value === null || value === undefined)
        return "";
    const text = value instanceof Date ? value.toISOString() : String(value);
    // Quitar saltos de línea y neutralizar fórmulas (=, +, -, @ al inicio) para no ejecutar nada en Excel.
    const clean = text.replace(/\r?\n/g, " ").replace(/\t/g, " ");
    const safe = /^[=+\-@]/.test(clean) ? `'${clean}` : clean;
    return `"${safe.replace(/"/g, '""')}"`;
}
export function toCsv(columns, rows) {
    const head = columns.map(([, label]) => cell(label)).join(SEPARATOR);
    const body = rows.map((row) => columns.map(([key]) => cell(row[key])).join(SEPARATOR));
    return `﻿${[head, ...body].join("\r\n")}\r\n`;
}
/** Nombre de archivo con la fecha, sin datos personales. */
export function csvFileName(dataset, now = new Date()) {
    const stamp = now.toISOString().slice(0, 10);
    return `automantpro-${dataset}-${stamp}.csv`;
}
//# sourceMappingURL=csv.js.map