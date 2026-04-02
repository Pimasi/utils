import type { TSchema, BaseOpts, ResolveUnion } from "./common";
import { buildUnionSchema } from "./common";

type UnionOptions = BaseOpts & {
    discriminator?: { propertyName: string };
};

/**
 * @description Creates a JSON Schema `oneOf` definition, representing a union type where
 * the value must match exactly one of the provided schemas. At the TypeScript level this
 * produces the same union type as AnyOf, but at validation time it enforces that exactly
 * one schema matches (not multiple). Use `Schema.Nullable` and `Schema.Optional` wrappers
 * to control nullability and optionality.
 *
 * @example
 * ```ts
 * Schema.OneOf([Schema.String(), Schema.Number()])              // string | number
 * Schema.OneOf([
 *     Schema.String({ enum: ["active", "inactive"] as const }),
 *     Schema.Number({ enum: [0, 1] as const }),
 * ])
 * // "active" | "inactive" | 0 | 1
 * ```
 */
export function OneOf<const T extends readonly TSchema<any>[]>(
    schemas: [...T],
    options?: UnionOptions,
): TSchema<ResolveUnion<T>> {
    return buildUnionSchema("oneOf", schemas, options);
}
