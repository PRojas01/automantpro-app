import { z } from "zod";
export declare const createVehicleSchema: z.ZodObject<{
    make: z.ZodString;
    model: z.ZodString;
    year: z.ZodNumber;
    currentKm: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    model: string;
    make: string;
    year: number;
    currentKm: number;
}, {
    model: string;
    make: string;
    year: number;
    currentKm: number;
}>;
export declare const updateVehicleSchema: z.ZodObject<{
    currentKm: z.ZodOptional<z.ZodNumber>;
    make: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    model?: string | undefined;
    make?: string | undefined;
    year?: number | undefined;
    currentKm?: number | undefined;
}, {
    model?: string | undefined;
    make?: string | undefined;
    year?: number | undefined;
    currentKm?: number | undefined;
}>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
//# sourceMappingURL=vehicle.schema.d.ts.map