import { prisma } from "../infrastructure/prisma.js";
export async function search(filters) {
    const where = {};
    if (filters.q)
        where.name = { contains: filters.q, mode: "insensitive" };
    if (filters.vehicleMake || filters.vehicleModel || filters.year) {
        const vehicleWhere = {};
        if (filters.vehicleMake)
            vehicleWhere.make = { contains: filters.vehicleMake, mode: "insensitive" };
        if (filters.vehicleModel)
            vehicleWhere.model = { contains: filters.vehicleModel, mode: "insensitive" };
        if (filters.year)
            vehicleWhere.year = filters.year;
        where.compat = {
            some: {
                vehicle: vehicleWhere,
            },
        };
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
                compat: {
                    include: {
                        vehicle: { select: { id: true, make: true, model: true, year: true } },
                    },
                },
            },
        }),
    ]);
    return { data: products, meta: { page: filters.page, limit: filters.limit, total } };
}
//# sourceMappingURL=marketplace.service.js.map