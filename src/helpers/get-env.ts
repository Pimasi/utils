import { InternalError } from "../error";

export function getenv(key: string, defaultValue?: string): string {
    const value = process.env[key];

    if (value || value !== undefined) {
        return value;
    }

    if (defaultValue !== undefined) {
        return defaultValue;
    }

    throw InternalError(`${key} is not set in environment`);
}
