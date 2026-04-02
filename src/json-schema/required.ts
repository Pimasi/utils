import type { TSchema, TOptionalSchema } from "./common";

/**
 * @description Strips both nullable and optional from a schema. Reverses the effects of
 * `Schema.Nullable` and `Schema.Optional`. At the type level, `null` is removed from the
 * type union and the schema is no longer marked optional.
 *
 * @example
 * ```ts
 * let nullable = Schema.Nullable(Schema.String());       // string | null
 * Schema.Required(nullable)                              // string
 *
 * let opt = Schema.Optional(Schema.Number());             // optional number
 * Schema.Required(opt)                                   // required number
 *
 * let both = Schema.Optional(Schema.Nullable(Schema.String()));
 * Schema.Required(both)                                  // required string
 * ```
 */
export function Required<T>(
    schema: TSchema<T> | TOptionalSchema<T>,
): TSchema<NonNullable<T>> {
    let s = { ...schema } as any;
    delete s._optional;
    if (s.type) {
        if (globalThis.Array.isArray(s.type)) {
            let types = s.type.filter((t: string) => t !== "null");
            s.type = types.length === 1 ? types[0] : types;
        }
    } else if (s.anyOf) {
        s.anyOf = s.anyOf.filter(
            (item: any) =>
                !(
                    item.type === "null" &&
                    globalThis.Object.keys(item).length === 1
                ),
        );
    } else if (s.oneOf) {
        s.oneOf = s.oneOf.filter(
            (item: any) =>
                !(
                    item.type === "null" &&
                    globalThis.Object.keys(item).length === 1
                ),
        );
    }
    return s;
}
