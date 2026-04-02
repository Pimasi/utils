import type { TSchema, TOptionalSchema } from "./common";

/**
 * @description Wraps any schema to allow `null` as a valid value. At the type level, the
 * phantom type becomes `T | null`. At the JSON Schema level, `"null"` is appended to the
 * `type` array (or to `anyOf`/`oneOf` for union schemas).
 *
 * @example
 * ```ts
 * Schema.Nullable(Schema.String())                      // string | null
 * Schema.Nullable(Schema.Number())                      // number | null
 * Schema.Nullable(Schema.Object({ id: Schema.Number() }))
 * // { id: number } | null
 * ```
 */
export function Nullable<T>(
    schema: TOptionalSchema<T>,
): TOptionalSchema<T | null>;
export function Nullable<T>(schema: TSchema<T>): TSchema<T | null>;
export function Nullable(schema: any): any {
    let s = { ...schema };
    if (s.type) {
        let types = globalThis.Array.isArray(s.type) ? s.type : [s.type];
        if (!types.includes("null")) s.type = [...types, "null"];
    } else if (s.anyOf) {
        s.anyOf = [...s.anyOf, { type: "null" }];
    } else if (s.oneOf) {
        s.oneOf = [...s.oneOf, { type: "null" }];
    } else {
        s = { anyOf: [schema, { type: "null" }] };
        if (schema._optional) s._optional = true;
    }
    return s;
}
