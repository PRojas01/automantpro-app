import type { AppointmentRow, EventRow } from "../../infrastructure/appointments/appointment-store.js";
import type { UserDetail } from "../../infrastructure/registration/registration-store.js";
export interface PendingTask {
    text: string;
    /** true: se incluye en el mensaje al contacto; false: solo lo ve el operador. */
    forCustomer: boolean;
}
export interface ContactContext {
    detail: UserDetail | null;
    appointments: AppointmentRow[];
    events: EventRow[];
    now?: Date;
}
export declare const NEW_CONTACT_MESSAGE = "\u00A1Hola! \uD83D\uDC4B Bienvenido a AutoMantPro \uD83D\uDE97\nTu veh\u00EDculo, tu taller y tus repuestos, conectados en un solo chat.\n\n\u00BFQui\u00E9n eres?\n1) \uD83D\uDE97 Soy nuevo y tengo un veh\u00EDculo\n2) \uD83D\uDD27 Soy nuevo y tengo un taller\n3) \uD83D\uDCE6 Soy nuevo y tengo un almac\u00E9n de repuestos\n4) \uD83D\uDD11 Ya tengo cuenta (te escribo desde otro n\u00FAmero)\n\nResponde con el n\u00FAmero.";
export declare function pendingTasks(ctx: ContactContext): PendingTask[];
/** Mensaje de ingreso: bienvenida para un contacto nuevo; saludo, pendientes y menú para uno registrado. */
export declare function welcomeMessage(ctx: ContactContext): string;
/** Extrae el celular y el código de visita de un número o de un mensaje pegado por el operador. */
export declare function parseContactInput(input: string): {
    phone: string | null;
    code: string | null;
};
//# sourceMappingURL=welcome.d.ts.map