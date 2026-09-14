// Número público de WhatsApp: se guarda como dígitos en formato internacional sin "+"
// (por ejemplo 593991234567), que es lo que esperan wa.me y whatsapp://send.
export const WHATSAPP_NUMBER_KEY = "whatsapp.publicNumber";
/**
 * Acepta lo que un operador suele escribir en Ecuador — "099 123 4567", "+593 99 123 4567",
 * "991234567", "00593991234567" — y devuelve los dígitos internacionales, o null si no es válido.
 */
export function normalizeWhatsappNumber(input) {
    if (typeof input !== "string")
        return null;
    let digits = input.replace(/\D/g, "");
    if (digits.startsWith("00"))
        digits = digits.slice(2);
    if (digits.length === 10 && digits.startsWith("09"))
        digits = `593${digits.slice(1)}`;
    else if (digits.length === 9 && digits.startsWith("9"))
        digits = `593${digits}`;
    // Ecuador: los números de WhatsApp son celulares, 9 dígitos después de 593 empezando por 9.
    if (digits.startsWith("593"))
        return /^5939\d{8}$/.test(digits) ? digits : null;
    return digits.length >= 8 && digits.length <= 15 ? digits : null;
}
/** 593991234567 → +593 99 123 4567 (solo para mostrar). */
export function formatWhatsappNumber(digits) {
    if (digits.startsWith("593") && digits.length === 12) {
        return `+593 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return `+${digits}`;
}
//# sourceMappingURL=whatsapp-number.js.map