import { z } from "zod";
import { comparePassword, hashPassword } from "../../infrastructure/password.js";
import { checkRateLimit, recordLoginAttempt, revokeSessionsForUser, verifyCsrf, } from "../../application/admin/security.js";
import { normalizeRole, roleLabel } from "../../application/admin/permissions.js";
import { teamView } from "./views-team.js";
const memberInput = z
    .object({
    email: z.string().trim().toLowerCase().email("Correo no válido").max(191, "Correo demasiado largo"),
    name: z
        .string()
        .trim()
        .min(3, "El nombre debe tener entre 3 y 60 caracteres")
        .max(60, "El nombre debe tener entre 3 y 60 caracteres"),
    staffRole: z.enum(["admin", "operador", "verificador", "soporte", "lectura"]),
    password: z.string().min(12, "La contraseña temporal debe tener al menos 12 caracteres").max(200),
    confirm: z.string(),
})
    .refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden" });
const roleInput = z.object({ staffRole: z.enum(["admin", "operador", "verificador", "soporte", "lectura"]) });
export function registerTeamRoutes(app, deps) {
    async function render(request, reply, session, flash, status = 200) {
        let members = null;
        try {
            members = await deps.staff.list();
        }
        catch {
            members = null;
        }
        return deps.html(reply, request, "Equipo", teamView({ csrf: session.csrfToken, members, selfId: session.userId, flash }), session, status);
    }
    function checkCsrf(request, reply) {
        const session = deps.requireSession(request, reply);
        if (!session)
            return null;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf)) {
            deps.html(reply, request, "Equipo", `<p class="error">Solicitud inválida: vuelve a abrir la página.</p>`, session, 403);
            return null;
        }
        return { session, body };
    }
    /** Confirma la contraseña de quien hace el cambio; devuelve null si ya se respondió. */
    async function confirmPassword(request, reply, session, body) {
        const account = await deps.store.findAdminById(session.userId);
        if (!account) {
            await render(request, reply, session, { kind: "error", text: "Cuenta no encontrada." }, 404);
            return null;
        }
        if (!checkRateLimit(account.email, request.ip).allowed) {
            await render(request, reply, session, { kind: "error", text: "Demasiados intentos. Espera unos minutos." }, 429);
            return null;
        }
        const ok = await comparePassword(typeof body.current === "string" ? body.current : "", account.passwordHash);
        if (!ok) {
            recordLoginAttempt(account.email, request.ip, false);
            await render(request, reply, session, { kind: "error", text: "La contraseña actual no es correcta." }, 400);
            return null;
        }
        return { id: account.id, email: account.email };
    }
    /**
     * Comprueba que el cambio no deje al panel sin administradores y que nadie se cambie a sí
     * mismo el rol o el acceso. Devuelve el mensaje de error, o null si el cambio es válido.
     */
    async function guard(session, memberId, nextRole, nextActive) {
        if (memberId === session.userId)
            return "No puedes cambiar tu propio rol ni tu propio acceso: pídele a otro administrador que lo haga.";
        const member = await deps.staff.find(memberId);
        if (!member)
            return "Esa cuenta no existe.";
        const wasAdmin = member.active && normalizeRole(member.staffRole) === "admin";
        const staysAdmin = nextActive === false ? false : nextRole === null ? wasAdmin : nextRole === "admin";
        if (wasAdmin && !staysAdmin && (await deps.staff.countActiveAdmins()) <= 1) {
            return "Es el último administrador activo: primero nombra a otro administrador.";
        }
        return null;
    }
    app.get("/team", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        return render(request, reply, session);
    });
    app.post("/team", async (request, reply) => {
        const ctx = checkCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const parsed = memberInput.safeParse(body);
        if (!parsed.success) {
            return render(request, reply, session, { kind: "error", text: parsed.error.issues[0]?.message ?? "Datos inválidos" }, 400);
        }
        const actor = await confirmPassword(request, reply, session, body);
        if (!actor)
            return reply;
        const { email, name, staffRole, password } = parsed.data;
        try {
            if (await deps.staff.emailTaken(email)) {
                return render(request, reply, session, { kind: "error", text: "Ya existe una cuenta con ese correo." }, 400);
            }
            const id = await deps.staff.create({
                email,
                name,
                passwordHash: await hashPassword(password),
                staffRole,
                phone: `admin:${email}`,
            });
            await deps.audit("admin.team.created", actor.id, `Alta de ${email} con rol ${staffRole}`);
            void id;
        }
        catch {
            return render(request, reply, session, { kind: "error", text: "No se pudo crear la cuenta (base de datos no disponible)." }, 503);
        }
        return render(request, reply, session, {
            kind: "ok",
            text: `Cuenta creada para ${email} con rol ${roleLabel(staffRole)}. Entrégale la contraseña temporal en persona: en su primer ingreso registrará su propio segundo factor y podrá cambiarla en «Mi cuenta».`,
        });
    });
    app.post("/team/:id/role", async (request, reply) => {
        const ctx = checkCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const memberId = String(request.params.id ?? "");
        const parsed = roleInput.safeParse(body);
        if (!parsed.success)
            return render(request, reply, session, { kind: "error", text: "Rol no válido." }, 400);
        const actor = await confirmPassword(request, reply, session, body);
        if (!actor)
            return reply;
        try {
            const problem = await guard(session, memberId, parsed.data.staffRole, null);
            if (problem)
                return render(request, reply, session, { kind: "error", text: problem }, 400);
            await deps.staff.setRole(memberId, parsed.data.staffRole);
        }
        catch {
            return render(request, reply, session, { kind: "error", text: "No se pudo guardar el rol (base de datos no disponible)." }, 503);
        }
        // El rol cambia de inmediato: se cierran sus sesiones abiertas.
        revokeSessionsForUser(memberId);
        await deps.audit("admin.team.role", actor.id, `Rol de la cuenta ${memberId} → ${parsed.data.staffRole}`);
        return render(request, reply, session, { kind: "ok", text: `Rol actualizado a ${roleLabel(parsed.data.staffRole)}. Deberá volver a ingresar.` });
    });
    app.post("/team/:id/state", async (request, reply) => {
        const ctx = checkCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const memberId = String(request.params.id ?? "");
        const active = body.active === "1";
        const actor = await confirmPassword(request, reply, session, body);
        if (!actor)
            return reply;
        try {
            const problem = await guard(session, memberId, null, active);
            if (problem)
                return render(request, reply, session, { kind: "error", text: problem }, 400);
            await deps.staff.setActive(memberId, active);
        }
        catch {
            return render(request, reply, session, { kind: "error", text: "No se pudo cambiar el acceso (base de datos no disponible)." }, 503);
        }
        if (!active)
            revokeSessionsForUser(memberId);
        await deps.audit("admin.team.state", actor.id, `Acceso de la cuenta ${memberId} → ${active ? "activo" : "suspendido"}`);
        return render(request, reply, session, {
            kind: "ok",
            text: active ? "Acceso reactivado." : "Acceso suspendido: sus sesiones abiertas se cerraron.",
        });
    });
}
//# sourceMappingURL=team.js.map