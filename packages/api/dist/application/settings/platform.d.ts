import type { SettingsStore } from "../../infrastructure/settings/settings-store.js";
export declare const PLATFORM_KEYS: {
    readonly cities: "platform.cities";
    readonly quietFrom: "platform.quietFrom";
    readonly quietTo: "platform.quietTo";
    readonly welcomeIntro: "platform.welcomeIntro";
    readonly features: "platform.features";
    readonly entryMode: "platform.entryMode";
};
export type FeatureKey = "appointments" | "workorders" | "quotes";
export declare const FEATURES: Array<{
    key: FeatureKey;
    label: string;
    pausedText: string;
}>;
export type EntryMode = "directo" | "menu";
export interface PlatformSettings {
    /** Cómo abre automantpro.app: con el menú de perfiles (por defecto) o directo al chat. */
    entryMode: EntryMode;
    /** Ciudades donde se opera; vacío significa «todas». */
    cities: string[];
    quietFrom: string | null;
    quietTo: string | null;
    welcomeIntro: string | null;
    features: Record<FeatureKey, boolean>;
}
export declare function emptyPlatformSettings(): PlatformSettings;
export declare function parseEntryMode(input: unknown): EntryMode;
export declare function parseCities(input: unknown): string[];
export declare function parseTime(input: unknown): string | null;
/** Con la lista vacía se acepta cualquier ciudad; con lista, solo las configuradas. */
export declare function cityAllowed(city: string, cities: string[]): boolean;
/** Hora local de Ecuador en formato HH:MM. */
export declare function localTime(now?: Date): string;
/**
 * Horario silencioso: no se envían mensajes. Admite rangos que cruzan la medianoche
 * (por ejemplo 21:00 → 07:00).
 */
export declare function inQuietHours(settings: PlatformSettings, now?: Date): boolean;
export declare function quietNotice(settings: PlatformSettings, now?: Date): string | null;
export declare function loadPlatformSettings(settings: SettingsStore): Promise<PlatformSettings>;
export declare function savePlatformSettings(settings: SettingsStore, values: {
    entryMode: EntryMode;
    cities: string[];
    quietFrom: string | null;
    quietTo: string | null;
    welcomeIntro: string | null;
    features: Record<FeatureKey, boolean>;
}, updatedBy: string | null): Promise<void>;
/** Texto del interruptor apagado, para responder con un mensaje claro al operador. */
export declare function featurePaused(settings: PlatformSettings, key: FeatureKey): string | null;
//# sourceMappingURL=platform.d.ts.map