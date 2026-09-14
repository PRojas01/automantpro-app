export declare const WHATSAPP_NUMBER_KEY = "whatsapp.publicNumber";
/**
 * Acepta lo que un operador suele escribir en Ecuador — "099 123 4567", "+593 99 123 4567",
 * "991234567", "00593991234567" — y devuelve los dígitos internacionales, o null si no es válido.
 */
export declare function normalizeWhatsappNumber(input: unknown): string | null;
/** 593991234567 → +593 99 123 4567 (solo para mostrar). */
export declare function formatWhatsappNumber(digits: string): string;
//# sourceMappingURL=whatsapp-number.d.ts.map