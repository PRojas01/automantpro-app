import { prisma } from "../infrastructure/prisma.js";
export async function list(filters) {
    const where = {};
    if (filters.storeId)
        where.storeId = filters.storeId;
    if (filters.q)
        where.name = { contains: filters.q, mode: "insensitive" };
    if (filters.vehicleId) {
        where.compat = { some: { vehicleId: filters.vehicleId } };
    }
    const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
            orderBy: { createdAt: "desc" },
            include: {
                store: { select: { id: true, name: true, city: true } },
                compat: { select: { vehicleId: true } },
            },
        }),
    ]);
    return { data: products, meta: { page: filters.page, limit: filters.limit, total } };
}
export async function findById(id) {
    return prisma.product.findUnique({
        where: { id },
        include: {
            store: { select: { id: true, name: true, city: true } },
            compat: {
                include: { vehicle: { select: { id: true, make: true, model: true, year: true } } },
            },
        },
    });
}
export async function create(userId, input) {
    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store)
        return null;
    const { vehicleIds, ...productData } = input;
    const product = await prisma.product.create({
        data: {
            storeId: store.id,
            ...productData,
            price: productData.price,
            ...(vehicleIds && vehicleIds.length > 0
                ? {
                    compat: {
                        create: vehicleIds.map((vehicleId) => ({ vehicleId })),
                    },
                }
                : {}),
        },
        include: {
            compat: { select: { vehicleId: true } },
        },
    });
    return product;
}
export async function update(userId, productId, input) {
    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store)
        return null;
    const existing = await prisma.product.findFirst({
        where: { id: productId, storeId: store.id },
    });
    if (!existing)
        return null;
    const { vehicleIds, ...productData } = input;
    const data = { ...productData };
    const product = await prisma.$transaction(async (tx) => {
        if (vehicleIds !== undefined) {
            await tx.productVehicle.deleteMany({ where: { productId } });
            if (vehicleIds.length > 0) {
                await tx.productVehicle.createMany({
                    data: vehicleIds.map((vehicleId) => ({ productId, vehicleId })),
                });
            }
        }
        return tx.product.update({
            where: { id: productId },
            data,
            include: {
                compat: { select: { vehicleId: true } },
            },
        });
    });
    return product;
}
//# sourceMappingURL=product.service.js.map