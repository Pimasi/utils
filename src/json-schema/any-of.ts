import type { TSchema, BaseOpts, ResolveUnion } from "./common";
import { buildUnionSchema } from "./common";

type UnionOptions = BaseOpts & {
    discriminator?: { propertyName: string };
};

/**
 * @description Creates a JSON Schema `anyOf` definition, representing a union type where
 * the value must match at least one of the provided schemas. At the TypeScript level this
 * produces a union of all schema types. Use `Schema.Nullable` and `Schema.Optional`
 * wrappers to control nullability and optionality.
 *
 * @example
 * ```ts
 * Schema.AnyOf([Schema.String(), Schema.Number()])              // string | number
 * Schema.Nullable(Schema.AnyOf([Schema.String(), Schema.Number()]))
 * // string | number | null
 * ```
 */
export function AnyOf<const T extends readonly TSchema<any>[]>(
    schemas: [...T],
    options?: UnionOptions,
): TSchema<ResolveUnion<T>> {
    return buildUnionSchema("anyOf", schemas, options);
}
