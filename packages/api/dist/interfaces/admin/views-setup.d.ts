export type Flash = {
    kind: "ok" | "error";
    text: string;
};
export interface TotpEnrollment {
    secret: string;
    uri: string;
    /** SVG generado por la librería qrcode a partir de la URI (sin texto del usuario). */
    qrSvg: string;
}
export type SetupViewInput = {
    kind: "no-db";
} | {
    kind: "db-error";
    code?: string;
} | {
    kind: "wizard";
    csrf: string;
    present: number;
    total: number;
    flash?: Flash;
    pending?: TotpEnrollment & {
        email: string;
    };
};
export declare function setupView(input: SetupViewInput): string;
export declare function accountView(input: {
    csrf: string;
    name: string;
    email: string;
    flash?: Flash;
    totp?: TotpEnrollment;
}): string;
//# sourceMappingURL=views-setup.d.ts.map