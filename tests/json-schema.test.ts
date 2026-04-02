import { describe, it, expect, expectTypeOf } from "vitest";
import { Schema } from "../src/json-schema";
import type { Static } from "../src/json-schema";

describe("JsonSchema", () => {
    it("should be able to validate a schema", () => {
        let schema = Schema.Object({
            name: Schema.String(),
            age: Schema.Number(),
        });

        expect(Schema.validate({ name: "John", age: 30 }, schema)).toEqual({
            name: "John",
            age: 30,
        });

        expect(() =>
            Schema.validate({ name: "John", age: "30" }, schema),
        ).toThrow();
    });

    describe("primitive builders", () => {
        it("String() produces correct schema", () => {
            let schema = Schema.String({ minLength: 1 });
            expect(schema).toEqual({ type: "string", minLength: 1 });
        });

        it("Number() produces correct schema", () => {
            let schema = Schema.Number({ minimum: 0 });
            expect(schema).toEqual({ type: "number", minimum: 0 });
        });

        it("Number({ integer: true }) produces integer type", () => {
            let schema = Schema.Number({ integer: true });
            expect(schema).toEqual({ type: "integer" });
        });

        it("Number({ integer: true }) strips integer from output", () => {
            let schema = Schema.Number({ integer: true, minimum: 0 });
            expect(schema).toEqual({ type: "integer", minimum: 0 });
            expect((schema as any).integer).toBeUndefined();
        });

        it("Boolean() produces correct schema", () => {
            let schema = Schema.Boolean();
            expect(schema).toEqual({ type: "boolean" });
        });
    });

    describe("nullable", () => {
        it("Nullable(String()) produces nullable type", () => {
            let schema = Schema.Nullable(Schema.String());
            expect(schema).toEqual({ type: ["string", "null"] });
        });

        it("Nullable(Number()) produces nullable type", () => {
            let schema = Schema.Nullable(Schema.Number());
            expect(schema).toEqual({ type: ["number", "null"] });
        });

        it("Nullable(Boolean()) produces nullable type", () => {
            let schema = Schema.Nullable(Schema.Boolean());
            expect(schema).toEqual({ type: ["boolean", "null"] });
        });
    });

    describe("enum", () => {
        it("String({ enum }) narrows to enum values", () => {
            let schema = Schema.String({
                enum: ["a", "b", "c"] as const,
            });
            expect(schema).toEqual({
                type: "string",
                enum: ["a", "b", "c"],
            });
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<"a" | "b" | "c">();
        });

        it("Number({ enum }) narrows to enum values", () => {
            let schema = Schema.Number({ enum: [1, 2, 3] as const });
            expect(schema).toEqual({ type: "number", enum: [1, 2, 3] });
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<1 | 2 | 3>();
        });

        it("String({ enum, nullable }) produces enum | null", () => {
            let schema = Schema.Nullable(
                Schema.String({
                    enum: ["x", "y"] as const,
                }),
            );
            expect(schema).toEqual({
                type: ["string", "null"],
                enum: ["x", "y"],
            });
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<"x" | "y" | null>();
        });
    });

    describe("Array builder", () => {
        it("Array(items) produces correct schema", () => {
            let schema = Schema.Array(Schema.String());
            expect(schema).toEqual({
                type: "array",
                items: { type: "string" },
            });
        });

        it("Nullable(Array(items)) is nullable", () => {
            let schema = Schema.Nullable(Schema.Array(Schema.Number()));
            expect(schema).toEqual({
                type: ["array", "null"],
                items: { type: "number" },
            });
        });
    });

    describe("Object builder", () => {
        it("Object(props) makes all keys required", () => {
            let schema = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
            });
            expect(schema).toEqual({
                type: "object",
                properties: {
                    name: { type: "string" },
                    age: { type: "number" },
                },
                required: ["name", "age"],
            });
        });

        it("Object(props) with Optional() excludes keys from required", () => {
            let schema = Schema.Object({
                name: Schema.String(),
                nickname: Schema.Optional(Schema.String()),
            });
            expect(schema).toEqual({
                type: "object",
                properties: {
                    name: { type: "string" },
                    nickname: { type: "string" },
                },
                required: ["name"],
            });
        });

        it("Nullable(Object(props)) is nullable", () => {
            let schema = Schema.Nullable(
                Schema.Object({ id: Schema.Number() }),
            );
            expect(schema).toEqual({
                type: ["object", "null"],
                properties: { id: { type: "number" } },
                required: ["id"],
            });
        });
    });

    describe("Static type inference", () => {
        it("infers correct type for Object with required + optional", () => {
            let schema = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                bio: Schema.Optional(Schema.String()),
            });
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<{
                name: string;
                age: number;
                bio?: string;
            }>();
        });

        it("infers correct type for basic Object", () => {
            let schema = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
            });
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<{
                name: string;
                age: number;
            }>();
        });
    });

    describe("Any builder", () => {
        it("Any() produces empty schema", () => {
            let schema = Schema.Any();
            expect(schema).toEqual({});
        });

        it("Optional(Any()) sets _optional flag", () => {
            let schema = Schema.Optional(Schema.Any());
            expect(schema).toEqual({ _optional: true });
        });

        it("Any({ description }) includes metadata", () => {
            let schema = Schema.Any({ description: "payload" });
            expect(schema).toEqual({ description: "payload" });
        });

        it("infers any type", () => {
            let schema = Schema.Any();
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<any>();
        });

        it("validates any value", () => {
            let schema = Schema.Object({
                data: Schema.Any(),
            });
            expect(Schema.validate({ data: "hello" }, schema)).toEqual({
                data: "hello",
            });
            expect(Schema.validate({ data: 42 }, schema)).toEqual({
                data: 42,
            });
            expect(Schema.validate({ data: null }, schema)).toEqual({
                data: null,
            });
            expect(Schema.validate({ data: { nested: true } }, schema)).toEqual(
                { data: { nested: true } },
            );
        });
    });

    describe("Record builder", () => {
        it("Record(String(), Number()) uses string pattern", () => {
            let schema = Schema.Record(Schema.String(), Schema.Number());
            expect(schema).toEqual({
                type: "object",
                patternProperties: { "^.*$": { type: "number" } },
            });
        });

        it("Record(Number(), String()) uses number pattern", () => {
            let schema = Schema.Record(Schema.Number(), Schema.String());
            expect(schema).toEqual({
                type: "object",
                patternProperties: {
                    "^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$": { type: "string" },
                },
            });
        });

        it("Nullable(Record(...)) produces nullable type", () => {
            let schema = Schema.Nullable(
                Schema.Record(Schema.String(), Schema.Boolean()),
            );
            expect(schema).toEqual({
                type: ["object", "null"],
                patternProperties: { "^.*$": { type: "boolean" } },
            });
        });

        it("Optional(Record(...)) sets _optional flag", () => {
            let schema = Schema.Optional(
                Schema.Record(Schema.String(), Schema.Number()),
            );
            expect((schema as any)._optional).toBe(true);
        });

        it("infers Record<string, T> type", () => {
            let schema = Schema.Record(Schema.String(), Schema.Number());
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<Record<string, number>>();
        });

        it("infers Record<number, T> type", () => {
            let schema = Schema.Record(Schema.Number(), Schema.String());
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<Record<number, string>>();
        });

        it("throws on non-string/number key schema", () => {
            expect(() =>
                // @ts-expect-error — intentionally passing boolean key
                Schema.Record(Schema.Boolean(), Schema.String()),
            ).toThrow(
                "Schema.Record: key schema must be Schema.String() or Schema.Number()",
            );
        });

        it("validates record values", () => {
            let schema = Schema.Record(Schema.String(), Schema.Number());
            expect(Schema.validate({ a: 1, b: 2 }, schema)).toEqual({
                a: 1,
                b: 2,
            });
            expect(() =>
                Schema.validate({ a: "not a number" }, schema),
            ).toThrow();
        });

        it("Record with String({ pattern }) uses custom pattern", () => {
            let schema = Schema.Record(
                Schema.String({ pattern: "^[a-z]+$" }),
                Schema.Number(),
            );
            expect(schema).toEqual({
                type: "object",
                patternProperties: { "^[a-z]+$": { type: "number" } },
            });
        });

        it("Record with String({ format: 'email' }) uses email pattern", () => {
            let schema = Schema.Record(
                Schema.String({ format: "email" }),
                Schema.Any(),
            );
            expect(schema).toEqual({
                type: "object",
                patternProperties: {
                    "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$": {},
                },
            });
        });

        it("Record with String({ format: 'uuid' }) uses uuid pattern", () => {
            let schema = Schema.Record(
                Schema.String({ format: "uuid" }),
                Schema.Boolean(),
            );
            expect(schema).toEqual({
                type: "object",
                patternProperties: {
                    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$":
                        { type: "boolean" },
                },
            });
        });

        it("Record with String({ format: 'date-time' }) uses date-time pattern", () => {
            let schema = Schema.Record(
                Schema.String({ format: "date-time" }),
                Schema.String(),
            );
            let keys = globalThis.Object.keys(
                (schema as any).patternProperties,
            );
            expect(keys[0]).toMatch(/^\^\\d/);
        });

        it("Record with String({ unknown format }) falls back to default", () => {
            let schema = Schema.Record(
                Schema.String({ format: "custom-thing" }),
                Schema.Number(),
            );
            expect(schema).toEqual({
                type: "object",
                patternProperties: { "^.*$": { type: "number" } },
            });
        });

        it("Record with String({ pattern }) takes priority over format", () => {
            let schema = Schema.Record(
                Schema.String({ pattern: "^abc$", format: "email" }),
                Schema.Number(),
            );
            expect(schema).toEqual({
                type: "object",
                patternProperties: { "^abc$": { type: "number" } },
            });
        });

        it("Record with Number({ integer: true }) uses integer pattern", () => {
            let schema = Schema.Record(
                Schema.Number({ integer: true }),
                Schema.String(),
            );
            expect(schema).toEqual({
                type: "object",
                patternProperties: {
                    "^-?(?:0|[1-9][0-9]*)$": { type: "string" },
                },
            });
        });
    });

    describe("Pick builder", () => {
        it("picks specified keys from object schema", () => {
            let user = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                email: Schema.String(),
            });
            let picked = Schema.Pick(user, ["name", "email"]);
            expect(picked).toEqual({
                type: "object",
                properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                },
                required: ["name", "email"],
            });
        });

        it("preserves optional status of picked keys", () => {
            let user = Schema.Object({
                name: Schema.String(),
                bio: Schema.Optional(Schema.String()),
            });
            let picked = Schema.Pick(user, ["name", "bio"]);
            expect(picked).toEqual({
                type: "object",
                properties: {
                    name: { type: "string" },
                    bio: { type: "string" },
                },
                required: ["name"],
            });
        });

        it("infers picked type", () => {
            let user = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                email: Schema.String(),
            });
            let picked = Schema.Pick(user, ["name", "age"]);
            type Result = Static<typeof picked>;
            expectTypeOf<Result>().toEqualTypeOf<{
                name: string;
                age: number;
            }>();
        });

        it("throws on non-object schema", () => {
            let schema = Schema.String() as any;
            expect(() => Schema.Pick(schema, ["foo"])).toThrow(
                "Schema.Pick: schema must be of type 'object'",
            );
        });

        it("validates picked schema", () => {
            let user = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                email: Schema.String(),
            });
            let nameOnly = Schema.Pick(user, ["name"]);
            expect(Schema.validate({ name: "John" }, nameOnly)).toEqual({
                name: "John",
            });
        });
    });

    describe("Omit builder", () => {
        it("omits specified keys from object schema", () => {
            let user = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                email: Schema.String(),
            });
            let omitted = Schema.Omit(user, ["email"]);
            expect(omitted).toEqual({
                type: "object",
                properties: {
                    name: { type: "string" },
                    age: { type: "number" },
                },
                required: ["name", "age"],
            });
        });

        it("preserves optional status of remaining keys", () => {
            let user = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                bio: Schema.Optional(Schema.String()),
            });
            let omitted = Schema.Omit(user, ["age"]);
            expect(omitted).toEqual({
                type: "object",
                properties: {
                    name: { type: "string" },
                    bio: { type: "string" },
                },
                required: ["name"],
            });
        });

        it("infers omitted type", () => {
            let user = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                email: Schema.String(),
            });
            let omitted = Schema.Omit(user, ["email", "age"]);
            type Result = Static<typeof omitted>;
            expectTypeOf<Result>().toEqualTypeOf<{ name: string }>();
        });

        it("throws on non-object schema", () => {
            let schema = Schema.Number() as any;
            expect(() => Schema.Omit(schema, ["foo"])).toThrow(
                "Schema.Omit: schema must be of type 'object'",
            );
        });

        it("validates omitted schema", () => {
            let user = Schema.Object({
                name: Schema.String(),
                age: Schema.Number(),
                email: Schema.String(),
            });
            let withoutEmail = Schema.Omit(user, ["email"]);
            expect(
                Schema.validate({ name: "John", age: 30 }, withoutEmail),
            ).toEqual({ name: "John", age: 30 });
        });
    });

    describe("Nullable wrapper", () => {
        it("adds null to type array for primitives", () => {
            expect(Schema.Nullable(Schema.String())).toEqual({
                type: ["string", "null"],
            });
            expect(Schema.Nullable(Schema.Number())).toEqual({
                type: ["number", "null"],
            });
        });

        it("adds null to type array for object", () => {
            let schema = Schema.Nullable(
                Schema.Object({ id: Schema.Number() }),
            );
            expect(schema).toEqual({
                type: ["object", "null"],
                properties: { id: { type: "number" } },
                required: ["id"],
            });
        });

        it("adds null to anyOf for union schemas", () => {
            let schema = Schema.Nullable(
                Schema.AnyOf([Schema.String(), Schema.Number()]),
            );
            expect(schema).toEqual({
                anyOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "null" },
                ],
            });
        });

        it("preserves optional when wrapping", () => {
            let schema = Schema.Nullable(Schema.Optional(Schema.String()));
            expect((schema as any)._optional).toBe(true);
            expect(schema).toEqual({
                type: ["string", "null"],
                _optional: true,
            });
        });

        it("infers T | null type", () => {
            let schema = Schema.Nullable(Schema.String());
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<string | null>();
        });

        it("validates null for nullable schema", () => {
            let schema = Schema.Object({
                name: Schema.Nullable(Schema.String()),
            });
            expect(Schema.validate({ name: null }, schema)).toEqual({
                name: null,
            });
            expect(Schema.validate({ name: "hello" }, schema)).toEqual({
                name: "hello",
            });
        });
    });

    describe("Optional wrapper", () => {
        it("sets _optional flag", () => {
            expect((Schema.Optional(Schema.String()) as any)._optional).toBe(
                true,
            );
        });

        it("makes property optional in parent object", () => {
            let schema = Schema.Object({
                name: Schema.String(),
                bio: Schema.Optional(Schema.String()),
            });
            expect(Schema.validate({ name: "John" }, schema)).toEqual({
                name: "John",
            });
        });

        it("infers optional type in object", () => {
            let schema = Schema.Object({
                name: Schema.String(),
                bio: Schema.Optional(Schema.String()),
            });
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<{
                name: string;
                bio?: string;
            }>();
        });

        it("composes with Nullable", () => {
            let schema = Schema.Object({
                age: Schema.Optional(Schema.Nullable(Schema.Number())),
            });
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<{
                age?: number | null;
            }>();
        });
    });

    describe("Required wrapper", () => {
        it("strips null from type array", () => {
            let schema = Schema.Required(Schema.Nullable(Schema.String()));
            expect(schema).toEqual({ type: "string" });
        });

        it("strips _optional flag", () => {
            let schema = Schema.Required(Schema.Optional(Schema.Number()));
            expect((schema as any)._optional).toBeUndefined();
            expect(schema).toEqual({ type: "number" });
        });

        it("strips both nullable and optional", () => {
            let schema = Schema.Required(
                Schema.Optional(Schema.Nullable(Schema.String())),
            );
            expect(schema).toEqual({ type: "string" });
            expect((schema as any)._optional).toBeUndefined();
        });

        it("strips null from anyOf unions", () => {
            let schema = Schema.Required(
                Schema.Nullable(
                    Schema.AnyOf([Schema.String(), Schema.Number()]),
                ),
            );
            expect(schema).toEqual({
                anyOf: [{ type: "string" }, { type: "number" }],
            });
        });

        it("infers NonNullable<T> type", () => {
            let schema = Schema.Required(Schema.Nullable(Schema.String()));
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<string>();
        });

        it("infers non-optional type from Optional + Nullable", () => {
            let schema = Schema.Required(
                Schema.Optional(Schema.Nullable(Schema.Number())),
            );
            type Result = Static<typeof schema>;
            expectTypeOf<Result>().toEqualTypeOf<number>();
        });
    });
});
