export async function authenticate(request, reply) {
    try {
        const decoded = await request.jwtVerify();
        request.userId = decoded.sub;
        request.userRole = decoded.role;
    }
    catch {
        reply.code(401).send({ data: null, error: { code: "UNAUTHORIZED", message: "Invalid or missing token" } });
    }
}
export function requireRole(...roles) {
    return async function roleGuard(request, reply) {
        if (!roles.includes(request.userRole)) {
            reply.code(403).send({
                data: null,
                error: { code: "FORBIDDEN", message: `Requires role: ${roles.join(" | ")}` },
            });
        }
    };
}
export async function registerAuth(app) {
    app.decorate("authenticate", authenticate);
    app.decorate("requireRole", requireRole);
}
//# sourceMappingURL=auth.js.map