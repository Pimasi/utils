import type { TSchema, BaseOpts, ResolveEnum } from "./common";
import { buildPrimitiveSchema } from "./common";

type NumberOptions = BaseOpts & {
    integer?: boolean;
    enum?: readonly number[];
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number | boolean;
    exclusiveMaximum?: number | boolean;
    multipleOf?: number;
    default?: number;
};

/**
 * @description Creates a JSON Schema for a number type. Supports enum constraints to narrow
 * the type to specific literal numeric values. Additional validation options include
 * minimum, maximum, exclusiveMinimum, exclusiveMaximum, and multipleOf. Use `Schema.Nullable`,
 * `Schema.Optional`, and `Schema.Required` wrappers to control nullability and optionality.
 *
 * @example
 * ```ts
 * Schema.Number()                                      // number
 * Schema.Nullable(Schema.Number())                      // number | null
 * Schema.Number({ enum: [1, 2, 3] as const })           // 1 | 2 | 3
 * Schema.Number({ minimum: 0, maximum: 100 })           // number (validated)
 * Schema.Number({ integer: true })                      // integer type
 * Schema.Optional(Schema.Number())                      // marks as optional in parent object
 * ```
 */
function _Number<const Opts extends NumberOptions>(
    options?: Opts,
): TSchema<ResolveEnum<number, Opts extends undefined ? {} : Opts>> {
    let { integer, ...rest } = options ?? ({} as any);
    return buildPrimitiveSchema(integer ? "integer" : "number", rest);
}

export { _Number as Number };
