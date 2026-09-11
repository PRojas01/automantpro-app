import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["dueno", "taller", "almacen"]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    role: "dueno" | "taller" | "almacen";
    password: string;
    email?: string | undefined;
}, {
    name: string;
    phone: string;
    role: "dueno" | "taller" | "almacen";
    password: string;
    email?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    phone: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    password: string;
}, {
    phone: string;
    password: string;
}>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
//# sourceMappingURL=auth.schema.d.ts.map