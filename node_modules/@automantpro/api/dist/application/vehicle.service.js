import { prisma } from "../infrastructure/prisma.js";
export async function listByUser(userId) {
    return prisma.vehicle.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
    });
}
export async function create(userId, input) {
    return prisma.vehicle.create({
        data: { userId, ...input },
    });
}
export async function update(userId, vehicleId, input) {
    const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle)
        return null;
    return prisma.vehicle.update({
        where: { id: vehicleId },
        data: input,
    });
}
export async function findByIdAndUser(vehicleId, userId) {
    return prisma.vehicle.findFirst({
        where: { id: vehicleId, userId, deletedAt: null },
    });
}
export async function getMaintenancePlan(vehicleId) {
    const schedules = await prisma.serviceSchedule.findMany({
        where: { vehicleId },
        orderBy: { createdAt: "desc" },
    });
    return schedules;
}
export async function getHistory(vehicleId) {
    const services = await prisma.service.findMany({
        where: { vehicleId },
        orderBy: { createdAt: "desc" },
        include: { shop: { select: { id: true, name: true } } },
    });
    return services;
}
//# sourceMappingURL=vehicle.service.js.map