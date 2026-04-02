import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import {
    create,
    HttpError,
    isHttpError,
    type HttpRequestConfig,
    type HttpResponse,
} from "../src/http";

let server: http.Server;
let baseURL: string;

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url!, `http://localhost`);

        if (url.pathname.startsWith("/status/")) {
            const code = parseInt(url.pathname.split("/")[2]);
            res.writeHead(code, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: code }));
            return;
        }

        if (url.pathname === "/slow") {
            setTimeout(() => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ slow: true }));
            }, 5000);
            return;
        }

        if (url.pathname === "/redirect") {
            res.writeHead(302, { Location: "/echo" });
            res.end();
            return;
        }

        if (url.pathname === "/text") {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("hello plain text");
            return;
        }

        if (url.pathname === "/binary") {
            const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
            res.writeHead(200, {
                "Content-Type": "application/octet-stream",
                "Content-Length": String(buf.length),
            });
            res.end(buf);
            return;
        }

        // Default: echo
        let body = "";
        req.on("data", (chunk: Buffer) => (body += chunk.toString()));
        req.on("end", () => {
            let parsedBody = null;
            if (body) {
                try {
                    parsedBody = JSON.parse(body);
                } catch {
                    parsedBody = body;
                }
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body: parsedBody,
                }),
            );
        });
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };
    baseURL = `http://localhost:${addr.port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("Http", () => {
    describe("create", () => {
        it("creates a callable instance", () => {
            const client = create();
            expect(typeof client).toBe("function");
        });

        it("stores defaults", () => {
            const defaults = { baseURL: "http://example.com" };
            const client = create(defaults);
            expect(client.defaults).toBe(defaults);
        });
    });

    describe("string URL call signature", () => {
        it("accepts url as first argument", async () => {
            const client = create({ baseURL });
            const response = await client("/echo");

            expect(response.status).toBe(200);
            expect(response.data.method).toBe("GET");
        });

        it("accepts url and config", async () => {
            const client = create({ baseURL });
            const response = await client("/echo", { method: "post", data: { x: 1 } });

            expect(response.data.method).toBe("POST");
            expect(response.data.body).toEqual({ x: 1 });
        });
    });

    describe("convenience methods", () => {
        it("get", async () => {
            const client = create({ baseURL });
            const response = await client.get("/echo");

            expect(response.data.method).toBe("GET");
        });

        it("post", async () => {
            const client = create({ baseURL });
            const data = { name: "Rick" };
            const response = await client.post("/echo", data);

            expect(response.data.method).toBe("POST");
            expect(response.data.body).toEqual(data);
        });

        it("put", async () => {
            const client = create({ baseURL });
            const response = await client.put("/echo", { updated: true });

            expect(response.data.method).toBe("PUT");
            expect(response.data.body).toEqual({ updated: true });
        });

        it("patch", async () => {
            const client = create({ baseURL });
            const response = await client.patch("/echo", { patched: true });

            expect(response.data.method).toBe("PATCH");
            expect(response.data.body).toEqual({ patched: true });
        });

        it("delete", async () => {
            const client = create({ baseURL });
            const response = await client.delete("/echo");

            expect(response.data.method).toBe("DELETE");
        });

        it("head", async () => {
            const client = create({ baseURL });
            const response = await client.head("/echo");

            expect(response.status).toBe(200);
        });

        it("options", async () => {
            const client = create({ baseURL });
            const response = await client.options("/echo");

            expect(response.status).toBe(200);
        });
    });

    describe("GET requests", () => {
        it("returns expected response shape", async () => {
            const client = create({ baseURL });
            const response = await client({ url: "/echo", method: "get" });

            expect(response.status).toBe(200);
            expect(response.statusText).toBe("OK");
            expect(response.data.method).toBe("GET");
            expect(response.data.url).toBe("/echo");
            expect(response).toHaveProperty("headers");
            expect(response).toHaveProperty("config");
        });

        it("defaults method to GET", async () => {
            const client = create({ baseURL });
            const response = await client({ url: "/echo" });

            expect(response.data.method).toBe("GET");
        });
    });

    describe("POST with JSON body", () => {
        it("sends JSON data", async () => {
            const payload = { name: "Rick", dimension: "C-137" };
            const client = create({ baseURL });
            const response = await client({ url: "/echo", method: "post", data: payload });

            expect(response.data.body).toEqual(payload);
            expect(response.data.headers["content-type"]).toContain(
                "application/json",
            );
        });

        it("does not override explicit content-type", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                method: "post",
                data: { foo: "bar" },
                headers: { "Content-Type": "text/plain" },
            });

            expect(response.data.headers["content-type"]).toBe("text/plain");
        });
    });

    describe("query params", () => {
        it("serializes params", async () => {
            const params = { foo: "bar", baz: 123 };
            const client = create({ baseURL });
            const response = await client({ url: "/echo", method: "get", params });

            expect(response.data.url).toBe("/echo?foo=bar&baz=123");
        });

        it("skips null/undefined param values", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                params: { a: "1", b: null, c: undefined },
            });

            expect(response.data.url).toBe("/echo?a=1");
        });
    });

    describe("headers", () => {
        it("sends custom headers", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                headers: { "X-Custom": "test-value" },
            });

            expect(response.data.headers["x-custom"]).toBe("test-value");
        });

        it("merges default and per-request headers", async () => {
            const client = create({
                baseURL,
                headers: { "X-Default": "default-value" },
            });

            const response = await client({
                url: "/echo",
                headers: { "X-Request": "request-value" },
            });

            expect(response.data.headers["x-default"]).toBe("default-value");
            expect(response.data.headers["x-request"]).toBe("request-value");
        });

        it("per-request headers override defaults", async () => {
            const client = create({
                baseURL,
                headers: { "X-Override": "default" },
            });

            const response = await client({
                url: "/echo",
                headers: { "X-Override": "overridden" },
            });

            expect(response.data.headers["x-override"]).toBe("overridden");
        });
    });

    describe("baseURL", () => {
        it("prepends baseURL to relative urls", async () => {
            const client = create({ baseURL });
            const response = await client({ url: "/echo" });

            expect(response.status).toBe(200);
        });

        it("handles trailing slash on baseURL", async () => {
            const client = create({ baseURL: baseURL + "/" });
            const response = await client({ url: "echo" });

            expect(response.status).toBe(200);
            expect(response.data.url).toBe("/echo");
        });

        it("does not prepend baseURL to absolute urls", async () => {
            const client = create({ baseURL: "http://should-not-use.com" });
            const response = await client({ url: `${baseURL}/echo` });

            expect(response.status).toBe(200);
        });
    });

    describe("error handling", () => {
        it("throws on non-2xx status", async () => {
            const client = create({ baseURL });
            const err = await client({ url: "/status/404" }).catch((e) => e) as HttpError;

            expect(err).toBeInstanceOf(HttpError);
            expect(err.status).toBe(404);
            expect(err.response!.data).toEqual({ status: 404 });
        });

        it("includes response in error", async () => {
            const client = create({ baseURL });

            try {
                await client({ url: "/status/500" });
                expect.unreachable("should have thrown");
            } catch (err) {
                expect(err).toBeInstanceOf(HttpError);
                const httpErr = err as HttpError;
                expect(httpErr.status).toBe(500);
                expect(httpErr.response).toBeDefined();
                expect(httpErr.response!.data).toEqual({ status: 500 });
            }
        });

        it("error message includes status code", async () => {
            const client = create({ baseURL });
            const err = await client({ url: "/status/400" }).catch((e) => e) as HttpError;

            expect(err.message).toBe("Request failed with status code 400");
        });
    });

    describe("validateStatus", () => {
        it("accepts all statuses when null", async () => {
            const client = create({ baseURL, validateStatus: null });

            const response = await client({ url: "/status/404" });
            expect(response.status).toBe(404);
        });

        it("uses custom validateStatus", async () => {
            const validateStatus = (s: number) => s < 500;
            const client = create({ baseURL, validateStatus });

            const ok = await client({ url: "/status/404" });
            expect(ok.status).toBe(404);

            await expect(
                client({ url: "/status/500" }),
            ).rejects.toBeInstanceOf(HttpError);
        });
    });

    describe("timeout", () => {
        it("aborts request after timeout", async () => {
            const client = create({ baseURL, timeout: 50 });

            try {
                await client({ url: "/slow" });
                expect.unreachable("should have thrown");
            } catch (err) {
                expect(err).toBeInstanceOf(HttpError);
                expect((err as HttpError).code).toBe("ECONNABORTED");
            }
        });
    });

    describe("auth", () => {
        it("sends basic auth header", async () => {
            const client = create({ baseURL });
            const auth = { username: "rick", password: "c137" };
            const response = await client({ url: "/echo", auth });

            expect(response.data.headers["authorization"]).toBe(
                `Basic ${btoa("rick:c137")}`,
            );
        });
    });

    describe("responseType", () => {
        it("returns text when responseType is text", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/text",
                responseType: "text",
            });

            expect(typeof response.data).toBe("string");
            expect(response.data).toBe("hello plain text");
        });

        it("returns ArrayBuffer when responseType is arraybuffer", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/binary",
                responseType: "arraybuffer",
            });

            expect(response.data).toBeInstanceOf(ArrayBuffer);
            const bytes = new Uint8Array(response.data as ArrayBuffer);
            expect(bytes).toEqual(new Uint8Array([0x00, 0x01, 0x02, 0x03]));
        });

        it("returns Blob when responseType is blob", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/binary",
                responseType: "blob",
            });

            expect(response.data).toBeInstanceOf(Blob);
        });

        it("defaults to json parsing", async () => {
            const client = create({ baseURL });
            const response = await client({ url: "/echo" });

            expect(typeof response.data).toBe("object");
        });
    });

    describe("withCredentials", () => {
        it("accepts withCredentials config without error", async () => {
            const client = create({ baseURL, withCredentials: true });
            const response = await client({ url: "/echo" });

            expect(response.status).toBe(200);
        });
    });

    describe("transformRequest", () => {
        it("transforms data before sending", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                method: "post",
                data: { name: "rick" },
                transformRequest: [(data, headers) => {
                    headers["content-type"] = "application/json";
                    return JSON.stringify({ ...data, transformed: true });
                }],
            });

            expect(response.data.body).toEqual({
                name: "rick",
                transformed: true,
            });
        });

        it("chains multiple transforms", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                method: "post",
                data: { step: 0 },
                transformRequest: [
                    (data, headers) => {
                        headers["content-type"] = "application/json";
                        return { ...data, step: 1 };
                    },
                    (data) => JSON.stringify({ ...data, step: 2 }),
                ],
            });

            expect(response.data.body).toEqual({ step: 2 });
        });
    });

    describe("transformResponse", () => {
        it("transforms response data", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                transformResponse: [(data) => ({ ...data, extra: true })],
            });

            expect(response.data.extra).toBe(true);
            expect(response.data.method).toBe("GET");
        });

        it("chains multiple transforms", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                transformResponse: [
                    (data) => ({ ...data, first: true }),
                    (data) => ({ ...data, second: true }),
                ],
            });

            expect(response.data.first).toBe(true);
            expect(response.data.second).toBe(true);
        });
    });

    describe("paramsSerializer", () => {
        it("uses custom serializer", async () => {
            const client = create({ baseURL });
            const response = await client({
                url: "/echo",
                params: { foo: "bar", baz: "qux" },
                paramsSerializer: (params) =>
                    Object.entries(params)
                        .map(([k, v]) => `${k}:${v}`)
                        .join("|"),
            });

            expect(response.data.url).toBe("/echo?foo:bar|baz:qux");
        });
    });

    describe("maxRedirects", () => {
        it("follows redirects by default", async () => {
            const client = create({ baseURL });
            const response = await client({ url: "/redirect" });

            expect(response.status).toBe(200);
            expect(response.data.method).toBe("GET");
        });

        it("does not follow redirects when maxRedirects is 0", async () => {
            const client = create({
                baseURL,
                maxRedirects: 0,
                validateStatus: null,
            });
            const response = await client({ url: "/redirect" });

            expect(response.status).toBe(302);
        });
    });

    describe("onDownloadProgress", () => {
        it("fires progress events", async () => {
            const events: any[] = [];
            const client = create({ baseURL });
            await client({
                url: "/echo",
                onDownloadProgress: (e) => events.push(e),
            });

            expect(events.length).toBeGreaterThan(0);
            expect(events[events.length - 1]).toHaveProperty("loaded");
            expect(events[events.length - 1]).toHaveProperty("bytes");
        });
    });

    describe("getUri", () => {
        it("builds URI from config", () => {
            const client = create({ baseURL: "https://api.example.com" });
            const uri = client.getUri({
                url: "/users",
                params: { page: 1, limit: 10 },
            });

            expect(uri).toBe("https://api.example.com/users?page=1&limit=10");
        });

        it("uses defaults", () => {
            const client = create({ baseURL: "https://api.example.com" });
            const uri = client.getUri({ url: "/health" });

            expect(uri).toBe("https://api.example.com/health");
        });
    });

    describe("isHttpError", () => {
        it("returns true for HttpError instances", async () => {
            const client = create({ baseURL });
            const err = await client({ url: "/status/400" }).catch((e) => e);

            expect(isHttpError(err)).toBe(true);
        });

        it("returns true for objects with isAxiosError", () => {
            expect(isHttpError({ isAxiosError: true })).toBe(true);
        });

        it("returns false for other values", () => {
            expect(isHttpError(new Error("nope"))).toBe(false);
            expect(isHttpError(null)).toBe(false);
            expect(isHttpError("string")).toBe(false);
        });
    });

    describe("toJSON", () => {
        it("serializes error to JSON", async () => {
            const client = create({ baseURL });
            const err = await client({ url: "/status/500" }).catch(
                (e) => e,
            ) as HttpError;

            const json = err.toJSON();
            expect(json).toEqual({
                message: "Request failed with status code 500",
                name: "HttpError",
                code: undefined,
                status: 500,
            });
        });
    });

    describe("form helpers", () => {
        it("postForm sends FormData", async () => {
            const client = create({ baseURL });
            const response = await client.postForm("/echo", {
                name: "Rick",
                dimension: "C-137",
            });

            expect(response.data.method).toBe("POST");
            expect(response.data.headers["content-type"]).toContain(
                "multipart/form-data",
            );
        });

        it("putForm sends FormData", async () => {
            const client = create({ baseURL });
            const response = await client.putForm("/echo", { key: "value" });

            expect(response.data.method).toBe("PUT");
            expect(response.data.headers["content-type"]).toContain(
                "multipart/form-data",
            );
        });

        it("patchForm sends FormData", async () => {
            const client = create({ baseURL });
            const response = await client.patchForm("/echo", { key: "value" });

            expect(response.data.method).toBe("PATCH");
            expect(response.data.headers["content-type"]).toContain(
                "multipart/form-data",
            );
        });
    });

    describe("interceptors", () => {
        describe("request interceptors", () => {
            it("transforms config before request", async () => {
                const client = create({ baseURL });

                client.interceptors.request.use((config) => ({
                    ...config,
                    headers: {
                        ...config.headers,
                        "X-Intercepted": "true",
                    },
                }));

                const response = await client({ url: "/echo" });
                expect(response.data.headers["x-intercepted"]).toBe("true");
            });

            it("chains multiple request interceptors in order", async () => {
                const client = create({ baseURL });
                const order: number[] = [];

                client.interceptors.request.use((config) => {
                    order.push(1);
                    return {
                        ...config,
                        headers: { ...config.headers, "X-First": "1" },
                    };
                });

                client.interceptors.request.use((config) => {
                    order.push(2);
                    return {
                        ...config,
                        headers: { ...config.headers, "X-Second": "2" },
                    };
                });

                const response = await client({ url: "/echo" });

                expect(order).toEqual([1, 2]);
                expect(response.data.headers["x-first"]).toBe("1");
                expect(response.data.headers["x-second"]).toBe("2");
            });

            it("rejected handler catches errors from previous interceptor", async () => {
                const client = create({ baseURL });

                client.interceptors.request.use(() => {
                    throw new Error("interceptor failed");
                });

                client.interceptors.request.use(
                    (config) => config,
                    () => {
                        return Promise.resolve({
                            baseURL,
                            url: "/echo",
                            headers: { "X-Recovered": "true" },
                        } as HttpRequestConfig);
                    },
                );

                const response = await client({ url: "/echo" });
                expect(response.data.headers["x-recovered"]).toBe("true");
            });

            it("runWhen conditionally skips interceptors", async () => {
                const client = create({ baseURL });

                client.interceptors.request.use(
                    (config) => ({
                        ...config,
                        headers: { ...config.headers, "X-Conditional": "true" },
                    }),
                    null,
                    { runWhen: (config) => config.method === "post" },
                );

                const getResponse = await client.get("/echo");
                expect(getResponse.data.headers["x-conditional"]).toBeUndefined();

                const postResponse = await client.post("/echo", {});
                expect(postResponse.data.headers["x-conditional"]).toBe("true");
            });
        });

        describe("response interceptors", () => {
            it("transforms response", async () => {
                const client = create({ baseURL });

                client.interceptors.response.use((response) => ({
                    ...response,
                    data: { ...response.data, intercepted: true },
                }));

                const response = await client({ url: "/echo" });
                expect(response.data.intercepted).toBe(true);
            });

            it("rejected handler catches http errors", async () => {
                const client = create({ baseURL });

                client.interceptors.response.use(
                    (response) => response,
                    (err: HttpError) => {
                        return {
                            data: {
                                recovered: true,
                                originalStatus: err.status,
                            },
                            status: 200,
                            statusText: "OK",
                            headers: {},
                            config: err.config,
                        } as HttpResponse;
                    },
                );

                const response = await client({ url: "/status/500" });
                expect(response.data.recovered).toBe(true);
                expect(response.data.originalStatus).toBe(500);
            });

            it("chains multiple response interceptors in order", async () => {
                const client = create({ baseURL });

                client.interceptors.response.use((response) => ({
                    ...response,
                    data: { ...response.data, first: true },
                }));

                client.interceptors.response.use((response) => ({
                    ...response,
                    data: { ...response.data, second: true },
                }));

                const response = await client({ url: "/echo" });
                expect(response.data.first).toBe(true);
                expect(response.data.second).toBe(true);
            });
        });

        describe("eject", () => {
            it("removes interceptor by id", async () => {
                const client = create({ baseURL });

                const id = client.interceptors.request.use((config) => ({
                    ...config,
                    headers: {
                        ...config.headers,
                        "X-Should-Not-Exist": "1",
                    },
                }));

                client.interceptors.request.eject(id);

                const response = await client({ url: "/echo" });
                expect(
                    response.data.headers["x-should-not-exist"],
                ).toBeUndefined();
            });

            it("eject is idempotent", () => {
                const client = create({ baseURL });
                const id = client.interceptors.request.use((c) => c);
                client.interceptors.request.eject(id);
                client.interceptors.request.eject(id);
            });
        });

        describe("clear", () => {
            it("removes all interceptors", async () => {
                const client = create({ baseURL });

                client.interceptors.request.use((config) => ({
                    ...config,
                    headers: { ...config.headers, "X-Gone": "1" },
                }));
                client.interceptors.response.use((response) => ({
                    ...response,
                    data: { ...response.data, gone: true },
                }));

                client.interceptors.request.clear();
                client.interceptors.response.clear();

                const response = await client({ url: "/echo" });
                expect(response.data.headers["x-gone"]).toBeUndefined();
                expect(response.data.gone).toBeUndefined();
            });
        });
    });
});
