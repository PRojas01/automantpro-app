import type { ScheduleVehicleInput } from "../schemas/maintenance.schema.js";
export declare function generateSchedule(vehicleId: string, input: ScheduleVehicleInput): Promise<{
    id: string;
    createdAt: Date;
    vehicleId: string;
    task: string;
    intervalKm: number | null;
    dueDate: Date | null;
    lastDoneAt: Date | null;
} | null>;
export declare function generateDefaultPlan(vehicleId: string): Promise<{
    id: string;
    createdAt: Date;
    vehicleId: string;
    task: string;
    intervalKm: number | null;
    dueDate: Date | null;
    lastDoneAt: Date | null;
}[] | null>;
export declare function getAlerts(userId: string): Promise<({
    vehicle: {
        model: string;
        id: string;
        make: string;
        year: number;
    };
} & {
    id: string;
    createdAt: Date;
    vehicleId: string;
    label: string;
    dueKm: number | null;
    dueAt: Date | null;
    triggeredAt: Date | null;
})[]>;
//# sourceMappingURL=maintenance.service.d.ts.map