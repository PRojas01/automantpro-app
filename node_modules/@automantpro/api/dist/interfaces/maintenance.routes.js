import * as maintenanceService from "../application/maintenance.service.js";
import { scheduleVehicleSchema } from "../schemas/maintenance.schema.js";
import { authenticate, requireRole } from "../middleware/auth.js";
export default async function maintenanceRoutes(app) {
    app.addHook("preHandler", authenticate);
    app.post("/vehicles/:id/schedule", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const parsed = scheduleVehicleSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const schedule = await maintenanceService.generateSchedule(id, parsed.data);
            if (!schedule) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Vehicle not found" },
                });
            }
            return reply.code(201).send({ data: schedule, error: null });
        },
    });
    app.get("/alerts", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const alerts = await maintenanceService.getAlerts(request.userId);
            return reply.send({ data: alerts, error: null });
        },
    });
}
//# sourceMappingURL=maintenance.routes.js.map