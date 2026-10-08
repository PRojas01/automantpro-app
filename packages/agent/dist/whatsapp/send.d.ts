export interface WhatsAppConfig {
    token: string;
    phoneNumberId: string;
    webhookSecret: string;
}
export declare function verifyWebhookSignature(body: string | Buffer, signatureHeader: string | undefined): boolean;
export declare function sendWhatsAppMessage(to: string, text: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
export declare function generateWaMeLink(shopPhone: string, diagnosticSummary?: string): string;
export interface WebhookEntry {
    changes: Array<{
        value: {
            messages?: Array<{
                from: string;
                id: string;
                timestamp: string;
                type: string;
                text?: {
                    body: string;
                };
            }>;
        };
    }>;
}
export declare function parseWebhookBody(body: Record<string, unknown>): {
    messages: Array<{
        from: string;
        id: string;
        text: string;
    }>;
};
//# sourceMappingURL=send.d.ts.map