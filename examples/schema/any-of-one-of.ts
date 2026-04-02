import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── AnyOf / OneOf ───────────────────────────────────────────────────────────

// anyOf — value is one of several types (union)
let stringOrNumber = Schema.AnyOf([Schema.String(), Schema.Number()]);
type IStringOrNumber = Static<typeof stringOrNumber>; // string | number

// nullable anyOf
let stringOrNumberOrNull = Schema.Nullable(
    Schema.AnyOf([Schema.String(), Schema.Number()]),
);
type IStringOrNumberOrNull = Static<typeof stringOrNumberOrNull>; // string | number | null

// anyOf with objects
let catSchema = Schema.Object({ meow: Schema.Boolean() });
let dogSchema = Schema.Object({ bark: Schema.Boolean() });
let pet = Schema.AnyOf([catSchema, dogSchema]);
type IPet = Static<typeof pet>; // { meow: boolean } | { bark: boolean }

// oneOf — exactly one must match (same TS type as anyOf, stricter at validation)
let statusSchema = Schema.OneOf([
    Schema.String({ enum: ["active", "inactive"] as const }),
    Schema.Number({ enum: [0, 1] as const }),
]);
type IStatus = Static<typeof statusSchema>; // "active" | "inactive" | 0 | 1

// optional oneOf
let optionalPet = Schema.Optional(Schema.OneOf([catSchema, dogSchema]));
type IOptionalPet = Static<typeof optionalPet>; // { meow: boolean } | { bark: boolean }

// raw JSON schema with anyOf / oneOf (via as const or Schema.From)
const rawAnyOf = Schema.From({
    anyOf: [
        { type: "string" },
        {
            type: "object",
            properties: { id: { type: "number" } },
            required: ["id"],
        },
    ],
});
type IRawAnyOf = Static<typeof rawAnyOf>; // string | { id: number }

const rawOneOf = {
    oneOf: [{ type: "number" }, { type: "boolean" }],
} as const;
type IRawOneOf = Static<typeof rawOneOf>; // number | boolean

// Output:
//   stringOrNumber       → { anyOf: [{ type: "string" }, { type: "number" }] }
//   stringOrNumberOrNull → { anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }] }
//   pet                  → { anyOf: [{ type: "object", properties: { meow: { type: "boolean" } }, required: ["meow"] }, { type: "object", properties: { bark: { type: "boolean" } }, required: ["bark"] }] }
//   statusSchema         → { oneOf: [{ type: "string", enum: ["active", "inactive"] }, { type: "number", enum: [0, 1] }] }
//   optionalPet          → { oneOf: ["[Reference]", "[Reference]"], _optional: true }
//   rawAnyOf             → { anyOf: [{ type: "string" }, { type: "object", properties: { id: { type: "number" } }, required: ["id"] }] }
//   rawOneOf             → { oneOf: [{ type: "number" }, { type: "boolean" }] }
logger.info(
    {
        stringOrNumber,
        stringOrNumberOrNull,
        pet,
        statusSchema,
        optionalPet,
        rawAnyOf,
        rawOneOf,
    },
    "=== AnyOf / OneOf schemas ===",
);
