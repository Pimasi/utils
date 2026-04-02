import type { TSchema, BaseOpts } from "./common";

type ArrayOptions = BaseOpts & {
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
};

/**
 * @description Creates a JSON Schema for an array type. The first parameter defines the
 * schema for each item in the array. Validation options include minItems, maxItems, and
 * uniqueItems. Use `Schema.Nullable`, `Schema.Optional`, and `Schema.Required` wrappers
 * to control nullability and optionality.
 *
 * @example
 * ```ts
 * Schema.Array(Schema.String())                                // string[]
 * Schema.Nullable(Schema.Array(Schema.Number()))                // number[] | null
 * Schema.Array(Schema.Nullable(Schema.String()))                // (string | null)[]
 * Schema.Array(Schema.String(), { minItems: 1, uniqueItems: true })
 * ```
 */
function _Array<T>(items: TSchema<T>, options?: ArrayOptions): TSchema<T[]> {
    return { ...(options ?? {}), type: "array", items } as any;
}

export { _Array as Array };
