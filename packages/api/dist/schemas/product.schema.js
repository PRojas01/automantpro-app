import { z } from "zod";
export const createProductSchema = z.object({
    name: z.string().min(1).max(200),
    price: z.number().positive(),
    stock: z.number().int().min(0).optional(),
    image: z.string().url().optional(),
    vehicleIds: z.array(z.string().uuid()).optional(),
});
export const updateProductSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    image: z.string().url().optional(),
    vehicleIds: z.array(z.string().uuid()).optional(),
});
export const productFilterSchema = z.object({
    vehicleId: z.string().uuid().optional(),
    storeId: z.string().uuid().optional(),
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
//# sourceMappingURL=product.schema.js.map