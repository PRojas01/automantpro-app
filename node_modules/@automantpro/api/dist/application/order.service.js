import { prisma } from "../infrastructure/prisma.js";
export async function create(fromUserId, input) {
    if (input.orderType === "repuesto" && !input.toStoreId) {
        return null;
    }
    if (input.orderType === "service" && !input.toShopId) {
        return null;
    }
    return prisma.order.create({
        data: {
            orderType: input.orderType,
            fromUserId,
            toShopId: input.toShopId,
            toStoreId: input.toStoreId,
            lines: {
                create: input.lines.map((l) => ({
                    productId: l.productId,
                    itemName: l.itemName,
                    qty: l.qty,
                    unitPrice: l.unitPrice,
                })),
            },
        },
        include: {
            lines: true,
        },
    });
}
export async function update(orderId, userId, userRole, input) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        return null;
    if (userRole === "taller" && order.toShopId) {
        const shop = await prisma.shop.findUnique({ where: { userId } });
        if (!shop || shop.id !== order.toShopId)
            return null;
    }
    else if (userRole === "almacen" && order.toStoreId) {
        const store = await prisma.store.findUnique({ where: { userId } });
        if (!store || store.id !== order.toStoreId)
            return null;
    }
    else if (userRole === "dueno" && order.fromUserId !== userId) {
        return null;
    }
    if (!input.status)
        return order;
    return prisma.order.update({
        where: { id: orderId },
        data: { status: input.status },
        include: { lines: true },
    });
}
export async function list(userId, userRole, filters) {
    const where = {};
    if (userRole === "dueno")
        where.fromUserId = userId;
    else if (userRole === "taller") {
        const shop = await prisma.shop.findUnique({ where: { userId } });
        if (shop)
            where.toShopId = shop.id;
        else
            return { data: [], meta: { page: filters.page, limit: filters.limit, total: 0 } };
    }
    else if (userRole === "almacen") {
        const store = await prisma.store.findUnique({ where: { userId } });
        if (store)
            where.toStoreId = store.id;
        else
            return { data: [], meta: { page: filters.page, limit: filters.limit, total: 0 } };
    }
    if (filters.orderType)
        where.orderType = filters.orderType;
    if (filters.status)
        where.status = filters.status;
    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
            orderBy: { createdAt: "desc" },
            include: { lines: true },
        }),
    ]);
    return { data: orders, meta: { page: filters.page, limit: filters.limit, total } };
}
//# sourceMappingURL=order.service.js.map