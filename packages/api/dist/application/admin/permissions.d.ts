export type StaffRole = "admin" | "operador" | "verificador" | "soporte" | "lectura";
export type Capability = "read" | "attend" | "registrations" | "verifications" | "appointments" | "workorders" | "quotes" | "notes" | "relations" | "disputes" | "sanctions" | "exports" | "lopdp" | "settings" | "team";
export declare const STAFF_ROLES: Array<{
    key: StaffRole;
    label: string;
    description: string;
}>;
/**
 * Normaliza lo guardado en la base. Sin valor (cuentas creadas antes de los roles) es
 * administrador; un valor desconocido cae al rol más restringido.
 */
export declare function normalizeRole(value: string | null | undefined): StaffRole;
export declare function roleLabel(role: StaffRole): string;
export declare function capabilitiesOf(role: StaffRole): readonly Capability[];
export declare function can(role: StaffRole | null | undefined, capability: Capability): boolean;
/**
 * Permiso necesario para una petición del panel. `path` va sin el prefijo /admin y sin
 * parámetros. Devuelve null cuando la ruta no depende del rol.
 */
export declare function requiredCapability(method: string, path: string): Capability | null;
//# sourceMappingURL=permissions.d.ts.map