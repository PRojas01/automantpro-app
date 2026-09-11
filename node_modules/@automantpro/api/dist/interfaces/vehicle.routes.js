import * as vehicleService from "../application/vehicle.service.js";
import { createVehicleSchema, updateVehicleSchema } from "../schemas/vehicle.schema.js";
import { authenticate, requireRole } from "../middleware/auth.js";
export default async function vehicleRoutes(app) {
    app.addHook("preHandler", authenticate);
    app.get("/vehicles", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const vehicles = await vehicleService.listByUser(request.userId);
            return reply.send({ data: vehicles, error: null });
        },
    });
    app.post("/vehicles", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const parsed = createVehicleSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const vehicle = await vehicleService.create(request.userId, parsed.data);
            return reply.code(201).send({ data: vehicle, error: null });
        },
    });
    app.patch("/vehicles/:id", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const parsed = updateVehicleSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const vehicle = await vehicleService.update(request.userId, id, parsed.data);
            if (!vehicle) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Vehicle not found" },
                });
            }
            return reply.send({ data: vehicle, error: null });
        },
    });
    app.get("/vehicles/:id/maintenance", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const vehicle = await vehicleService.findByIdAndUser(id, request.userId);
            if (!vehicle) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Vehicle not found" },
                });
            }
            const plan = await vehicleService.getMaintenancePlan(id);
            return reply.send({ data: plan, error: null });
        },
    });
    app.get("/vehicles/:id/history", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const vehicle = await vehicleService.findByIdAndUser(id, request.userId);
            if (!vehicle) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Vehicle not found" },
                });
            }
            const history = await vehicleService.getHistory(id);
            return reply.send({ data: history, error: null });
        },
    });
}
//# sourceMappingURL=vehicle.routes.js.map