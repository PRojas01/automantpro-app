export interface VehicleInfo {
    brand?: string;
    model?: string;
    year?: number;
    mileage?: number;
    plate?: string;
    userId?: string;
}
export interface SymptomInfo {
    description: string;
    severity?: "low" | "medium" | "high" | "critical";
    location?: string;
}
export interface DiagnosisResult {
    vehicleId?: string;
    symptoms: string[];
    possibleCauses: DiagnosisCause[];
    recommendations: string[];
    urgency: "low" | "medium" | "high" | "critical";
}
export interface DiagnosisCause {
    component: string;
    probability: number;
    description: string;
}
export interface MaintenancePlanItem {
    service: string;
    intervalKm: number;
    intervalMonths: number;
    priority: "low" | "medium" | "high";
    estimatedCost?: string;
}
export interface Alert {
    id: string;
    vehicleId: string;
    type: "maintenance" | "recall" | "inspection";
    message: string;
    dueDate?: string;
    dueKm?: number;
    urgency: "low" | "medium" | "high";
}
export interface Shop {
    id: string;
    name: string;
    address: string;
    specialty: string;
    phone: string;
    city: string;
    latitude?: number;
    longitude?: number;
}
export interface AppointmentRequest {
    vehicleId?: string;
    shopId: string;
    service: string;
    preferredDate?: string;
    preferredTime?: string;
}
export interface PartQuote {
    partName: string;
    brand?: string;
    price: number;
    currency: string;
    availability: "in_stock" | "order" | "unavailable";
    shopId?: string;
}
export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
export interface ChatSession {
    id: string;
    phoneNumber: string;
    messages: ChatMessage[];
    vehicleInfo?: VehicleInfo;
    createdAt: Date;
    updatedAt: Date;
}
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    requiresConfirmation?: boolean;
}
export interface ToolResult {
    toolName: string;
    success: boolean;
    data: unknown;
    error?: string;
}
export interface AgentResponse {
    message: string;
    toolCalls?: ToolCall[];
}
export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}
export interface LLMMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
    name?: string;
    tool_calls?: LLMToolCall[];
}
export interface LLMToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}
export interface LLMResponse {
    content: string | null;
    tool_calls?: LLMToolCall[];
}
export interface LLMProvider {
    chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse>;
}
//# sourceMappingURL=types.d.ts.map