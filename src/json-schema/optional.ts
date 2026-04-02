import type { TSchema, TOptionalSchema } from "./common";

/**
 * @description Marks a schema as optional inside a `Schema.Object`. The wrapped property
 * will be excluded from the parent object's `required` array. The value type itself is
 * unchanged — `Schema.Optional(Schema.String())` is still `string`, because `undefined`
 * is not a valid JSON Schema value type. This wrapper is only meaningful as a direct
 * property value of `Schema.Object()`.
 *
 * @example
 * ```ts
 * Schema.Object({
 *     name: Schema.String(),                            // required
 *     bio: Schema.Optional(Schema.String()),             // optional, still string
 *     age: Schema.Optional(Schema.Nullable(Schema.Number())), // optional, number | null
 * })
 * // { name: string; bio?: string; age?: number | null }
 * ```
 */
export function Optional<T>(schema: TSchema<T>): TOptionalSchema<T> {
    let s = { ...schema } as any;
    s._optional = true;
    return s;
}
