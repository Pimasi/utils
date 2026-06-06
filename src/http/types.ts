import type { InterceptorManager } from "./interceptors";

export interface HttpProgressEvent {
    loaded: number;
    total?: number;
    progress?: number;
    bytes?: number;
}

/**
 * Minimal structural type for an undici `Dispatcher` (e.g. an `Agent` or
 * `Pool`). Declared locally — and intentionally not imported from
 * `undici-types` — so the library keeps **zero dependencies** and stays
 * browser-safe. A real undici dispatcher is structurally assignable to this,
 * so callers can pass `new Agent({ ... })` without a cast; the only member we
 * rely on is the `dispatch` method that undici's `fetch` consumes.
 */
export interface HttpDispatcher {
    dispatch(options: any, handler: any): boolean;
}

export interface HttpRequestConfig<D = any> {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined | null>;
    data?: D;
    timeout?: number;
    validateStatus?: ((status: number) => boolean) | null;
    signal?: AbortSignal;
    /**
     * Custom undici `Dispatcher` (e.g. an `Agent`) forwarded onto the
     * underlying `fetch` call. Use this to override undici transport limits
     * that aren't exposed on `fetch` directly — most notably the hidden ~5 min
     * `headersTimeout` (and `bodyTimeout`) — on a per-request basis, without
     * mutating the global dispatcher:
     *
     * ```ts
     * import { Agent } from "undici";
     * const dispatcher = new Agent({ headersTimeout: 600_000, bodyTimeout: 600_000 });
     * await http({ url, method: "POST", data, dispatcher });
     * ```
     *
     * Composes with `timeout` and `signal` (an AbortController ceiling can still
     * apply). Construct one with the `undici` package at runtime; the type is
     * the library's own {@link HttpDispatcher} (no dependency on undici's types).
     *
     * Node-only: browser `fetch` has no concept of a dispatcher and ignores
     * this field, so it is always safe to leave unset in browser builds.
     */
    dispatcher?: HttpDispatcher;
    withCredentials?: boolean;
    responseType?: "json" | "text" | "arraybuffer" | "blob";
    auth?: { username: string; password: string };
    transformRequest?:
        | ((data: any, headers: Record<string, string>) => any)
        | ((data: any, headers: Record<string, string>) => any)[];
    transformResponse?: ((data: any) => any) | ((data: any) => any)[];
    paramsSerializer?: (params: Record<string, any>) => string;
    maxRedirects?: number;
    onUploadProgress?: (event: HttpProgressEvent) => void;
    onDownloadProgress?: (event: HttpProgressEvent) => void;
}

export interface HttpResponse<T = any, D = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: HttpRequestConfig<D>;
}

export class HttpError<T = any, D = any> extends globalThis.Error {
    readonly isAxiosError = true;
    response?: HttpResponse<T, D>;
    config: HttpRequestConfig<D>;
    status?: number;
    code?: string;

    constructor(
        message: string,
        config: HttpRequestConfig<D>,
        response?: HttpResponse<T, D>,
    ) {
        super(message);
        this.name = "HttpError";
        this.config = config;
        this.response = response;
        this.status = response?.status;
    }

    toJSON() {
        return {
            message: this.message,
            name: this.name,
            code: this.code,
            status: this.status,
        };
    }
}

export function isHttpError(value: unknown): value is HttpError {
    return (
        value instanceof HttpError ||
        (value != null &&
            typeof value === "object" &&
            (value as any).isAxiosError === true)
    );
}

export interface HttpInstance {
    <T = any, D = any>(
        config: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;

    defaults: HttpRequestConfig;
    interceptors: {
        request: InterceptorManager<HttpRequestConfig>;
        response: InterceptorManager<HttpResponse>;
    };
    create(defaults?: HttpRequestConfig): HttpInstance;
}
