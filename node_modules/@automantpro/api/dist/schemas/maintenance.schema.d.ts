import { z } from "zod";
export declare const scheduleVehicleSchema: z.ZodObject<{
    task: z.ZodString;
    intervalKm: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    task: string;
    intervalKm?: number | undefined;
    dueDate?: string | undefined;
}, {
    task: string;
    intervalKm?: number | undefined;
    dueDate?: string | undefined;
}>;
export type ScheduleVehicleInput = z.infer<typeof scheduleVehicleSchema>;
//# sourceMappingURL=maintenance.schema.d.ts.map