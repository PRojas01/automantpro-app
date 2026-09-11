import { z } from "zod";
export declare const marketplaceFilterSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    vehicleMake: z.ZodOptional<z.ZodString>;
    vehicleModel: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    year?: number | undefined;
    q?: string | undefined;
    vehicleMake?: string | undefined;
    vehicleModel?: string | undefined;
}, {
    year?: number | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    q?: string | undefined;
    vehicleMake?: string | undefined;
    vehicleModel?: string | undefined;
}>;
//# sourceMappingURL=marketplace.schema.d.ts.map