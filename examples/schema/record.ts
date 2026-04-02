import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Record ──────────────────────────────────────────────────────────────────

// basic string-keyed record
let stringToNumber = Schema.Record(Schema.String(), Schema.Number());
type IStringToNumber = Static<typeof stringToNumber>; // Record<string, number>

// number-keyed record
let numberToString = Schema.Record(Schema.Number(), Schema.String());
type INumberToString = Static<typeof numberToString>; // Record<number, string>

// nullable record
let nullableRecord = Schema.Nullable(
    Schema.Record(Schema.String(), Schema.String()),
);
type INullableRecord = Static<typeof nullableRecord>; // Record<string, string> | null

// optional record
let optionalRecord = Schema.Optional(
    Schema.Record(Schema.String(), Schema.Boolean()),
);
type IOptionalRecord = Static<typeof optionalRecord>; // Record<string, boolean>

// record with object values
let userMap = Schema.Record(
    Schema.String(),
    Schema.Object({
        name: Schema.String(),
        age: Schema.Optional(Schema.Number()),
    }),
);
type IUserMap = Static<typeof userMap>;
// Record<string, { name: string; age?: number }>

// record with any values
let metadata = Schema.Record(Schema.String(), Schema.Any());
type IMetadata = Static<typeof metadata>; // Record<string, any>

// record inside an object
let configSchema = Schema.Object({
    version: Schema.Number(),
    settings: Schema.Record(Schema.String(), Schema.String()),
    headers: Schema.Optional(Schema.Record(Schema.String(), Schema.String())),
});
type IConfig = Static<typeof configSchema>;
// { version: number; settings: Record<string, string>; headers?: Record<string, string> }

// Output:
//   stringToNumber → { type: "object", patternProperties: { "^.*$": { type: "number" } } }
//   numberToString → { type: "object", patternProperties: { "^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$": { type: "string" } } }
//   nullableRecord → { type: ["object", "null"], patternProperties: { "^.*$": { type: "string" } } }
//   optionalRecord → { type: "object", patternProperties: { "^.*$": { type: "boolean" } }, _optional: true }
//   userMap        → { type: "object", patternProperties: { "^.*$": { type: "object", properties: { name: { type: "string" }, age: { type: "number", _optional: true } }, required: ["name"] } } }
//   metadata       → { type: "object", patternProperties: { "^.*$": {} } }
//   configSchema   → { type: "object", properties: { version: { type: "number" }, settings: { type: "object", patternProperties: ... }, headers: { ..., _optional: true } }, required: ["version", "settings"] }
logger.info(
    {
        stringToNumber,
        numberToString,
        nullableRecord,
        optionalRecord,
        userMap,
        metadata,
        configSchema,
    },
    "=== Record schemas ===",
);

// ─── Record with number keys ─────────────────────────────────────────────────

let numberKeyRecord = Schema.Record(Schema.Number(), Schema.Any());
type INumberKeyRecord = Static<typeof numberKeyRecord>; // Record<number, any>

// Output:
//   numberKeyRecord → { type: "object", patternProperties: { "^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$": {} } }
logger.info({ numberKeyRecord }, "=== Number-keyed record ===");
