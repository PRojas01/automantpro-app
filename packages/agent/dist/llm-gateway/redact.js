const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?<!\d)(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{2,4}\)\s?)?\d{2,4}[-.\s]?\d{3}[-.\s]?\d{3,4}(?!\d)/g;
const SENSITIVE_KEYS = /^(phone|telefono|c(el|)ular|email|e-mail|correo|correo_e|ruc|nombre|name|ssn|c(redit)?_?card|card_number)$/i;
const EMAIL_MASK = "[correo:REDACTED]";
const PHONE_MASK = "[telefono:REDACTED]";
const SENSITIVE_MASK = "[dato:REDACTED]";
export function redactPii(text) {
    return text.replace(EMAIL_RE, EMAIL_MASK).replace(PHONE_RE, PHONE_MASK);
}
function redactValue(value, key) {
    if (typeof value === "string") {
        if (SENSITIVE_KEYS.test(key))
            return SENSITIVE_MASK;
        return redactPii(value);
    }
    if (Array.isArray(value))
        return value.map((item, i) => redactValue(item, key));
    if (value !== null && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = redactValue(v, k);
        }
        return out;
    }
    return value;
}
export function redactJsonArgs(value) {
    const redacted = redactValue(value, "");
    try {
        return JSON.stringify(redacted);
    }
    catch {
        return JSON.stringify({ redacted: true });
    }
}
//# sourceMappingURL=redact.js.map