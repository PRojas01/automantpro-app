import { createHmac, randomBytes, timingSafeEqual, } from "node:crypto";
const SESSION_COOKIE = "amp_admin_session";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const sessions = new Map();
const pendingSessions = new Map();
const rateLimits = new Map();
export { SESSION_COOKIE, SESSION_IDLE_MS, SESSION_ABSOLUTE_MS };
export function getAdminSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET?.trim();
    return secret && secret.length >= 32 ? secret : null;
}
export function allowInsecureAdminCookies() {
    return process.env.NODE_ENV !== "production" && process.env.ADMIN_INSECURE_COOKIES === "1";
}
export function createCsrfToken() {
    return randomBytes(24).toString("base64url");
}
export function createPendingSession(user) {
    const now = Date.now();
    const session = {
        id: randomBytes(24).toString("base64url"),
        userId: user.id,
        email: user.email,
        twoFactorVerified: false,
        csrfToken: createCsrfToken(),
        createdAt: now,
        lastSeenAt: now,
    };
    pendingSessions.set(session.id, session);
    return session;
}
export function consumePendingSession(id) {
    const session = pendingSessions.get(id);
    if (!session || isExpired(session)) {
        pendingSessions.delete(id);
        return null;
    }
    pendingSessions.delete(id);
    return session;
}
export function promoteSession(session) {
    const active = {
        ...session,
        twoFactorVerified: true,
        csrfToken: createCsrfToken(),
        lastSeenAt: Date.now(),
    };
    sessions.set(active.id, active);
    return active;
}
export function getSession(id) {
    if (!id)
        return null;
    const session = sessions.get(id);
    if (!session || isExpired(session)) {
        if (session)
            sessions.delete(id);
        return null;
    }
    session.lastSeenAt = Date.now();
    return session;
}
export function deleteSession(id) {
    if (!id)
        return;
    sessions.delete(id);
    pendingSessions.delete(id);
}
export function resetAdminSecurityStateForTests() {
    sessions.clear();
    pendingSessions.clear();
    rateLimits.clear();
}
function isExpired(session) {
    const now = Date.now();
    return now - session.lastSeenAt > SESSION_IDLE_MS || now - session.createdAt > SESSION_ABSOLUTE_MS;
}
export function signSessionCookie(sessionId, secret) {
    const signature = createHmac("sha256", secret).update(sessionId).digest("base64url");
    return `${sessionId}.${signature}`;
}
export function verifySessionCookie(value, secret) {
    if (!value)
        return null;
    const [sessionId, signature, extra] = value.split(".");
    if (!sessionId || !signature || extra !== undefined)
        return null;
    const expected = createHmac("sha256", secret).update(sessionId).digest("base64url");
    return safeEqual(signature, expected) ? sessionId : null;
}
export function buildSessionSetCookie(value, maxAgeSeconds = 12 * 60 * 60) {
    const secure = allowInsecureAdminCookies() ? "" : " Secure;";
    return `${SESSION_COOKIE}=${value}; HttpOnly;${secure} SameSite=Strict; Path=/admin; Max-Age=${maxAgeSeconds}`;
}
export function buildSessionClearCookie() {
    const secure = allowInsecureAdminCookies() ? "" : " Secure;";
    return `${SESSION_COOKIE}=; HttpOnly;${secure} SameSite=Strict; Path=/admin; Max-Age=0`;
}
export function parseCookies(header) {
    const out = {};
    if (!header)
        return out;
    for (const part of header.split(";")) {
        const index = part.indexOf("=");
        if (index < 0)
            continue;
        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        if (key)
            out[key] = value;
    }
    return out;
}
export function verifyCsrf(session, token) {
    return typeof token === "string" && token.length > 0 && safeEqual(token, session.csrfToken);
}
export function checkRateLimit(email, ip, now = Date.now()) {
    const keys = rateLimitKeys(email, ip);
    let retryAt = 0;
    for (const key of keys) {
        const record = rateLimits.get(key);
        if (record && record.blockedUntil > now)
            retryAt = Math.max(retryAt, record.blockedUntil);
    }
    return retryAt > now ? { allowed: false, retryAt } : { allowed: true };
}
export function recordLoginAttempt(email, ip, ok, now = Date.now()) {
    for (const key of rateLimitKeys(email, ip)) {
        const record = getRateRecord(key, now);
        if (ok) {
            rateLimits.delete(key);
            continue;
        }
        record.count += 1;
        if (record.count >= 5) {
            record.blocks += 1;
            record.blockedUntil = now + Math.min(60, 2 ** (record.blocks - 1)) * 15 * 60 * 1000;
            record.count = 0;
            record.windowStart = now;
        }
        rateLimits.set(key, record);
    }
}
function getRateRecord(key, now) {
    const current = rateLimits.get(key);
    if (!current || now - current.windowStart > 15 * 60 * 1000) {
        return { count: 0, windowStart: now, blockedUntil: 0, blocks: current?.blocks ?? 0 };
    }
    return current;
}
function rateLimitKeys(email, ip) {
    return [`email:${email.toLowerCase()}`, `ip:${ip}`];
}
function safeEqual(a, b) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
}
export function generateTotpSecret(bytes = 20) {
    return base32Encode(randomBytes(bytes));
}
export function totp(secret, timestampMs = Date.now()) {
    return hotp(base32Decode(secret), Math.floor(timestampMs / 1000 / TOTP_STEP_SECONDS));
}
export function verifyTotp(secret, code, timestampMs = Date.now()) {
    if (!/^\d{6}$/.test(code))
        return false;
    const counter = Math.floor(timestampMs / 1000 / TOTP_STEP_SECONDS);
    const key = base32Decode(secret);
    for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
        if (safeEqual(hotp(key, counter + offset), code))
            return true;
    }
    return false;
}
export function hotp(key, counter, digits = TOTP_DIGITS) {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter >>> 0, 4);
    const digest = createHmac("sha1", key).update(counterBuffer).digest();
    // HMAC-SHA1 siempre produce 20 bytes: el respaldo `?? 0` solo satisface a TypeScript (noUncheckedIndexedAccess).
    const byteAt = (index) => digest[index] ?? 0;
    const offset = byteAt(digest.length - 1) & 0x0f;
    const binary = ((byteAt(offset) & 0x7f) << 24) |
        ((byteAt(offset + 1) & 0xff) << 16) |
        ((byteAt(offset + 2) & 0xff) << 8) |
        (byteAt(offset + 3) & 0xff);
    return String(binary % 10 ** digits).padStart(digits, "0");
}
export function otpauthUri(email, secret, issuer = "AutoMantPro") {
    const label = `${issuer}:${email}`;
    const params = new URLSearchParams({
        secret,
        issuer,
        algorithm: "SHA1",
        digits: String(TOTP_DIGITS),
        period: String(TOTP_STEP_SECONDS),
    });
    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}
export function base32Encode(input) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let output = "";
    for (const byte of input) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0)
        output += alphabet[(value << (5 - bits)) & 31];
    return output;
}
export function base32Decode(input) {
    const clean = input.toUpperCase().replace(/[\s=]/g, "");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    const output = [];
    for (const char of clean) {
        const index = alphabet.indexOf(char);
        if (index < 0)
            throw new Error("Invalid base32 secret");
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(output);
}
//# sourceMappingURL=security.js.map