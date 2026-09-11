import * as shopService from "../application/shop.service.js";
import { shopFilterSchema } from "../schemas/shop.schema.js";
import { authenticate } from "../middleware/auth.js";
export default async function shopRoutes(app) {
    app.get("/shops", {
        handler: async (request, reply) => {
            const parsed = shopFilterSchema.safeParse(request.query);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid query", details: parsed.error.issues },
                });
            }
            const result = await shopService.list(parsed.data);
            return reply.send({ ...result, error: null });
        },
    });
    app.get("/shops/:id", {
        handler: async (request, reply) => {
            const { id } = request.params;
            const shop = await shopService.findById(id);
            if (!shop) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Shop not found" },
                });
            }
            return reply.send({ data: shop, error: null });
        },
    });
    app.get("/shops/:id/availability", {
        preHandler: [authenticate],
        handler: async (request, reply) => {
            const { id } = request.params;
            const { date } = request.query;
            const availability = await shopService.getAvailability(id, date);
            return reply.send({ data: availability, error: null });
        },
    });
}
//# sourceMappingURL=shop.routes.js.map