import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Pick / Omit ─────────────────────────────────────────────────────────────

let fullUser = Schema.Object({
    name: Schema.String(),
    age: Schema.Number(),
    email: Schema.String(),
    bio: Schema.Optional(Schema.String()),
});

// Pick — keep only selected keys
let nameAndEmail = Schema.Pick(fullUser, ["name", "email"]);
type INameAndEmail = Static<typeof nameAndEmail>; // { name: string; email: string }

let justName = Schema.Pick(fullUser, ["name"]);
type IJustName = Static<typeof justName>; // { name: string }

// Pick preserves optional
let withOptional = Schema.Pick(fullUser, ["name", "bio"]);
type IWithOptional = Static<typeof withOptional>; // { name: string; bio?: string }

// Omit — remove selected keys
let withoutEmail = Schema.Omit(fullUser, ["email"]);
type IWithoutEmail = Static<typeof withoutEmail>;
// { name: string; age: number; bio?: string }

let withoutAgeAndBio = Schema.Omit(fullUser, ["age", "bio"]);
type IWithoutAgeAndBio = Static<typeof withoutAgeAndBio>;
// { name: string; email: string }

// Pick/Omit result can be used in Composite
let extra = Schema.Object({ role: Schema.String() });
let composedPick = Schema.Composite([Schema.Pick(fullUser, ["name"]), extra]);
type IComposedPick = Static<typeof composedPick>; // { name: string; role: string }

// Uncomment to see type error — "foo" does not exist:
// Schema.Pick(fullUser, ["foo"]);
// Schema.Omit(fullUser, ["foo"]);

// Output:
//   nameAndEmail     → { type: "object", properties: { name: { type: "string" }, email: { type: "string" } }, required: ["name", "email"] }
//   justName         → { type: "object", properties: { name: "[Reference]" }, required: ["name"] }
//   withOptional     → { type: "object", properties: { name: "[Reference]", bio: { type: "string", _optional: true } }, required: ["name"] }
//   withoutEmail     → { type: "object", properties: { name: "[Reference]", age: { type: "number" }, bio: "[Reference]" }, required: ["name", "age"] }
//   withoutAgeAndBio → { type: "object", properties: { name: "[Reference]", email: "[Reference]" }, required: ["name", "email"] }
//   composedPick     → { type: "object", properties: { name: "[Reference]", role: { type: "string" } }, required: ["name", "role"] }
logger.info(
    {
        nameAndEmail,
        justName,
        withOptional,
        withoutEmail,
        withoutAgeAndBio,
        composedPick,
    },
    "=== Pick / Omit schemas ===",
);

// ─── Pick on Schema.From ─────────────────────────────────────────────────────

const fromForPick = Schema.From({
    type: "object",
    properties: {
        foo: { type: "string" },
        bar: { type: ["number", "null"] },
        baz: { type: "array", items: {} },
    },
    required: ["bar", "baz"],
});
type IFromForPick = Static<typeof fromForPick>;

const pickedFromSchema = Schema.Pick(fromForPick, ["baz"]);

// Output:
//   fromForPick      → { type: "object", properties: { foo: { type: "string" }, bar: { type: ["number", "null"] }, baz: { type: "array", items: {} } }, required: ["bar", "baz"] }
//   pickedFromSchema → { type: "object", properties: { baz: "[Reference]" }, required: ["baz"] }
logger.info({ fromForPick, pickedFromSchema }, "=== Pick on Schema.From ===");
