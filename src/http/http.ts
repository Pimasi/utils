import { jsonStringify } from "../helpers";
import { createInterceptorManager } from "./interceptors";
import type {
    HttpRequestConfig,
    HttpResponse,
    HttpInstance,
    HttpProgressEvent,
} from "./types";
import { HttpError } from "./types";

export function toFormData(obj: Record<string, any>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(obj)) {
        if (value != null) {
            fd.append(key, value instanceof Blob ? value : String(value));
        }
    }
    return fd;
}

function buildURL(config: HttpRequestConfig): string {
    let url = config.url || "";

    if (config.baseURL && !/^https?:\/\//i.test(url)) {
        url =
            config.baseURL.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
    }

    if (config.params) {
        let qs: string;
        if (config.paramsSerializer) {
            qs = config.paramsSerializer(
                config.params as Record<string, any>,
            );
        } else {
            const parts: string[] = [];
            for (const [key, value] of Object.entries(config.params)) {
                if (value != null) {
                    parts.push(
                        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
                    );
                }
            }
            qs = parts.join("&");
        }
        if (qs) {
            url += (url.includes("?") ? "&" : "?") + qs;
        }
    }

    return url;
}

function mergeConfig<D>(
    defaults: HttpRequestConfig,
    config: HttpRequestConfig<D>,
): HttpRequestConfig<D> {
    return {
        ...defaults,
        ...config,
        headers: {
            ...defaults.headers,
            ...config.headers,
        },
    };
}

async function readBodyWithProgress(
    res: Response,
    onProgress: (event: HttpProgressEvent) => void,
): Promise<Uint8Array> {
    const reader = res.body!.getReader();
    const contentLength =
        parseInt(res.headers.get("content-length") || "0") || undefined;
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress({
            loaded,
            total: contentLength,
            progress: contentLength ? loaded / contentLength : undefined,
            bytes: value.length,
        });
    }

    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

async function dispatchRequest<T = any, D = any>(
    config: HttpRequestConfig<D>,
): Promise<HttpResponse<T, D>> {
    const url = buildURL(config);
    const method = (config.method || "get").toUpperCase();

    // Build mutable headers record (lowercase keys)
    const headerRecord: Record<string, string> = {};
    if (config.headers) {
        for (const [k, v] of Object.entries(config.headers)) {
            headerRecord[k.toLowerCase()] = v;
        }
    }

    // Basic auth
    if (config.auth) {
        headerRecord["authorization"] = `Basic ${btoa(
            `${config.auth.username}:${config.auth.password}`,
        )}`;
    }

    // Prepare body
    let body: BodyInit | undefined;
    if (config.data != null) {
        if (config.transformRequest) {
            const transforms = Array.isArray(config.transformRequest)
                ? config.transformRequest
                : [config.transformRequest];
            let transformed: any = config.data;
            for (const fn of transforms) {
                transformed = fn(transformed, headerRecord);
            }
            body = transformed ?? undefined;
        } else if (typeof config.data === "string") {
            body = config.data;
        } else if (config.data instanceof FormData) {
            body = config.data as any;
        } else {
            body = jsonStringify(config.data);
            if (!headerRecord["content-type"]) {
                headerRecord["content-type"] = "application/json";
            }
        }
    }

    const headers = new Headers(headerRecord);
    const init: RequestInit = { method, headers, body };

    // withCredentials
    if (config.withCredentials) {
        init.credentials = "include";
    }

    // maxRedirects
    if (config.maxRedirects === 0) {
        init.redirect = "manual";
    }

    // Timeout
    let controller: AbortController | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (config.signal) {
        init.signal = config.signal;
    } else if (config.timeout) {
        controller = new AbortController();
        init.signal = controller.signal;
        timeoutId = setTimeout(() => controller!.abort(), config.timeout);
    }

    try {
        const res = await fetch(url, init);

        const responseHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => {
            responseHeaders[k] = v;
        });

        // Read response body
        const responseType = config.responseType || "json";
        let data: any;

        if (config.onDownloadProgress && res.body) {
            const raw = await readBodyWithProgress(
                res,
                config.onDownloadProgress,
            );
            if (responseType === "arraybuffer") {
                data = raw.buffer.slice(
                    raw.byteOffset,
                    raw.byteOffset + raw.byteLength,
                );
            } else if (responseType === "blob") {
                data = new Blob([raw as any]);
            } else {
                const text = new TextDecoder().decode(raw);
                if (responseType === "text") {
                    data = text;
                } else {
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = text;
                    }
                }
            }
        } else if (responseType === "arraybuffer") {
            data = await res.arrayBuffer();
        } else if (responseType === "blob") {
            data = await res.blob();
        } else if (responseType === "text") {
            data = await res.text();
        } else {
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
        }

        // Apply transformResponse
        if (config.transformResponse) {
            const transforms = Array.isArray(config.transformResponse)
                ? config.transformResponse
                : [config.transformResponse];
            for (const fn of transforms) {
                data = fn(data);
            }
        }

        const response: HttpResponse<T, D> = {
            data,
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
            config,
        };

        const validateStatus =
            config.validateStatus === null
                ? null
                : config.validateStatus ||
                  ((s: number) => s >= 200 && s < 300);

        if (validateStatus && !validateStatus(res.status)) {
            throw new HttpError(
                `Request failed with status code ${res.status}`,
                config,
                response,
            );
        }

        return response;
    } catch (err) {
        if (err instanceof HttpError) throw err;

        if (err instanceof globalThis.Error && err.name === "AbortError") {
            const error = new HttpError<T, D>(
                config.timeout
                    ? `timeout of ${config.timeout}ms exceeded`
                    : "canceled",
                config,
            );
            error.code = config.timeout ? "ECONNABORTED" : "ERR_CANCELED";
            throw error;
        }

        throw new HttpError<T, D>(
            err instanceof globalThis.Error ? err.message : "Network Error",
            config,
        );
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

export function create(defaults: HttpRequestConfig = {}): HttpInstance {
    const requestInterceptors =
        createInterceptorManager<HttpRequestConfig>();
    const responseInterceptors = createInterceptorManager<HttpResponse>();

    const instance = function <T = any, D = any>(
        configOrUrl: HttpRequestConfig<D> | string,
        maybeConfig?: HttpRequestConfig<D>,
    ): Promise<HttpResponse<T, D>> {
        const config: HttpRequestConfig<D> =
            typeof configOrUrl === "string"
                ? { ...(maybeConfig || {}), url: configOrUrl }
                : configOrUrl;

        type ChainLink = {
            fulfilled?: ((value: any) => any) | null;
            rejected?: ((error: any) => any) | null;
        };

        const mergedConfig = mergeConfig(defaults, config);
        const chain: ChainLink[] = [];

        for (const h of requestInterceptors.handlers) {
            if (h && (!h.runWhen || h.runWhen(mergedConfig))) {
                chain.push(h);
            }
        }

        chain.push({ fulfilled: dispatchRequest, rejected: undefined });

        for (const h of responseInterceptors.handlers) {
            if (h) chain.push(h);
        }

        let promise: Promise<any> = Promise.resolve(mergedConfig);
        for (const { fulfilled, rejected } of chain) {
            promise = promise.then(
                fulfilled ?? undefined,
                rejected ?? undefined,
            );
        }

        return promise;
    } as HttpInstance;

    // Convenience methods — no body
    instance.get = (url, config) =>
        instance({ ...config, url, method: "get" });
    instance.delete = (url, config) =>
        instance({ ...config, url, method: "delete" });
    instance.head = (url, config) =>
        instance({ ...config, url, method: "head" });
    instance.options = (url, config) =>
        instance({ ...config, url, method: "options" });

    // Convenience methods — with body
    instance.post = (url, data, config) =>
        instance({ ...config, url, method: "post", data });
    instance.put = (url, data, config) =>
        instance({ ...config, url, method: "put", data });
    instance.patch = (url, data, config) =>
        instance({ ...config, url, method: "patch", data });

    // Form convenience methods
    instance.postForm = (url, data, config) => {
        const fd = data instanceof FormData ? data : toFormData(data as any);
        return instance({ ...config, url, method: "post", data: fd as any });
    };
    instance.putForm = (url, data, config) => {
        const fd = data instanceof FormData ? data : toFormData(data as any);
        return instance({ ...config, url, method: "put", data: fd as any });
    };
    instance.patchForm = (url, data, config) => {
        const fd = data instanceof FormData ? data : toFormData(data as any);
        return instance({ ...config, url, method: "patch", data: fd as any });
    };

    // URI builder
    instance.getUri = (config) => {
        const merged = config ? mergeConfig(defaults, config) : defaults;
        return buildURL(merged);
    };

    instance.defaults = defaults;
    instance.interceptors = {
        request: requestInterceptors,
        response: responseInterceptors,
    };
    instance.create = create;

    return instance;
}

export const http = create();
