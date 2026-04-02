import type { TSchema, BaseOpts } from "./common";

/**
 * @description Creates an empty JSON Schema `{}` that accepts any value. The TypeScript
 * type is `any`. Supports standard metadata options (`$id`, `$schema`, `title`,
 * `description`).
 *
 * @example
 * ```ts
 * Schema.Any()                                          // any
 * Schema.Any({ description: "arbitrary metadata" })
 * Schema.Any({ $id: "https://example.com/meta" })
 * ```
 */
export function Any(options?: BaseOpts): TSchema<any> {
    return { ...(options ?? {}) } as any;
}
