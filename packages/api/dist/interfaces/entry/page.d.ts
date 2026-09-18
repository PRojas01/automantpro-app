export interface EntryPageInput {
    number: string | null;
    code: string;
    ref: string | null;
    nonce: string;
    /** Muestra el menú de perfiles en lugar de un solo botón (Ajustes → Operación). */
    menu?: boolean;
}
/**
 * Opciones del menú de inicio. Cada una abre el chat con la intención escrita, para que la
 * conversación arranque sin preguntar el perfil (docs/41).
 */
export declare const ENTRY_PROFILES: Array<{
    key: string;
    label: string;
    emoji: string;
    intent: string | null;
}>;
export declare function sanitizeProfile(value: unknown): string | null;
export declare function escapeHtml(value: string): string;
export declare function buildLinks(number: string, code: string, ref: string | null, profile?: string | null): {
    text: string;
    app: string;
    wame: string;
    web: string;
};
export declare function renderEntryPage(input: EntryPageInput): string;
//# sourceMappingURL=page.d.ts.map