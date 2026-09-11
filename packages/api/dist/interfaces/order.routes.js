import * as orderService from "../application/order.service.js";
import { createOrderSchema, updateOrderSchema, orderFilterSchema } from "../schemas/order.schema.js";
import { authenticate, requireRole } from "../middleware/auth.js";
export default async function orderRoutes(app) {
    app.addHook("preHandler", authenticate);
    app.post("/orders", {
        preHandler: [requireRole("dueno", "taller", "almacen")],
        handler: async (request, reply) => {
            const parsed = createOrderSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const order = await orderService.create(request.userId, parsed.data);
            if (!order) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Order must have a destination (toShopId for service, toStoreId for repuesto)" },
                });
            }
            return reply.code(201).send({ data: order, error: null });
        },
    });
    app.patch("/orders/:id", {
        preHandler: [requireRole("dueno", "taller", "almacen")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const parsed = updateOrderSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const order = await orderService.update(id, request.userId, request.userRole, parsed.data);
            if (!order) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Order not found or unauthorized" },
                });
            }
            return reply.send({ data: order, error: null });
        },
    });
    app.get("/orders", {
        preHandler: [requireRole("dueno", "taller", "almacen")],
        handler: async (request, reply) => {
            const parsed = orderFilterSchema.safeParse(request.query);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid query", details: parsed.error.issues },
                });
            }
            const result = await orderService.list(request.userId, request.userRole, parsed.data);
            return reply.send({ ...result, error: null });
        },
    });
}
//# sourceMappingURL=order.routes.js.map