import { z } from "zod";
export const vehicleClassSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    subtypes: z.array(z.string()).default([]),
});
export const fuelSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
});
export const vehicleClassesSchema = z.object({
    version: z.string(),
    source: z.string(),
    generatedAt: z.string().optional(),
    note: z.string().optional(),
    classes: z.array(vehicleClassSchema).min(1),
    fuels: z.array(fuelSchema).min(1),
});
export const appliesToSchema = z.object({
    classes: z.array(z.string()).min(1),
    fuels: z.array(z.string()).min(1),
});
export const subserviceSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    detail: z.string().optional(),
    periodic: z.boolean().default(false),
    appliesTo: appliesToSchema,
    durationMin: z.number().int().min(1),
    costRefUsd: z.number().min(0),
    costNote: z.string().optional(),
});
export const categorySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    order: z.number().int().min(1),
    subservices: z.array(subserviceSchema).min(1),
});
export const serviceTaxonomySchema = z.object({
    version: z.string(),
    source: z.string(),
    generatedAt: z.string().optional(),
    note: z.string().optional(),
    categories: z.array(categorySchema),
});
export const maintenanceRuleSchema = z.object({
    serviceId: z.string().min(1),
    classId: z.array(z.string()).min(1),
    fuelId: z.array(z.string()).min(1),
    intervalKm: z.number().int().positive().nullable(),
    intervalMonths: z.number().int().positive().nullable(),
    severeFactor: z.number().min(0.5).max(0.8),
    note: z.string().optional(),
});
export const maintenanceRulesSchema = z.object({
    version: z.string(),
    source: z.string(),
    generatedAt: z.string().optional(),
    note: z.string().optional(),
    rules: z.array(maintenanceRuleSchema),
});
//# sourceMappingURL=schemas.js.map