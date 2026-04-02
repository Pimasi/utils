import type { TSchema, BaseOpts } from "./common";
import { buildPrimitiveSchema } from "./common";

type BooleanOptions = BaseOpts & {
    default?: boolean;
};

/**
 * @description Creates a JSON Schema for a boolean type. A default value and description
 * can be provided. Use `Schema.Nullable`, `Schema.Optional`, and `Schema.Required` wrappers
 * to control nullability and optionality.
 *
 * @example
 * ```ts
 * Schema.Boolean()                                     // boolean
 * Schema.Nullable(Schema.Boolean())                     // boolean | null
 * Schema.Boolean({ default: false, description: "active flag" })
 * ```
 */
function _Boolean(options?: BooleanOptions): TSchema<boolean> {
    return buildPrimitiveSchema("boolean", options);
}

export { _Boolean as Boolean };
