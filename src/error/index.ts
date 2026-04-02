class Exception extends Error {
    public readonly name: string;
    public readonly message: string;

    /**
     * @deprecated use statusCode
     */
    public readonly code: number;
    public readonly context?: any;
    public readonly statusCode?: number;

    constructor(name: string, code: number, message?: string, context?: any) {
        super();

        let contextIsMessage =
            ["string", "number"].includes(typeof context) && !message;

        this.name = name;
        this.code = code;
        this.statusCode = code;
        this.message =
            contextIsMessage && context ? context : message ? message : name;
        this.context = contextIsMessage ? undefined : context;
        // this.stack = this?.stack?.split("\n").map((entry) => entry.trim()),
    }
}

export function ValidationFailed(context?: any, message?: string): Exception {
    return new Exception("ValidationFailed", 400, message, context);
}

export function BadRequest(context?: any, message?: string): Exception {
    return new Exception("BadRequest", 400, message, context);
}

export function Unauthorized(context?: any, message?: string): Exception {
    return new Exception("Unauthorized", 401, message, context);
}

export function PaymentRequired(context?: any, message?: string): Exception {
    return new Exception("PaymentRequired", 402, message, context);
}

export function Forbidden(context?: any, message?: string): Exception {
    return new Exception("Forbidden", 403, message, context);
}

export function NotFound(context?: any, message?: string): Exception {
    return new Exception("NotFound", 404, message, context);
}

export function NotAcceptable(context?: any, message?: string): Exception {
    return new Exception("NotAcceptable", 406, message, context);
}

export function TimeOut(context?: any, message?: string): Exception {
    return new Exception("TimeOut", 408, message, context);
}

export function Conflict(context?: any, message?: string): Exception {
    return new Exception("Conflict", 409, message, context);
}

export function Gone(context?: any, message?: string): Exception {
    return new Exception("Gone", 410, message, context);
}

export function PreconditionFailed(context?: any, message?: string): Exception {
    return new Exception("PreconditionFailed", 412, message, context);
}

export function PayloadTooLarge(context?: any, message?: string): Exception {
    return new Exception("PayloadTooLarge", 413, message, context);
}

export function URITooLong(context?: any, message?: string): Exception {
    return new Exception("URITooLong", 414, message, context);
}

export function UnsupportedMediaType(
    context?: any,
    message?: string,
): Exception {
    return new Exception("UnsupportedMediaType", 415, message, context);
}

export function ExpectationFailed(context?: any, message?: string): Exception {
    return new Exception("ExpectationFailed", 417, message, context);
}

export function UnprocessableEntity(
    context?: any,
    message?: string,
): Exception {
    return new Exception("UnprocessableEntity", 422, message, context);
}

export function TooManyRequests(context?: any, message?: string): Exception {
    return new Exception("TooManyRequests", 429, message, context);
}

export function InternalError(context?: any, message?: string): Exception {
    return new Exception("InternalError", 500, message, context);
}

export function NotImplemented(context?: any, message?: string): Exception {
    return new Exception("NotImplemented", 501, message, context);
}
