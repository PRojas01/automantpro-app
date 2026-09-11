import * as marketplaceService from "../application/marketplace.service.js";
import { marketplaceFilterSchema } from "../schemas/marketplace.schema.js";
export default async function marketplaceRoutes(app) {
    app.get("/marketplace/products", {
        handler: async (request, reply) => {
            const parsed = marketplaceFilterSchema.safeParse(request.query);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid query", details: parsed.error.issues },
                });
            }
            const result = await marketplaceService.search(parsed.data);
            return reply.send({ ...result, error: null });
        },
    });
}
//# sourceMappingURL=marketplace.routes.js.map