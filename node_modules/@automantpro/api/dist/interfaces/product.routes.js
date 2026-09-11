import * as productService from "../application/product.service.js";
import { createProductSchema, updateProductSchema, productFilterSchema } from "../schemas/product.schema.js";
import { authenticate, requireRole } from "../middleware/auth.js";
export default async function productRoutes(app) {
    app.get("/products", {
        handler: async (request, reply) => {
            const parsed = productFilterSchema.safeParse(request.query);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid query", details: parsed.error.issues },
                });
            }
            const result = await productService.list(parsed.data);
            return reply.send({ ...result, error: null });
        },
    });
    app.get("/products/:id", {
        handler: async (request, reply) => {
            const { id } = request.params;
            const product = await productService.findById(id);
            if (!product) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Product not found" },
                });
            }
            return reply.send({ data: product, error: null });
        },
    });
    app.post("/products", {
        preHandler: [authenticate, requireRole("almacen")],
        handler: async (request, reply) => {
            const parsed = createProductSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const product = await productService.create(request.userId, parsed.data);
            if (!product) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Store not found for this user" },
                });
            }
            return reply.code(201).send({ data: product, error: null });
        },
    });
    app.patch("/products/:id", {
        preHandler: [authenticate, requireRole("almacen")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const parsed = updateProductSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const product = await productService.update(request.userId, id, parsed.data);
            if (!product) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "Product not found or unauthorized" },
                });
            }
            return reply.send({ data: product, error: null });
        },
    });
}
//# sourceMappingURL=product.routes.js.map