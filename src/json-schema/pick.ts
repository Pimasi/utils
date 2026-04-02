import type { TSchema, Static, Simplify } from "./common";
import { pickFromSchema } from "./common";

type ObjectTSchema = TSchema<Record<string, any>>;

/**
 * @description Creates a new object schema containing only the specified keys from the
 * source schema. The source must be an object schema — a runtime error is thrown otherwise.
 * Keys are type-checked against the source schema's properties.
 *
 * @example
 * ```ts
 * let user = Schema.Object({ name: Schema.String(), age: Schema.Number(), email: Schema.String() });
 * let nameOnly = Schema.Pick(user, ["name"]);
 * // { name: string }
 *
 * Schema.Pick(user, ["foo"]); // type error: "foo" does not exist
 * ```
 */
export function Pick<
    S extends ObjectTSchema,
    K extends (keyof Static<S> & string)[],
>(
    schema: S,
    keys: [...K],
): TSchema<Simplify<globalThis.Pick<Static<S>, K[number]>>> {
    return pickFromSchema(schema, keys, "Pick");
}
