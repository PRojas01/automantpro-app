import { z } from "zod";
export const createAppointmentSchema = z.object({
    vehicleId: z.string().uuid(),
    shopId: z.string().uuid(),
    scheduledAt: z.string().datetime(),
    summary: z.string().max(1000).optional(),
});
export const updateAppointmentSchema = z.object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
    summary: z.string().max(1000).optional(),
});
export const appointmentFilterSchema = z.object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
//# sourceMappingURL=appointment.schema.js.map