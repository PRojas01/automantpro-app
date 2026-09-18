import type { StaffMember } from "../../infrastructure/staff/staff-store.js";
import type { Flash } from "./views-setup.js";
export declare function teamView(input: {
    csrf: string;
    members: StaffMember[] | null;
    selfId: string;
    flash?: Flash;
}): string;
/** Registro del segundo factor en el primer ingreso de un miembro nuevo. */
export declare function enrollView(input: {
    qrSvg: string;
    secret: string;
    error?: string;
}): string;
//# sourceMappingURL=views-team.d.ts.map