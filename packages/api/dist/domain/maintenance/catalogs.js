import { createRequire } from "node:module";
import { vehicleClassesSchema, serviceTaxonomySchema, maintenanceRulesSchema, } from "./schemas.js";
const require = createRequire(import.meta.url);
const vehicleClassesRaw = require("./vehicle-classes.json");
const taxonomyRaw = require("./service-taxonomy.json");
const rulesRaw = require("./maintenance-rules.json");
/** Catálogo de clases validado con zod al cargar (lanza si el JSON es inválido). */
export const vehicleClasses = vehicleClassesSchema.parse(vehicleClassesRaw);
/** Taxonomía de servicios validada con zod al cargar. */
export const serviceTaxonomy = serviceTaxonomySchema.parse(taxonomyRaw);
/** Reglas de mantenimiento validadas con zod al cargar. */
export const maintenanceRules = maintenanceRulesSchema.parse(rulesRaw);
/** Lista de ids de clases de vehículo. */
export const classIds = vehicleClasses.classes.map((c) => c.id);
/** Lista de ids de combustibles. */
export const fuelIds = vehicleClasses.fuels.map((f) => f.id);
const SUBSERVICE_INDEX = new Map();
for (const category of serviceTaxonomy.categories) {
    for (const sub of category.subservices) {
        if (SUBSERVICE_INDEX.has(sub.id)) {
            throw new Error(`Duplicated subservice id '${sub.id}' in service-taxonomy.json`);
        }
        SUBSERVICE_INDEX.set(sub.id, { category, subservice: sub });
    }
}
/** Devuelve categoría + subservicio por id, o undefined si no existe. */
export function findSubservice(serviceId) {
    return SUBSERVICE_INDEX.get(serviceId);
}
/** Interpola '*' con las listas reales del catálogo y ordena los valores. */
export function normalizeList(list, allValues) {
    const expanded = new Set();
    for (const value of list) {
        if (value === "*") {
            for (const v of allValues)
                expanded.add(v);
        }
        else {
            expanded.add(value);
        }
    }
    return [...expanded].sort();
}
/** Combos (clase, combustible) a los que aplica un subservicio, expandidos. */
export function applicableCombos(subservice) {
    const classes = normalizeList(subservice.appliesTo.classes, classIds);
    const fuels = normalizeList(subservice.appliesTo.fuels, fuelIds);
    const combos = [];
    for (const classId of classes) {
        for (const fuelId of fuels) {
            combos.push({ classId, fuelId });
        }
    }
    return combos;
}
/** Reglas expandidas (una por combinación real). Orden estable de entrada. */
export function expandRules() {
    const expanded = [];
    for (const rule of maintenanceRules.rules) {
        const classes = normalizeList(rule.classId, classIds);
        const fuels = normalizeList(rule.fuelId, fuelIds);
        for (const classId of classes) {
            for (const fuelId of fuels) {
                expanded.push({
                    serviceId: rule.serviceId,
                    classId,
                    fuelId,
                    intervalKm: rule.intervalKm,
                    intervalMonths: rule.intervalMonths,
                    severeFactor: rule.severeFactor,
                    note: rule.note,
                });
            }
        }
    }
    return expanded;
}
/**
 * Reglas aplicables a un vehículo (clase + combustible), expandidas.
 * Un subservicio puede tener varias filas: se devuelven todas.
 */
export function resolveRules(classId, fuelId) {
    return expandRules().filter((r) => r.classId === classId && r.fuelId === fuelId);
}
/** Comprueba si un subservicio aplica a una clase + combustible. */
export function isServiceApplicable(serviceId, classId, fuelId) {
    const ref = findSubservice(serviceId);
    if (!ref)
        return false;
    const classes = new Set(normalizeList(ref.subservice.appliesTo.classes, classIds));
    const fuels = new Set(normalizeList(ref.subservice.appliesTo.fuels, fuelIds));
    return classes.has(classId) && fuels.has(fuelId);
}
//# sourceMappingURL=catalogs.js.map