import type { TSchema, BaseOpts, ResolveEnum } from "./common";
import { buildPrimitiveSchema } from "./common";

type StringOptions = BaseOpts & {
    enum?: readonly string[];
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    default?: string;
};

/**
 * @description Creates a JSON Schema for a string type. Supports enum constraints to narrow
 * the type to specific literal values. Additional validation options include minLength,
 * maxLength, pattern (regex), and format (e.g. "email", "uri"). Use `Schema.Nullable`,
 * `Schema.Optional`, and `Schema.Required` wrappers to control nullability and optionality.
 *
 * @example
 * ```ts
 * Schema.String()                                      // string
 * Schema.Nullable(Schema.String())                      // string | null
 * Schema.String({ enum: ["a", "b"] as const })          // "a" | "b"
 * Schema.String({ minLength: 1, format: "email" })      // string (validated)
 * Schema.Optional(Schema.String())                      // marks as optional in parent object
 * ```
 */
function _String<const Opts extends StringOptions>(
    options?: Opts,
): TSchema<ResolveEnum<string, Opts extends undefined ? {} : Opts>> {
    return buildPrimitiveSchema("string", options);
}

export { _String as String };
