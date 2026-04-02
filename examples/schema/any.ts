import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Any ─────────────────────────────────────────────────────────────────────

let anyType = Schema.Any();
type IAnyType = Static<typeof anyType>; // any

let optionalAny = Schema.Optional(Schema.Any());
type IOptionalAny = Static<typeof optionalAny>; // any

let describedAny = Schema.Any({ description: "arbitrary metadata payload" });
type IDescribedAny = Static<typeof describedAny>; // any

// any inside an object — useful for "pass-through" fields
let eventSchema = Schema.Object({
    type: Schema.String(),
    payload: Schema.Any(),
    meta: Schema.Optional(Schema.Any()),
});
type IEvent = Static<typeof eventSchema>;
// { type: string; payload: any; meta?: any }

// Output:
//   anyType      → {}
//   optionalAny  → { _optional: true }
//   describedAny → { description: "arbitrary metadata payload" }
//   eventSchema  → { type: "object", properties: { type: { type: "string" }, payload: {}, meta: { _optional: true } }, required: ["type", "payload"] }
logger.info(
    { anyType, optionalAny, describedAny, eventSchema },
    "=== Any schemas ===",
);
