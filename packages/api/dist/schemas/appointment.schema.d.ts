import { z } from "zod";
export declare const createAppointmentSchema: z.ZodObject<{
    vehicleId: z.ZodString;
    shopId: z.ZodString;
    scheduledAt: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    vehicleId: string;
    shopId: string;
    scheduledAt: string;
    summary?: string | undefined;
}, {
    vehicleId: string;
    shopId: string;
    scheduledAt: string;
    summary?: string | undefined;
}>;
export declare const updateAppointmentSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "confirmed", "completed", "cancelled"]>>;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "confirmed" | "completed" | "cancelled" | undefined;
    summary?: string | undefined;
}, {
    status?: "pending" | "confirmed" | "completed" | "cancelled" | undefined;
    summary?: string | undefined;
}>;
export declare const appointmentFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "confirmed", "completed", "cancelled"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "pending" | "confirmed" | "completed" | "cancelled" | undefined;
}, {
    status?: "pending" | "confirmed" | "completed" | "cancelled" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
//# sourceMappingURL=appointment.schema.d.ts.map