import type { z } from "zod";
import { vehicleClassesSchema, serviceTaxonomySchema, maintenanceRulesSchema } from "./schemas.js";
export type VehicleClass = z.infer<typeof vehicleClassesSchema>["classes"][number];
export type Fuel = z.infer<typeof vehicleClassesSchema>["fuels"][number];
export type Category = z.infer<typeof serviceTaxonomySchema>["categories"][number];
export type Subservice = Category["subservices"][number];
export type AppliesTo = Subservice["appliesTo"];
export type MaintenanceRuleRaw = z.infer<typeof maintenanceRulesSchema>["rules"][number];
export interface VehicleClassesCatalog {
    version: string;
    source: string;
    classes: VehicleClass[];
    fuels: Fuel[];
}
export interface ServiceTaxonomy {
    version: string;
    source: string;
    categories: Category[];
}
export interface MaintenanceRules {
    version: string;
    source: string;
    note?: string;
    rules: MaintenanceRuleRaw[];
}
/**
 * Regla expandida: una fila por combinación (serviceId, clase, combustible).
 * '*', '*' se expande a todas las clases y combustibles del catálogo.
 */
export interface ExpandedRule {
    serviceId: string;
    classId: string;
    fuelId: string;
    intervalKm: number | null;
    intervalMonths: number | null;
    severeFactor: number;
    note?: string;
}
/** Catálogo de clases validado con zod al cargar (lanza si el JSON es inválido). */
export declare const vehicleClasses: VehicleClassesCatalog;
/** Taxonomía de servicios validada con zod al cargar. */
export declare const serviceTaxonomy: ServiceTaxonomy;
/** Reglas de mantenimiento validadas con zod al cargar. */
export declare const maintenanceRules: MaintenanceRules;
/** Lista de ids de clases de vehículo. */
export declare const classIds: readonly string[];
/** Lista de ids de combustibles. */
export declare const fuelIds: readonly string[];
export interface SubserviceRef {
    category: Category;
    subservice: Subservice;
}
/** Devuelve categoría + subservicio por id, o undefined si no existe. */
export declare function findSubservice(serviceId: string): SubserviceRef | undefined;
/** Interpola '*' con las listas reales del catálogo y ordena los valores. */
export declare function normalizeList(list: string[], allValues: readonly string[]): string[];
/** Combos (clase, combustible) a los que aplica un subservicio, expandidos. */
export declare function applicableCombos(subservice: Subservice): Array<{
    classId: string;
    fuelId: string;
}>;
/** Reglas expandidas (una por combinación real). Orden estable de entrada. */
export declare function expandRules(): ExpandedRule[];
/**
 * Reglas aplicables a un vehículo (clase + combustible), expandidas.
 * Un subservicio puede tener varias filas: se devuelven todas.
 */
export declare function resolveRules(classId: string, fuelId: string): ExpandedRule[];
/** Comprueba si un subservicio aplica a una clase + combustible. */
export declare function isServiceApplicable(serviceId: string, classId: string, fuelId: string): boolean;
//# sourceMappingURL=catalogs.d.ts.map