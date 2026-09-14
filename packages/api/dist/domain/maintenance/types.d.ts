export type UsageProfile = "urbano" | "carretera" | "severo";
export type PlanItemStatus = "vencido" | "proximo" | "al_dia";
export type Priority = "alta" | "media" | "baja";
export type DateInput = Date | string;
export interface PlanVehicle {
    classId: string;
    fuelId: string;
}
export interface OdometerReading {
    km: number;
    date: DateInput;
}
export interface LastService {
    serviceId: string;
    km?: number;
    date?: DateInput;
}
export interface PlanItem {
    categoryId: string;
    categoryName: string;
    serviceId: string;
    serviceName: string;
    dueKm: number;
    dueDate: Date;
    status: PlanItemStatus;
    priority: Priority;
    costRefUsd: number;
    durationMin: number;
    remainingKm: number;
    remainingDays: number;
    reason: string;
}
export interface MaintenancePlan {
    generatedAt: Date;
    vehicle: PlanVehicle;
    odometerKm: number;
    kmPerDay: number;
    lastReadingDaysAgo: number | null;
    usageProfile: UsageProfile;
    items: PlanItem[];
}
export interface BuildPlanInput {
    vehicle: PlanVehicle;
    odometerKm: number;
    odometerReadings?: OdometerReading[];
    lastServices?: LastService[];
    usageProfile?: UsageProfile;
    today?: DateInput;
}
//# sourceMappingURL=types.d.ts.map