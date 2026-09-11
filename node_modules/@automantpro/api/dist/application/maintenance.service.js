import { prisma } from "../infrastructure/prisma.js";
const DEFAULT_SCHEDULES = [
    { task: "Cambio de aceite", intervalKm: 10000 },
    { task: "Rotación de neumáticos", intervalKm: 15000 },
    { task: "Cambio de filtro de aire", intervalKm: 20000 },
    { task: "Revisión de frenos", intervalKm: 25000 },
    { task: "Cambio de bujías", intervalKm: 30000 },
    { task: "Cambio de correa de distribución", intervalKm: 80000 },
];
export async function generateSchedule(vehicleId, input) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle)
        return null;
    const schedule = await prisma.serviceSchedule.create({
        data: {
            vehicleId,
            task: input.task,
            intervalKm: input.intervalKm,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
    });
    return schedule;
}
export async function generateDefaultPlan(vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle)
        return null;
    const existing = await prisma.serviceSchedule.findMany({ where: { vehicleId } });
    if (existing.length > 0)
        return existing;
    const schedules = await Promise.all(DEFAULT_SCHEDULES.map((s) => prisma.serviceSchedule.create({
        data: {
            vehicleId,
            task: s.task,
            intervalKm: s.intervalKm,
        },
    })));
    return schedules;
}
export async function getAlerts(userId) {
    const vehicles = await prisma.vehicle.findMany({
        where: { userId, deletedAt: null },
        select: { id: true },
    });
    const vehicleIds = vehicles.map((v) => v.id);
    return prisma.alert.findMany({
        where: {
            vehicleId: { in: vehicleIds },
            triggeredAt: null,
        },
        include: {
            vehicle: { select: { id: true, make: true, model: true, year: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}
//# sourceMappingURL=maintenance.service.js.map