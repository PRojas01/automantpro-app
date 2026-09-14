import { applicableCombos, classIds, expandRules, fuelIds, serviceTaxonomy, } from "./catalogs.js";
const ALL_CLASSES = new Set(classIds);
const ALL_FUELS = new Set(fuelIds);
/**
 * Valida la consistencia entre los tres catálogos:
 *  - cada servicio periódico cubre EXACTAMENTE sus combinaciones aplicables (sin huecos);
 *  - ninguna regla apunta a un servicio no periódico o a una combinación inaplicable;
 *  - no hay duplicados ni clases/combustibles desconocidos;
 *  - cada regla tiene al menos una dimensión de disparo (km o meses).
 * Devuelve la lista de problemas (vacía = catálogos consistentes).
 */
export function validateMaintenanceCatalogs() {
    const issues = [];
    const allSubservices = serviceTaxonomy.categories.flatMap((c) => c.subservices.map((s) => ({ categoryId: c.id, subservice: s })));
    const expandedRules = expandRules();
    const rulesKey = (r) => `${r.serviceId}|${r.classId}|${r.fuelId}`;
    const rulesByService = new Map();
    const seenRuleKeys = new Set();
    for (const rule of expandedRules) {
        if (!ALL_CLASSES.has(rule.classId)) {
            issues.push({ message: `Regla de '${rule.serviceId}' con clase desconocida '${rule.classId}'` });
        }
        if (!ALL_FUELS.has(rule.fuelId)) {
            issues.push({ message: `Regla de '${rule.serviceId}' con combustible desconocido '${rule.fuelId}'` });
        }
        if (rule.intervalKm === null && rule.intervalMonths === null) {
            issues.push({
                message: `Regla de '${rule.serviceId}' (${rule.classId}/${rule.fuelId}) sin kilómetros ni meses`,
            });
        }
        const key = rulesKey(rule);
        if (seenRuleKeys.has(key)) {
            issues.push({ message: `Regla duplicada: ${key}` });
        }
        seenRuleKeys.add(key);
        let set = rulesByService.get(rule.serviceId);
        if (!set) {
            set = new Map();
            rulesByService.set(rule.serviceId, set);
        }
        set.set(key, { classId: rule.classId, fuelId: rule.fuelId });
    }
    const knownServiceIds = new Set(allSubservices.map((s) => s.subservice.id));
    for (const serviceId of rulesByService.keys()) {
        if (!knownServiceIds.has(serviceId)) {
            issues.push({ message: `Reglas para un servicio inexistente en la taxonomía: '${serviceId}'` });
        }
    }
    for (const { subservice, categoryId } of allSubservices) {
        void categoryId;
        const applicable = applicableCombos(subservice);
        const applicableKeys = new Set(applicable.map((c) => `${subservice.id}|${c.classId}|${c.fuelId}`));
        const rules = rulesByService.get(subservice.id) ?? new Map();
        if (!subservice.periodic && rules.size > 0) {
            issues.push({
                message: `El servicio no periódico '${subservice.id}' tiene reglas de mantenimiento`,
            });
        }
        if (!subservice.periodic)
            continue;
        if (applicable.length === 0) {
            issues.push({ message: `El servicio periódico '${subservice.id}' no tiene combinaciones aplicables` });
        }
        for (const key of applicableKeys) {
            if (!rules.has(key)) {
                const [serviceId, classId, fuelId] = key.split("|");
                issues.push({
                    message: `Hueco: falta regla para '${serviceId}' en ${classId}/${fuelId}`,
                });
            }
        }
        for (const ruleKey of rules.keys()) {
            if (!applicableKeys.has(ruleKey)) {
                const [serviceId, classId, fuelId] = ruleKey.split("|");
                issues.push({
                    message: `Regla inaplicable: '${serviceId}' en ${classId}/${fuelId} no está en appliesTo`,
                });
            }
        }
    }
    return issues;
}
//# sourceMappingURL=validation.js.map