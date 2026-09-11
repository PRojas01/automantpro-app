import * as authService from "../application/auth.service.js";
import { registerSchema, loginSchema, refreshSchema } from "../schemas/auth.schema.js";
import { authenticate } from "../middleware/auth.js";
export default async function authRoutes(app) {
    app.post("/auth/register", {
        schema: {
            body: {
                type: "object",
                required: ["phone", "password", "name", "role"],
                properties: {
                    email: { type: "string", format: "email" },
                    phone: { type: "string", minLength: 8, maxLength: 20 },
                    password: { type: "string", minLength: 8, maxLength: 128 },
                    name: { type: "string", minLength: 1, maxLength: 120 },
                    role: { type: "string", enum: ["dueno", "taller", "almacen"] },
                },
            },
        },
        handler: async (request, reply) => {
            const parsed = registerSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const existing = await authService.findByPhone(parsed.data.phone);
            if (existing) {
                return reply.code(409).send({
                    data: null,
                    error: { code: "CONFLICT", message: "Phone number already registered" },
                });
            }
            const user = await authService.register(parsed.data);
            const accessToken = app.jwt.sign({ sub: user.id, role: user.role, email: user.email ?? undefined }, { expiresIn: process.env.JWT_ACCESS_EXPIRY ?? "15m" });
            const refreshToken = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: process.env.JWT_REFRESH_EXPIRY ?? "7d" });
            return reply.code(201).send({ data: { user, accessToken, refreshToken }, error: null });
        },
    });
    app.post("/auth/login", {
        schema: {
            body: {
                type: "object",
                required: ["phone", "password"],
                properties: {
                    phone: { type: "string" },
                    password: { type: "string" },
                },
            },
        },
        handler: async (request, reply) => {
            const parsed = loginSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            const user = await authService.validateCredentials(parsed.data);
            if (!user) {
                return reply.code(401).send({
                    data: null,
                    error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
                });
            }
            const accessToken = app.jwt.sign({ sub: user.id, role: user.role, email: user.email ?? undefined }, { expiresIn: process.env.JWT_ACCESS_EXPIRY ?? "15m" });
            const refreshToken = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: process.env.JWT_REFRESH_EXPIRY ?? "7d" });
            return reply.send({ data: { user: { id: user.id, name: user.name, role: user.role, email: user.email }, accessToken, refreshToken }, error: null });
        },
    });
    app.post("/auth/refresh", {
        schema: {
            body: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
            },
        },
        handler: async (request, reply) => {
            const parsed = refreshSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.code(422).send({
                    data: null,
                    error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
                });
            }
            try {
                const decoded = app.jwt.verify(parsed.data.refreshToken);
                const accessToken = app.jwt.sign({ sub: decoded.sub, role: decoded.role }, { expiresIn: process.env.JWT_ACCESS_EXPIRY ?? "15m" });
                const refreshToken = app.jwt.sign({ sub: decoded.sub, role: decoded.role }, { expiresIn: process.env.JWT_REFRESH_EXPIRY ?? "7d" });
                return reply.send({ data: { accessToken, refreshToken }, error: null });
            }
            catch {
                return reply.code(401).send({
                    data: null,
                    error: { code: "UNAUTHORIZED", message: "Invalid refresh token" },
                });
            }
        },
    });
    app.get("/auth/me", {
        preHandler: [authenticate],
        handler: async (request, reply) => {
            const user = await authService.findUserById(request.userId);
            if (!user) {
                return reply.code(404).send({
                    data: null,
                    error: { code: "NOT_FOUND", message: "User not found" },
                });
            }
            return reply.send({ data: user, error: null });
        },
    });
}
//# sourceMappingURL=auth.routes.js.map