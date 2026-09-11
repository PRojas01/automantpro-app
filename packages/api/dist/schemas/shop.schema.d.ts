import { z } from "zod";
export declare const shopFilterSchema: z.ZodObject<{
    city: z.ZodOptional<z.ZodString>;
    specialty: z.ZodOptional<z.ZodString>;
    verified: z.ZodOptional<z.ZodBoolean>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    city?: string | undefined;
    verified?: boolean | undefined;
    specialty?: string | undefined;
}, {
    city?: string | undefined;
    verified?: boolean | undefined;
    specialty?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
//# sourceMappingURL=shop.schema.d.ts.map