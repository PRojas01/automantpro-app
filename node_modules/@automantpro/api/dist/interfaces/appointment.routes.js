import * as appointmentService from "../application/appointment.service.js";
import { createAppointmentSchema, updateAppointmentSchema, appointmentFilterSchema } from "../schemas/appointment.schema.js";
import { authenticate, requireRole } from "../middleware/auth.js";
export default async function appointmentRoutes(app) {
    app.addHook("preHandler", authenticate);
    app.post("/appointments", {
        preHandler: [requireRole("dueno")],
        handler: async (request, reply) => {
            const parsed = createAppointmentSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const appointment = await appointmentService.create(request.userId, parsed.data);
            if (!appointment) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Vehicle or shop not found" },
                });
            }
            return reply.code(201).send({ data: appointment, error: null });
        },
    });
    app.patch("/appointments/:id", {
        preHandler: [requireRole("dueno", "taller")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const parsed = updateAppointmentSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const appointment = await appointmentService.update(id, request.userId, request.userRole, parsed.data);
            if (!appointment) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Appointment not found or unauthorized" },
                });
            }
            return reply.send({ data: appointment, error: null });
        },
    });
    app.get("/appointments", {
        preHandler: [requireRole("dueno", "taller")],
        handler: async (request, reply) => {
            const parsed = appointmentFilterSchema.safeParse(request.query);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid query", details: parsed.error.issues },
                });
            }
            const result = await appointmentService.list(request.userId, request.userRole, parsed.data);
            return reply.send({ ...result, error: null });
        },
    });
}
//# sourceMappingURL=appointment.routes.js.map