import type { TSchema, InferRawSchema } from "./common";

/**
 * @description Converts a plain JSON Schema object into a branded `TSchema<T>`, inferring
 * the TypeScript type from the schema structure. Uses a `const` generic parameter so
 * literal types are preserved without needing `as const` at the call site. This is useful
 * for working with schemas defined as plain objects or imported from JSON files.
 *
 * @example
 * ```ts
 * const schema = Schema.From({
 *     type: "object",
 *     properties: {
 *         name: { type: "string" },
 *         age: { type: "number" },
 *     },
 *     required: ["name", "age"],
 * });
 * type T = Static<typeof schema>; // { name: string; age: number }
 *
 * // Works with JSON imports:
 * import raw from "./schema.json";
 * const s = Schema.From(raw);
 * ```
 */
export function From<const T>(schema: T): TSchema<InferRawSchema<T>> {
    return schema as any;
}
