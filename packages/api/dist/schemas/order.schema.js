import { z } from "zod";
export const createOrderSchema = z.object({
    orderType: z.enum(["service", "repuesto"]),
    toShopId: z.string().uuid().optional(),
    toStoreId: z.string().uuid().optional(),
    lines: z
        .array(z.object({
        productId: z.string().uuid().optional(),
        itemName: z.string().min(1).max(200),
        qty: z.number().int().min(1).default(1),
        unitPrice: z.number().positive().optional(),
    }))
        .min(1),
});
export const updateOrderSchema = z.object({
    status: z.enum(["requested", "accepted", "fulfilled", "cancelled"]).optional(),
});
export const orderFilterSchema = z.object({
    orderType: z.enum(["service", "repuesto"]).optional(),
    status: z.enum(["requested", "accepted", "fulfilled", "cancelled"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
//# sourceMappingURL=order.schema.js.map