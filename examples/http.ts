import { http } from "../src/http";

const $logger = console;
const $envPrivate = { API_URL: "https://api.example.com" };
const $envPublic = { AUTH_COOKIE: "auth_token" };

const isServer = typeof window === "undefined";

const client = http.create({
    baseURL: !isServer ? `/api` : $envPrivate.API_URL,
});

client.interceptors.request.use(async (config) => {
    if (isServer) {
        try {
            let cookies = () =>
                Promise.resolve({
                    get: (_name: string) => ({ value: "mock-token" }),
                });

            let cookieStore = await cookies();
            let token = cookieStore.get($envPublic.AUTH_COOKIE)?.value;
            let authHeader = config.headers?.["Authorization"];

            // Set Authorization from cookie if not already provided
            if (token && !authHeader) {
                config.headers = {
                    ...config.headers,
                    Authorization: token,
                };
                $logger.debug(`auth token set on http request`);
            }
        } catch (err) {
            $logger.warn(err, "http interceptor error");
        }
    }
    return config;
});
