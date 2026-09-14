export interface EntryPageInput {
    number: string | null;
    code: string;
    ref: string | null;
    nonce: string;
}
export declare function escapeHtml(value: string): string;
export declare function buildLinks(number: string, code: string, ref: string | null): {
    text: string;
    app: string;
    wame: string;
    web: string;
};
export declare function renderEntryPage(input: EntryPageInput): string;
//# sourceMappingURL=page.d.ts.map