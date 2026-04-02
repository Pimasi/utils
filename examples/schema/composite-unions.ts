import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Composite with OneOf / AnyOf ────────────────────────────────────────────

// shared union branch schemas
let byPostcode = Schema.Object({
    postcode: Schema.String(),
    lat: Schema.Optional(Schema.Number()),
    lon: Schema.Optional(Schema.Number()),
});

let byLatLon = Schema.Object({
    postcode: Schema.Optional(Schema.String()),
    lat: Schema.Number(),
    lon: Schema.Number(),
});

// 1) object + oneOf — base props distributed into each branch
let searchRequest = Schema.Composite([
    Schema.Object({
        bedrooms: Schema.Number(),
        property_type: Schema.String({ enum: ["house", "flat"] as const }),
    }),
    Schema.OneOf([byPostcode, byLatLon]),
]);
type ISearchRequest = Static<typeof searchRequest>;
// { bedrooms: number; property_type: "house" | "flat" }
//   & ({ postcode: string; lat?: number; lon?: number }
//      | { postcode?: string; lat: number; lon: number })
logger.info({ searchRequest }, "1) object + oneOf");

// 2) object + anyOf — same distribution, anyOf semantics
let withAnyOf = Schema.Composite([
    Schema.Object({ id: Schema.Number() }),
    Schema.AnyOf([
        Schema.Object({ email: Schema.String() }),
        Schema.Object({ phone: Schema.String() }),
    ]),
]);
type IWithAnyOf = Static<typeof withAnyOf>;
// { id: number } & ({ email: string } | { phone: string })
logger.info({ withAnyOf }, "2) object + anyOf");

// 3) oneOf only — no base object, passes through as oneOf
let locationLookup = Schema.Composite([Schema.OneOf([byPostcode, byLatLon])]);
type ILocationLookup = Static<typeof locationLookup>;
// { postcode: string; lat?: number; lon?: number }
//   | { postcode?: string; lat: number; lon: number }
logger.info({ locationLookup }, "3) oneOf only");

// 4) anyOf only — no base object, passes through as anyOf
let contactInfo = Schema.Composite([
    Schema.AnyOf([
        Schema.Object({ email: Schema.String() }),
        Schema.Object({ phone: Schema.String() }),
    ]),
]);
type IContactInfo = Static<typeof contactInfo>;
// { email: string } | { phone: string }
logger.info({ contactInfo }, "4) anyOf only");

// 5) multiple objects + oneOf — all flat objects merged, then distributed
let multiObjOneOf = Schema.Composite([
    Schema.Object({ id: Schema.Number() }),
    Schema.Object({ createdAt: Schema.String() }),
    Schema.OneOf([
        Schema.Object({ status: Schema.String({ enum: ["active"] as const }) }),
        Schema.Object({
            status: Schema.String({ enum: ["archived"] as const }),
            archivedAt: Schema.String(),
        }),
    ]),
]);
type IMultiObjOneOf = Static<typeof multiObjOneOf>;
// { id: number; createdAt: string }
//   & ({ status: "active" } | { status: "archived"; archivedAt: string })
logger.info({ multiObjOneOf }, "5) multiple objects + oneOf");

// 6) object + oneOf + anyOf — multiple unions use allOf
let multiUnion = Schema.Composite([
    Schema.Object({ id: Schema.Number() }),
    Schema.OneOf([
        Schema.Object({ role: Schema.String({ enum: ["admin"] as const }) }),
        Schema.Object({ role: Schema.String({ enum: ["user"] as const }) }),
    ]),
    Schema.AnyOf([
        Schema.Object({ email: Schema.String() }),
        Schema.Object({ phone: Schema.String() }),
    ]),
]);
type IMultiUnion = Static<typeof multiUnion>;
// { id: number }
//   & ({ role: "admin" } | { role: "user" })
//   & ({ email: string } | { phone: string })
logger.info({ multiUnion }, "6) object + oneOf + anyOf");

// 7) oneOf + anyOf — multiple unions, no base object
let unionOnly = Schema.Composite([
    Schema.OneOf([
        Schema.Object({ kind: Schema.String({ enum: ["a"] as const }) }),
        Schema.Object({ kind: Schema.String({ enum: ["b"] as const }) }),
    ]),
    Schema.AnyOf([
        Schema.Object({ x: Schema.Number() }),
        Schema.Object({ y: Schema.Number() }),
    ]),
]);
type IUnionOnly = Static<typeof unionOnly>;
// ({ kind: "a" } | { kind: "b" }) & ({ x: number } | { y: number })
logger.info({ unionOnly }, "7) oneOf + anyOf");

// 8) nullable object + oneOf — nullable props get | null, then distributed
let nullableOneOf = Schema.Composite([
    Schema.Nullable(
        Schema.Object({
            tenant: Schema.String(),
        }),
    ),
    Schema.OneOf([byPostcode, byLatLon]),
]);
type INullableOneOf = Static<typeof nullableOneOf>;
// { tenant: string | null }
//   & ({ postcode: string; lat?: number; lon?: number }
//      | { postcode?: string; lat: number; lon: number })
logger.info({ nullableOneOf }, "8) nullable object + oneOf");
