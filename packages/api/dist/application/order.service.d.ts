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
    updatedAt: Date | null;
    status: import("@prisma/client").$Enums.OrderStatus;
    cancelReason: string | null;
    orderType: import("@prisma/client").$Enums.OrderType;
    fromUserId: string;
    toShopId: string | null;
    toStoreId: string | null;
    quoteRequestId: string | null;
    quoteId: string | null;
    stage: string | null;
    total: import("@prisma/client/runtime/library").Decimal | null;
}) | null>;
export declare function update(orderId: string, userId: string, userRole: string, input: UpdateOrderInput): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date | null;
    status: import("@prisma/client").$Enums.OrderStatus;
    cancelReason: string | null;
    orderType: import("@prisma/client").$Enums.OrderType;
    fromUserId: string;
    toShopId: string | null;
    toStoreId: string | null;
    quoteRequestId: string | null;
    quoteId: string | null;
    stage: string | null;
    total: import("@prisma/client/runtime/library").Decimal | null;
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
        updatedAt: Date | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        cancelReason: string | null;
        orderType: import("@prisma/client").$Enums.OrderType;
        fromUserId: string;
        toShopId: string | null;
        toStoreId: string | null;
        quoteRequestId: string | null;
        quoteId: string | null;
        stage: string | null;
        total: import("@prisma/client/runtime/library").Decimal | null;
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}>;
//# sourceMappingURL=order.service.d.ts.map