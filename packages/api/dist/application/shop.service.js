import { prisma } from "../infrastructure/prisma.js";
export async function list(filters) {
    const where = {};
    if (filters.city)
        where.city = { contains: filters.city, mode: "insensitive" };
    if (filters.verified !== undefined) {
        where.verificationStatus = filters.verified ? "verified" : "pending";
    }
    if (filters.specialty) {
        where.specialties = { path: [], array_contains: filters.specialty };
    }
    const [total, shops] = await Promise.all([
        prisma.shop.count({ where }),
        prisma.shop.findMany({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
            orderBy: { ratingAvg: "desc" },
            select: {
                id: true,
                name: true,
                address: true,
                city: true,
                specialties: true,
                verificationStatus: true,
                ratingAvg: true,
            },
        }),
    ]);
    return { data: shops, meta: { page: filters.page, limit: filters.limit, total } };
}
export async function findById(id) {
    return prisma.shop.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            address: true,
            city: true,
            lat: true,
            lng: true,
            specialties: true,
            verificationStatus: true,
            ratingAvg: true,
        },
    });
}
export async function getAvailability(shopId, date) {
    const where = { shopId };
    if (date) {
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);
        where.scheduledAt = { gte: start, lt: end };
    }
    const appointments = await prisma.appointment.findMany({
        where,
        select: { scheduledAt: true, status: true },
        orderBy: { scheduledAt: "asc" },
    });
    return appointments;
}
export async function findByUserId(userId) {
    return prisma.shop.findUnique({ where: { userId } });
}
//# sourceMappingURL=shop.service.js.map