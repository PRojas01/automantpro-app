import { z } from "zod";
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    stock: z.ZodOptional<z.ZodNumber>;
    image: z.ZodOptional<z.ZodString>;
    vehicleIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    stock?: number | undefined;
    image?: string | undefined;
    vehicleIds?: string[] | undefined;
}, {
    name: string;
    price: number;
    stock?: number | undefined;
    image?: string | undefined;
    vehicleIds?: string[] | undefined;
}>;
export declare const updateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    stock: z.ZodOptional<z.ZodNumber>;
    image: z.ZodOptional<z.ZodString>;
    vehicleIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    price?: number | undefined;
    stock?: number | undefined;
    image?: string | undefined;
    vehicleIds?: string[] | undefined;
}, {
    name?: string | undefined;
    price?: number | undefined;
    stock?: number | undefined;
    image?: string | undefined;
    vehicleIds?: string[] | undefined;
}>;
export declare const productFilterSchema: z.ZodObject<{
    vehicleId: z.ZodOptional<z.ZodString>;
    storeId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    vehicleId?: string | undefined;
    storeId?: string | undefined;
    q?: string | undefined;
}, {
    vehicleId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    storeId?: string | undefined;
    q?: string | undefined;
}>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
//# sourceMappingURL=product.schema.d.ts.map