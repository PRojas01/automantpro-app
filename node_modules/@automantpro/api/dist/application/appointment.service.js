import { prisma } from "../infrastructure/prisma.js";
export async function create(ownerId, input) {
    const vehicle = await prisma.vehicle.findFirst({
        where: { id: input.vehicleId, userId: ownerId, deletedAt: null },
    });
    if (!vehicle)
        return null;
    const shop = await prisma.shop.findUnique({ where: { id: input.shopId } });
    if (!shop)
        return null;
    return prisma.appointment.create({
        data: {
            vehicleId: input.vehicleId,
            shopId: input.shopId,
            ownerId,
            scheduledAt: new Date(input.scheduledAt),
            summary: input.summary,
        },
        include: {
            vehicle: { select: { id: true, make: true, model: true } },
            shop: { select: { id: true, name: true } },
        },
    });
}
export async function update(appointmentId, userId, userRole, input) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
    });
    if (!appointment)
        return null;
    if (userRole === "dueno" && appointment.ownerId !== userId)
        return null;
    if (userRole === "taller") {
        const shop = await prisma.shop.findUnique({ where: { userId } });
        if (!shop || shop.id !== appointment.shopId)
            return null;
    }
    return prisma.appointment.update({
        where: { id: appointmentId },
        data: {
            ...(input.status !== undefined && { status: input.status }),
            ...(input.summary !== undefined && { summary: input.summary }),
        },
    });
}
export async function list(userId, userRole, filters) {
    const where = {};
    if (userRole === "dueno")
        where.ownerId = userId;
    else if (userRole === "taller") {
        const shop = await prisma.shop.findUnique({ where: { userId } });
        if (shop)
            where.shopId = shop.id;
        else
            return { data: [], meta: { page: filters.page, limit: filters.limit, total: 0 } };
    }
    if (filters.status)
        where.status = filters.status;
    const [total, appointments] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.findMany({
            where,
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
            orderBy: { scheduledAt: "desc" },
            include: {
                vehicle: { select: { id: true, make: true, model: true } },
                shop: { select: { id: true, name: true } },
            },
        }),
    ]);
    return { data: appointments, meta: { page: filters.page, limit: filters.limit, total } };
}
//# sourceMappingURL=appointment.service.js.map