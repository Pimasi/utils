import type { TSchema, Static, Simplify } from "./common";
import { pickFromSchema } from "./common";

type ObjectTSchema = TSchema<Record<string, any>>;

/**
 * @description Creates a new object schema excluding the specified keys from the source
 * schema. The source must be an object schema — a runtime error is thrown otherwise.
 * Keys are type-checked against the source schema's properties.
 *
 * @example
 * ```ts
 * let user = Schema.Object({ name: Schema.String(), age: Schema.Number(), email: Schema.String() });
 * let withoutEmail = Schema.Omit(user, ["email"]);
 * // { name: string; age: number }
 *
 * Schema.Omit(user, ["foo"]); // type error: "foo" does not exist
 * ```
 */
export function Omit<
    S extends ObjectTSchema,
    K extends (keyof Static<S> & string)[],
>(
    schema: S,
    keys: [...K],
): TSchema<Simplify<globalThis.Omit<Static<S>, K[number]>>> {
    let allKeys = globalThis.Object.keys((schema as any).properties ?? {});
    let remaining = allKeys.filter((k) => !keys.includes(k as any));
    return pickFromSchema(schema, remaining, "Omit");
}
