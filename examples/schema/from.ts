import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Base schema (as const) ─────────────────────────────────────────────────

const baseSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        age: { type: ["number", "null"] },
    },
    required: ["name", "age"],
    additionalProperties: false,
} as const;

type IBaseSchema = Static<typeof baseSchema>;

// Output:
//   baseSchema → { type: "object", properties: { name: { type: "string" }, age: { type: ["number", "null"] } }, required: ["name", "age"], additionalProperties: false }
logger.info({ baseSchema }, "=== Base schema ===");

// ─── Schema.From (no `as const` needed) ─────────────────────────────────────

const fromSchema = Schema.From({
    type: "object",
    properties: {
        name: { type: "string" },
        age: { type: "number" },
        active: { type: "boolean" },
    },
    required: ["name", "age"],
});
type IFromSchema = Static<typeof fromSchema>;

// Output:
//   fromSchema → { type: "object", properties: { name: { type: "string" }, age: { type: "number" }, active: { type: "boolean" } }, required: ["name", "age"] }
logger.info({ fromSchema }, "=== From schema ===");
// { name: string; age: number; active?: boolean }
