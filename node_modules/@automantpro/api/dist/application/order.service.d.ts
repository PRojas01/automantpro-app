import type { CreateOrderInput, UpdateOrderInput } from "../schemas/order.schema.js";
export declare function create(fromUserId: string, input: CreateOrderInput): Promise<({
    lines: {
        id: string;
        productId: string | null;
        itemName: string;
        qty: number;
        unitPrice: import("@prisma/client/runtime/library").Decimal | null;
        orderId: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    status: import("@prisma/client").$Enums.OrderStatus;
    orderType: import("@prisma/client").$Enums.OrderType;
    fromUserId: string;
    toShopId: string | null;
    toStoreId: string | null;
}) | null>;
export declare function update(orderId: string, userId: string, userRole: string, input: UpdateOrderInput): Promise<{
    id: string;
    createdAt: Date;
    status: import("@prisma/client").$Enums.OrderStatus;
    orderType: import("@prisma/client").$Enums.OrderType;
    fromUserId: string;
    toShopId: string | null;
    toStoreId: string | null;
} | null>;
export declare function list(userId: string, userRole: string, filters: {
    orderType?: string;
    status?: string;
    page: number;
    limit: number;
}): Promise<{
    data: ({
        lines: {
            id: string;
            productId: string | null;
            itemName: string;
            qty: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal | null;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderType: import("@prisma/client").$Enums.OrderType;
        fromUserId: string;
        toShopId: string | null;
        toStoreId: string | null;
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}>;
//# sourceMappingURL=order.service.d.ts.map