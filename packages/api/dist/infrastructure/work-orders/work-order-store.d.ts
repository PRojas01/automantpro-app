import type { SqlConnection } from "../schema-setup/apply.js";
import type { Page } from "../admin/admin-store.js";
export type WorkOrderFilter = "abiertas" | "por_aprobar" | "en_taller" | "cerradas" | "todas";
export interface WorkOrderRow {
    id: string;
    number: number;
    status: string;
    shopId: string;
    shopName: string;
    shopUserId: string;
    shopPhone: string;
    ownerId: string;
    ownerName: string;
    ownerPhone: string;
    vehicleId: string;
    vehicleLabel: string;
    plate: string | null;
    vehicleKm: number;
    appointmentId: string | null;
    intakeKm: number | null;
    intakeNotes: string | null;
    diagnosis: string | null;
    rejectionReason: string | null;
    cancelReason: string | null;
    exitKm: number | null;
    warrantyDays: number | null;
    nextService: string | null;
    diagnosisOutcome: string | null;
    outcomeNote: string | null;
    total: number;
    createdAt: Date | string;
    closedAt: Date | string | null;
}
export interface WorkOrderItemRow {
    id: string;
    kind: string;
    description: string;
    brand: string | null;
    partCode: string | null;
    quantity: number;
    unitPrice: number;
}
export interface ServiceHistoryRow {
    createdAt: Date | string;
    shopName: string;
    vehicleLabel: string;
    description: string;
    cost: number | null;
}
export interface NewWorkOrder {
    shopId: string;
    ownerId: string;
    vehicleId: string;
    appointmentId: string | null;
    intakeKm: number | null;
    intakeNotes: string | null;
    diagnosis: string | null;
}
export interface NewWorkOrderItem {
    kind: string;
    description: string;
    brand: string | null;
    partCode: string | null;
    quantity: number;
    unitPrice: number;
}
export interface StatusFields {
    rejectionReason?: string | null;
    cancelReason?: string | null;
}
export interface CloseWorkOrder {
    exitKm: number;
    warrantyDays: number;
    nextService: string | null;
    diagnosisOutcome: string;
    outcomeNote: string | null;
    historyDescription: string;
}
export interface WorkOrderStore {
    create(input: NewWorkOrder): Promise<string>;
    get(id: string): Promise<{
        order: WorkOrderRow;
        items: WorkOrderItemRow[];
    } | null>;
    list(filter: WorkOrderFilter, page: number): Promise<Page<WorkOrderRow>>;
    /** Órdenes donde el usuario es el dueño o el titular del taller. */
    listForUser(userId: string): Promise<WorkOrderRow[]>;
    findByAppointment(appointmentId: string): Promise<string | null>;
    addItem(workOrderId: string, item: NewWorkOrderItem): Promise<void>;
    removeItem(workOrderId: string, itemId: string): Promise<void>;
    updateDiagnosis(id: string, diagnosis: string | null): Promise<void>;
    /** Cambia el estado solo si la orden sigue en el estado esperado. */
    setStatus(id: string, expected: string, next: string, fields?: StatusFields): Promise<boolean>;
    /** Cierra la orden, la escribe en el historial, actualiza el kilometraje y completa el turno. */
    close(id: string, input: CloseWorkOrder): Promise<boolean>;
    historyForUser(userId: string): Promise<ServiceHistoryRow[]>;
}
export declare class MysqlWorkOrderStore implements WorkOrderStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    private transaction;
    create(input: NewWorkOrder): Promise<string>;
    get(id: string): Promise<{
        order: WorkOrderRow;
        items: WorkOrderItemRow[];
    } | null>;
    list(filter: WorkOrderFilter, page: number): Promise<Page<WorkOrderRow>>;
    listForUser(userId: string): Promise<WorkOrderRow[]>;
    findByAppointment(appointmentId: string): Promise<string | null>;
    addItem(workOrderId: string, item: NewWorkOrderItem): Promise<void>;
    removeItem(workOrderId: string, itemId: string): Promise<void>;
    updateDiagnosis(id: string, diagnosis: string | null): Promise<void>;
    setStatus(id: string, expected: string, next: string, fields?: StatusFields): Promise<boolean>;
    close(id: string, input: CloseWorkOrder): Promise<boolean>;
    historyForUser(userId: string): Promise<ServiceHistoryRow[]>;
}
//# sourceMappingURL=work-order-store.d.ts.map