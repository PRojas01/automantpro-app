import type { Page } from "../../infrastructure/admin/admin-store.js";
import type { PartsOrderRow, QuoteRequestFilter, QuoteRequestRow, QuoteRow, StoreCandidate, UserQuotes } from "../../infrastructure/quotes/quote-store.js";
import type { Flash } from "./views-setup.js";
type Row = Record<string, unknown>;
export declare function quotesListView(input: {
    filter: QuoteRequestFilter;
    page: Page<QuoteRequestRow>;
    flash?: Flash;
}): string;
export declare function newQuoteView(input: {
    csrf: string;
    requester: Row;
    vehicle: Row | null;
    workOrderId: string | null;
    city: string;
    stores: StoreCandidate[];
    sameCity: boolean;
    values?: Row;
    error?: string;
}): string;
export declare function quoteDetailView(input: {
    request: QuoteRequestRow;
    quotes: QuoteRow[];
    order: PartsOrderRow | null;
    csrf: string;
    flash?: Flash;
}): string;
export declare function userQuotesSection(data: UserQuotes | null): string;
export {};
//# sourceMappingURL=views-quotes.d.ts.map