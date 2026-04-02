import type { TSchema, BaseOpts } from "./common";

/**
 * @description Creates a JSON Schema `const` definition, restricting the value to an exact
 * literal. The TypeScript type is narrowed to the precise literal type of the provided value.
 *
 * @example
 * ```ts
 * Schema.Const("TR1")                          // "TR1"
 * Schema.Const(42)                             // 42
 * Schema.Const(true)                           // true
 * Schema.Const(null)                           // null
 * Schema.Const("v1", { description: "API version" })
 * ```
 */
export function Const<const V>(value: V, options?: BaseOpts): TSchema<V> {
    return { ...(options ?? {}), const: value } as any;
}
