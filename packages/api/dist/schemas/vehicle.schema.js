import { z } from "zod";
export const createVehicleSchema = z.object({
    make: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    year: z.number().int().min(1900).max(2100),
    currentKm: z.number().int().min(0),
});
export const updateVehicleSchema = z.object({
    currentKm: z.number().int().min(0).optional(),
    make: z.string().min(1).max(60).optional(),
    model: z.string().min(1).max(60).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
});
//# sourceMappingURL=vehicle.schema.js.map