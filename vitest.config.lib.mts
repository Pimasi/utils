import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        environment: "node",
        globals: true,
    },
    resolve: {
        alias: {
            "../src": path.resolve(import.meta.dirname, "lib"),
        },
    },
});
