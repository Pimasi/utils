import type { InterceptorManager } from "./interceptors";

export interface HttpProgressEvent {
    loaded: number;
    total?: number;
    progress?: number;
    bytes?: number;
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
    <T = any, D = any>(
        url: string,
        config?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;

    get<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<HttpResponse<T>>;
    delete<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<HttpResponse<T>>;
    head<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<HttpResponse<T>>;
    options<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<HttpResponse<T>>;

    post<T = any, D = any>(
        url: string,
        data?: D,
        config?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;
    put<T = any, D = any>(
        url: string,
        data?: D,
        config?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;
    patch<T = any, D = any>(
        url: string,
        data?: D,
        config?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;

    postForm<T = any, D = any>(
        url: string,
        data?: D,
        config?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;
    putForm<T = any, D = any>(
        url: string,
        data?: D,
        config?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;
    patchForm<T = any, D = any>(
        url: string,
        data?: D,
        config?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>>;

    getUri(config?: HttpRequestConfig): string;

    defaults: HttpRequestConfig;
    interceptors: {
        request: InterceptorManager<HttpRequestConfig>;
        response: InterceptorManager<HttpResponse>;
    };
    create(defaults?: HttpRequestConfig): HttpInstance;
}
