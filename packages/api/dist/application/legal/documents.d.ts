import type { SettingsStore } from "../../infrastructure/settings/settings-store.js";
export declare const LEGAL_VERSION = "2026-09";
export declare const LEGAL_EFFECTIVE_DATE = "15 de septiembre de 2026";
export declare const LEGAL_FIELDS: readonly [{
    readonly key: "razonSocial";
    readonly label: "Razón social";
    readonly placeholder: "Nombre legal de la empresa";
}, {
    readonly key: "ruc";
    readonly label: "RUC";
    readonly placeholder: "13 dígitos terminados en 001";
}, {
    readonly key: "domicilio";
    readonly label: "Domicilio";
    readonly placeholder: "Dirección y ciudad";
}, {
    readonly key: "representante";
    readonly label: "Representante legal";
    readonly placeholder: "Nombre y apellido";
}, {
    readonly key: "correo";
    readonly label: "Correo para temas legales y datos personales";
    readonly placeholder: "correo@dominio";
}];
export type LegalKey = (typeof LEGAL_FIELDS)[number]["key"];
export type LegalData = Record<LegalKey, string | null>;
export declare const legalSettingKey: (key: LegalKey) => string;
export declare function emptyLegalData(): LegalData;
export declare function isLegalComplete(data: LegalData): boolean;
/** Valida un campo; devuelve el mensaje de error o null. Los vacíos se aceptan (quitan el dato). */
export declare function validateLegalField(key: LegalKey, value: string): string | null;
export interface LegalSection {
    title: string;
    paragraphs?: string[];
    items?: string[];
}
export interface LegalLoader {
    get(): Promise<LegalData>;
    invalidate(): void;
}
/** Lee los datos legales de Ajustes con caché; si la base no responde, quedan como pendientes. */
export declare function createLegalLoader(settings: SettingsStore, ttlMs?: number): LegalLoader;
export declare function termsSections(data: LegalData): LegalSection[];
export declare function privacySections(data: LegalData): LegalSection[];
//# sourceMappingURL=documents.d.ts.map