export class OpenAIProvider {
    apiKey;
    model;
    baseUrl;
    constructor(config) {
        this.apiKey = config?.apiKey ?? process.env.LLM_API_KEY ?? "";
        this.model = config?.model ?? "gpt-4o-mini";
        this.baseUrl = config?.baseUrl ?? "https://api.openai.com/v1";
    }
    async chat(messages, tools) {
        if (!this.apiKey) {
            throw new Error("LLM_API_KEY is required for OpenAI provider");
        }
        const body = {
            model: this.model,
            messages,
        };
        if (tools && tools.length > 0) {
            body.tools = tools.map((t) => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                },
            }));
        }
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`LLM API error ${response.status}: ${text}`);
        }
        const data = (await response.json());
        const choice = data.choices?.[0];
        if (!choice) {
            throw new Error("No response from LLM");
        }
        return {
            content: choice.message.content,
            tool_calls: choice.message.tool_calls?.map((tc) => ({
                id: tc.id,
                type: "function",
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                },
            })),
        };
    }
}
//# sourceMappingURL=openai.js.map