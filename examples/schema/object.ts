import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Object ──────────────────────────────────────────────────────────────────

let simpleObject = Schema.Object({
    name: Schema.String(),
    age: Schema.Number(),
    active: Schema.Boolean(),
});
type IsimpleObject = Static<typeof simpleObject>;
// { name: string; age: number; active: boolean }

let objectWithOptional = Schema.Object({
    id: Schema.Number(),
    name: Schema.Nullable(Schema.String()),
    bio: Schema.Optional(Schema.String()),
    nickname: Schema.Optional(Schema.String()),
});
type IobjectWithOptional = Static<typeof objectWithOptional>;
// { id: number; name: string; bio?: string; nickname?: string }

let nullableObject = Schema.Nullable(
    Schema.Object({ id: Schema.Number(), label: Schema.String() }),
);
type InullableObject = Static<typeof nullableObject>;
// { id: number; label: string } | null

let nullableObjectWithOptional = Schema.Nullable(
    Schema.Object({
        id: Schema.Number(),
        tag: Schema.Optional(Schema.String()),
    }),
);
type InullableObjectWithOptional = Static<typeof nullableObjectWithOptional>;
// { id: number; tag?: string } | null

let objectWithDescription = Schema.Object(
    { code: Schema.String({ enum: ["A", "B"] as const }) },
    { description: "A coded object", additionalProperties: false },
);
type IobjectWithDescription = Static<typeof objectWithDescription>;
// { code: "A" | "B" }

// ─── Object: optional & nullable (nested) ───────────────────────────────────

let optionalObject = Schema.Optional(Schema.Object({ key: Schema.String() }));
type IoptionalObject = Static<typeof optionalObject>;
// { key: string }

let optionalNullableObject = Schema.Optional(
    Schema.Nullable(
        Schema.Object({
            key: Schema.String(),
            value: Schema.Optional(Schema.Number()),
        }),
    ),
);
type IoptionalNullableObject = Static<typeof optionalNullableObject>;
// { key: string; value?: number } | null

// Output:
//   simpleObject              → { type: "object", properties: { name: { type: "string" }, age: { type: "number" }, active: { type: "boolean" } }, required: ["name", "age", "active"] }
//   objectWithOptional        → { type: "object", properties: { id: { type: "number" }, name: { type: ["string", "null"] }, bio: { type: "string", _optional: true }, nickname: { type: "string", _optional: true } }, required: ["id", "name"] }
//   nullableObject            → { type: ["object", "null"], properties: { id: { type: "number" }, label: { type: "string" } }, required: ["id", "label"] }
//   nullableObjectWithOptional → { type: ["object", "null"], properties: { id: { type: "number" }, tag: { type: "string", _optional: true } }, required: ["id"] }
//   objectWithDescription     → { description: "A coded object", type: "object", properties: { code: { type: "string", enum: ["A", "B"] } }, required: ["code"], additionalProperties: false }
//   optionalObject            → { type: "object", properties: { key: { type: "string" } }, required: ["key"], _optional: true }
//   optionalNullableObject    → { type: ["object", "null"], properties: { key: { type: "string" }, value: { type: "number", _optional: true } }, required: ["key"], _optional: true }
logger.info(
    {
        simpleObject,
        objectWithOptional,
        nullableObject,
        nullableObjectWithOptional,
        objectWithDescription,
        optionalObject,
        optionalNullableObject,
    },
    "=== Object schemas ===",
);

// ─── Nested / Composed ──────────────────────────────────────────────────────

let address = Schema.Object({
    street: Schema.String(),
    city: Schema.String(),
    zip: Schema.String({ pattern: "^\\d{5}$" }),
});

let personSchema = Schema.Object({
    name: Schema.String(),
    age: Schema.Number({ minimum: 0 }),
    email: Schema.Nullable(Schema.String({ format: "email" })),
    address: address,
    tags: Schema.Array(Schema.String(), { uniqueItems: true }),
});
type Iperson = Static<typeof personSchema>;

let company = Schema.Object({
    name: Schema.String(),
    employees: Schema.Array(personSchema),
    hq: address,
    industry: Schema.String({ enum: ["tech", "finance", "health"] as const }),
    notes: Schema.Optional(Schema.Nullable(Schema.String())),
    address: Schema.Object({}),
});
type Icompany = Static<typeof company>;

let nullableArray = Schema.Nullable(
    Schema.Array(Schema.Nullable(Schema.String())),
);
type InullableArray = Static<typeof nullableArray>; // (string | null)[] | null

// ─── Nested optional Array & Object ─────────────────────────────────────────

let nestedOptionals = Schema.Nullable(
    Schema.Object(
        {
            name: Schema.String(),
            aliases: Schema.Optional(Schema.Array(Schema.String())),
            metadata: Schema.Optional(
                Schema.Object({
                    createdAt: Schema.String(),
                    updatedAt: Schema.Optional(Schema.String()),
                }),
            ),
            scores: Schema.Optional(
                Schema.Nullable(Schema.Array(Schema.Number())),
            ),
            backup: Schema.Optional(
                Schema.Nullable(Schema.Object({ url: Schema.String() })),
            ),
        },
        { description: "A complex object with nested optionals" },
    ),
);

type InestedOptionals = Static<typeof nestedOptionals>;

// Output:
//   personSchema    → { type: "object", properties: { name: { type: "string" }, age: { minimum: 0, type: "number" }, email: { format: "email", type: ["string", "null"] }, address: { type: "object", ... }, tags: { uniqueItems: true, type: "array", ... } }, required: ["name", "age", "email", "address", "tags"] }
//   company         → { type: "object", properties: { name: ..., employees: { type: "array", items: "[Reference]" }, hq: "[Reference]", industry: ..., notes: ..., address: ... }, required: [...] }
//   nestedOptionals → { description: "A complex object with nested optionals", type: ["object", "null"], properties: { name: ..., aliases: { ..., _optional: true }, metadata: { ..., _optional: true }, scores: { ..., _optional: true }, backup: { ..., _optional: true } }, required: ["name"] }
logger.info(
    { personSchema, company, nestedOptionals },
    "=== Nested schemas ===",
);

// ─── Validate ────────────────────────────────────────────────────────────────

let validPerson = Schema.validate(
    {
        name: "Rick",
        age: 70,
        email: null,
        address: { street: "123 Portal Rd", city: "C-137", zip: "12345" },
        tags: ["scientist", "genius"],
    },
    personSchema,
);

// Output:
//   validPerson → { name: "Rick", age: 70, email: null, address: { street: "123 Portal Rd", city: "C-137", zip: "12345" }, tags: ["scientist", "genius"] }
logger.info({ validPerson }, "=== Validated person ===");
