import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Boolean ─────────────────────────────────────────────────────────────────

let booleanType = Schema.Boolean();
type IbooleanType = Static<typeof booleanType>; // boolean

let nullableBooleanType = Schema.Nullable(Schema.Boolean());
type InullableBooleanType = Static<typeof nullableBooleanType>; // boolean | null

let booleanWithDefault = Schema.Boolean({
    default: false,
    description: "is active",
});

// Output:
//   booleanType        → { type: "boolean" }
//   nullableBooleanType → { type: ["boolean", "null"] }
//   booleanWithDefault → { default: false, description: "is active", type: "boolean" }
logger.info(
    {
        booleanType,
        nullableBooleanType,
        booleanWithDefault,
    },
    "=== Boolean schemas ===",
);
