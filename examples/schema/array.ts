import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Array ───────────────────────────────────────────────────────────────────

let stringArrayType = Schema.Array(Schema.String());
type IstringArrayType = Static<typeof stringArrayType>; // string[]

let nullableArrayType = Schema.Nullable(Schema.Array(Schema.Number()));
type InullableArrayType = Static<typeof nullableArrayType>; // number[] | null

let arrayOfNullableStrings = Schema.Array(Schema.Nullable(Schema.String()));
type IarrayOfNullableStrings = Static<typeof arrayOfNullableStrings>; // (string | null)[]

let arrayWithOptions = Schema.Array(Schema.String(), {
    minItems: 1,
    maxItems: 10,
    uniqueItems: true,
});

let enumArray = Schema.Array(Schema.String({ enum: ["x", "y", "z"] as const }));
type IenumArray = Static<typeof enumArray>; // ("x" | "y" | "z")[]

let nestedArray = Schema.Array(Schema.Array(Schema.Number()));
type InestedArray = Static<typeof nestedArray>; // number[][]

// ─── Array: optional & nullable ─────────────────────────────────────────────

let optionalArray = Schema.Optional(Schema.Array(Schema.String()));
type IoptionalArray = Static<typeof optionalArray>; // string[]

let optionalNullableArray = Schema.Optional(
    Schema.Nullable(Schema.Array(Schema.Number())),
);
type IoptionalNullableArray = Static<typeof optionalNullableArray>; // number[] | null

// Output:
//   stringArrayType         → { type: "array", items: { type: "string" } }
//   nullableArrayType       → { type: ["array", "null"], items: { type: "number" } }
//   arrayOfNullableStrings  → { type: "array", items: { type: ["string", "null"] } }
//   arrayWithOptions        → { minItems: 1, maxItems: 10, uniqueItems: true, type: "array", items: { type: "string" } }
//   enumArray               → { type: "array", items: { type: "string", enum: ["x", "y", "z"] } }
//   nestedArray             → { type: "array", items: { type: "array", items: { type: "number" } } }
//   optionalArray           → { type: "array", items: { type: "string" }, _optional: true }
//   optionalNullableArray   → { type: ["array", "null"], items: { type: "number" }, _optional: true }
logger.info(
    {
        stringArrayType,
        nullableArrayType,
        arrayOfNullableStrings,
        arrayWithOptions,
        enumArray,
        nestedArray,
        optionalArray,
        optionalNullableArray,
    },
    "=== Array schemas ===",
);
