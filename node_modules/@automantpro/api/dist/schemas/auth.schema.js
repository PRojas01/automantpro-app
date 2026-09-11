import { z } from "zod";
export const registerSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().min(8).max(20),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(120),
    role: z.enum(["dueno", "taller", "almacen"]),
});
export const loginSchema = z.object({
    phone: z.string().min(8).max(20),
    password: z.string().min(1),
});
export const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});
//# sourceMappingURL=auth.schema.js.map