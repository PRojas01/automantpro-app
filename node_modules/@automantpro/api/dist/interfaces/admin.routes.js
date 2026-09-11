import * as adminService from "../application/admin.service.js";
import * as shopService from "../application/shop.service.js";
import { authenticate, requireRole } from "../middleware/auth.js";
export default async function adminRoutes(app) {
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireRole("admin"));
    app.get("/admin/shops", {
        handler: async (request, reply) => {
            const { page = "1", limit = "20" } = request.query;
            const result = await adminService.listPendingVerification(parseInt(page, 10), parseInt(limit, 10));
            return reply.send({ ...result, error: null });
        },
    });
    app.get("/admin/shops/:id/verify", {
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
    app.patch("/admin/shops/:id/verify", {
        handler: async (request, reply) => {
            const { id } = request.params;
            const { status } = request.body;
            if (status !== "verified" && status !== "rejected") {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Status must be 'verified' or 'rejected'" },
                });
            }
            const shop = await adminService.verifyShop(id, status);
            if (!shop) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Shop not found" },
                });
            }
            return reply.send({ data: shop, error: null });
        },
    });
}
//# sourceMappingURL=admin.routes.js.map