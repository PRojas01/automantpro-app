declare const SESSION_COOKIE = "amp_admin_session";
declare const SESSION_IDLE_MS: number;
declare const SESSION_ABSOLUTE_MS: number;
export type AdminSession = {
    id: string;
    userId: string;
    email: string;
    twoFactorVerified: boolean;
    csrfToken: string;
    createdAt: number;
    lastSeenAt: number;
};
type PendingSession = Omit<AdminSession, "twoFactorVerified"> & {
    twoFactorVerified: false;
};
export { SESSION_COOKIE, SESSION_IDLE_MS, SESSION_ABSOLUTE_MS };
export declare function getAdminSessionSecret(): string | null;
export declare function allowInsecureAdminCookies(): boolean;
export declare function createCsrfToken(): string;
export declare function createPendingSession(user: {
    id: string;
    email: string;
}): PendingSession;
export declare function consumePendingSession(id: string): PendingSession | null;
export declare function promoteSession(session: PendingSession): AdminSession;
export declare function getSession(id: string | undefined): AdminSession | null;
export declare function deleteSession(id: string | undefined): void;
export declare function resetAdminSecurityStateForTests(): void;
export declare function signSessionCookie(sessionId: string, secret: string): string;
export declare function verifySessionCookie(value: string | undefined, secret: string): string | null;
export declare function buildSessionSetCookie(value: string, maxAgeSeconds?: number): string;
export declare function buildSessionClearCookie(): string;
export declare function parseCookies(header: string | undefined): Record<string, string>;
export declare function verifyCsrf(session: Pick<AdminSession, "csrfToken">, token: unknown): boolean;
export declare function checkRateLimit(email: string, ip: string, now?: number): {
    allowed: boolean;
    retryAt?: number;
};
export declare function recordLoginAttempt(email: string, ip: string, ok: boolean, now?: number): void;
export declare function generateTotpSecret(bytes?: number): string;
export declare function totp(secret: string, timestampMs?: number): string;
export declare function verifyTotp(secret: string, code: string, timestampMs?: number): boolean;
export declare function hotp(key: Buffer, counter: number, digits?: number): string;
export declare function otpauthUri(email: string, secret: string, issuer?: string): string;
export declare function base32Encode(input: Buffer): string;
export declare function base32Decode(input: string): Buffer;
//# sourceMappingURL=security.d.ts.map