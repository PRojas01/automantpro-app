export class AdapterError extends Error {
    kind;
    status;
    constructor(message, kind, status) {
        super(message);
        this.name = "AdapterError";
        this.kind = kind;
        this.status = status;
    }
}
//# sourceMappingURL=types.js.map