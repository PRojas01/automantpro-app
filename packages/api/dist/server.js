import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
import authRoutes from "./interfaces/auth.routes.js";
import vehicleRoutes from "./interfaces/vehicle.routes.js";
import maintenanceRoutes from "./interfaces/maintenance.routes.js";
import shopRoutes from "./interfaces/shop.routes.js";
import appointmentRoutes from "./interfaces/appointment.routes.js";
import productRoutes from "./interfaces/product.routes.js";
import orderRoutes from "./interfaces/order.routes.js";
import marketplaceRoutes from "./interfaces/marketplace.routes.js";
import adminRoutes from "./interfaces/admin.routes.js";
import agentRoutes from "./interfaces/agent.routes.js";
import { registerWebhookRoutes as webhookRoutes } from "@automantpro/agent";
dotenv.config();
// GoDaddy (y otros contenedores) inyectan PORT y pueden definir HOST=127.0.0.1;
// la API debe escuchar siempre en todas las interfaces para ser alcanzable.
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.LISTEN_HOST || "0.0.0.0";
const app = Fastify({
    logger: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
});
await app.register(cors, {
    origin: process.env.NODE_ENV === "production" ? false : true,
});
const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET;
if (isProduction && (!jwtSecret || jwtSecret.length < 32 || jwtSecret === "dev-secret-change-in-production-min-32-chars")) {
    app.log.fatal("JWT_SECRET must be set to a strong secret of at least 32 chars in production");
    process.exit(1);
}
await app.register(jwt, {
    secret: jwtSecret ?? "dev-secret-change-in-production-min-32-chars",
    sign: { expiresIn: process.env.JWT_ACCESS_EXPIRY ?? "15m" },
});
const apiPrefix = "/api/v1";
await app.register(authRoutes, { prefix: apiPrefix });
await app.register(vehicleRoutes, { prefix: apiPrefix });
await app.register(maintenanceRoutes, { prefix: apiPrefix });
await app.register(shopRoutes, { prefix: apiPrefix });
await app.register(appointmentRoutes, { prefix: apiPrefix });
await app.register(productRoutes, { prefix: apiPrefix });
await app.register(orderRoutes, { prefix: apiPrefix });
await app.register(marketplaceRoutes, { prefix: apiPrefix });
await app.register(adminRoutes, { prefix: apiPrefix });
await app.register(agentRoutes, { prefix: apiPrefix });
await app.register(webhookRoutes, { prefix: "/webhook" });
app.get("/health", async () => ({ status: "ok" }));
// La plataforma (GoDaddy) revisa la salud con GET / y HEAD /; Fastify atiende HEAD automáticamente.
app.get("/", async () => ({ status: "ok", service: "AutoMantPro API" }));
app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const code = error.code;
    const message = error.message ?? "Unknown error";
    app.log.error({ err: error, path: request.url }, "Unhandled error");
    if (statusCode >= 500) {
        return reply.code(statusCode).send({
            data: null,
            error: {
                code: "INTERNAL_ERROR",
                message: process.env.NODE_ENV === "production" ? "Internal server error" : message,
            },
        });
    }
    return reply.code(statusCode).send({
        data: null,
        error: {
            code: code ?? "ERROR",
            message,
        },
    });
});
try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`AutoMantPro API running on http://${HOST}:${PORT}`);
}
catch (err) {
    app.log.error(err);
    process.exit(1);
}
//# sourceMappingURL=server.js.map