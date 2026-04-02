import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── $schema and $id ─────────────────────────────────────────────────────────

let rootSchema = Schema.Object(
    {
        name: Schema.String(),
        version: Schema.String(),
    },
    {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "https://example.com/config",
        description: "Application configuration",
    },
);
type IRootSchema = Static<typeof rootSchema>;
// { name: string; version: string }

let referenceable = Schema.Object(
    { code: Schema.String() },
    { $id: "https://example.com/code-block" },
);

// Output:
//   rootSchema    → { $schema: "http://json-schema.org/draft-07/schema#", $id: "https://example.com/config", description: "Application configuration", type: "object", properties: { name: { type: "string" }, version: { type: "string" } }, required: ["name", "version"] }
//   referenceable → { $id: "https://example.com/code-block", type: "object", properties: { code: { type: "string" } }, required: ["code"] }
logger.info({ rootSchema, referenceable }, "=== $schema / $id ===");
