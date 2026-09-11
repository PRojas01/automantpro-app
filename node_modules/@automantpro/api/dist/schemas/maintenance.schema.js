import { z } from "zod";
export const scheduleVehicleSchema = z.object({
    task: z.string().min(1).max(200),
    intervalKm: z.number().int().min(100).max(100000).optional(),
    dueDate: z.string().datetime().optional(),
});
//# sourceMappingURL=maintenance.schema.js.map