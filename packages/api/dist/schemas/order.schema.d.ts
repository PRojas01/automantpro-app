import { z } from "zod";
export declare const createOrderSchema: z.ZodObject<{
    orderType: z.ZodEnum<["service", "repuesto"]>;
    toShopId: z.ZodOptional<z.ZodString>;
    toStoreId: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        itemName: z.ZodString;
        qty: z.ZodDefault<z.ZodNumber>;
        unitPrice: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        itemName: string;
        qty: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
    }, {
        itemName: string;
        productId?: string | undefined;
        qty?: number | undefined;
        unitPrice?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    orderType: "service" | "repuesto";
    lines: {
        itemName: string;
        qty: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
    }[];
    toShopId?: string | undefined;
    toStoreId?: string | undefined;
}, {
    orderType: "service" | "repuesto";
    lines: {
        itemName: string;
        productId?: string | undefined;
        qty?: number | undefined;
        unitPrice?: number | undefined;
    }[];
    toShopId?: string | undefined;
    toStoreId?: string | undefined;
}>;
export declare const updateOrderSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["requested", "accepted", "fulfilled", "cancelled"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "cancelled" | "requested" | "accepted" | "fulfilled" | undefined;
}, {
    status?: "cancelled" | "requested" | "accepted" | "fulfilled" | undefined;
}>;
export declare const orderFilterSchema: z.ZodObject<{
    orderType: z.ZodOptional<z.ZodEnum<["service", "repuesto"]>>;
    status: z.ZodOptional<z.ZodEnum<["requested", "accepted", "fulfilled", "cancelled"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "cancelled" | "requested" | "accepted" | "fulfilled" | undefined;
    orderType?: "service" | "repuesto" | undefined;
}, {
    status?: "cancelled" | "requested" | "accepted" | "fulfilled" | undefined;
    orderType?: "service" | "repuesto" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
//# sourceMappingURL=order.schema.d.ts.map