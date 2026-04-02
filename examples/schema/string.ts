import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── String ──────────────────────────────────────────────────────────────────

let stringType = Schema.String();
type IstringType = Static<typeof stringType>; // string

let nullableStringType = Schema.Nullable(Schema.String());
type InullableStringType = Static<typeof nullableStringType>; // string | null

let enumStringType = Schema.String({ enum: ["a", "b", "c"] as const }); // "a" | "b" | "c"
type IenumStringType = Static<typeof enumStringType>;

let nullableEnumStringType = Schema.Nullable(
    Schema.String({ enum: ["a", "b", "c"] as const }),
); // "a" | "b" | "c" | null
type InullableEnumStringType = Static<typeof nullableEnumStringType>;

let stringWithOptions = Schema.String({
    minLength: 1,
    maxLength: 255,
    pattern: "^[a-z]+$",
    description: "lowercase string",
});
type IstringWithOptions = Static<typeof stringWithOptions>;

let emailString = Schema.String({ format: "email" });

// Output:
//   stringWithOptions → { minLength: 1, maxLength: 255, pattern: "^[a-z]+$", description: "lowercase string", type: "string" }
//   emailString       → { format: "email", type: "string" }
logger.info({ stringWithOptions, emailString });

// Output:
//   stringType              → { type: "string" }
//   nullableStringType      → { type: ["string", "null"] }
//   enumStringType          → { type: "string", enum: ["a", "b", "c"] }
//   nullableEnumStringType  → { type: ["string", "null"], enum: ["a", "b", "c"] }
//   stringWithOptions       → { minLength: 1, maxLength: 255, pattern: "^[a-z]+$", description: "lowercase string", type: "string" }
//   emailString             → { format: "email", type: "string" }
logger.info(
    {
        stringType,
        nullableStringType,
        enumStringType,
        nullableEnumStringType,
        stringWithOptions,
        emailString,
    },
    "=== String schemas ===",
);
