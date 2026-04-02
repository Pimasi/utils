import { PreconditionFailed } from "../error";
import type { TSchema, Static, BaseOpts } from "./common";

type RecordOptions = BaseOpts;

type RecordKeySchema = TSchema<string> | TSchema<number>;

type ResolveRecordKey<K extends RecordKeySchema> =
    K extends TSchema<infer KT> ? KT : string;

let STRING_FORMAT_PATTERNS: Record<string, string> = {
    "date-time":
        "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})?$",
    date: "^\\d{4}-\\d{2}-\\d{2}$",
    time: "^\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})?$",
    email: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    uri: "^[a-zA-Z][a-zA-Z0-9+\\-.]*:.+$",
    uuid: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
    ipv4: "^(\\d{1,3}\\.){3}\\d{1,3}$",
    ipv6: "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",
    hostname:
        "^[a-zA-Z0-9]([a-zA-Z0-9\\-]*[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]*[a-zA-Z0-9])?)*$",
};

let NUMBER_PATTERNS = {
    number: "^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$",
    integer: "^-?(?:0|[1-9][0-9]*)$",
} as const;

function resolveKeyPattern(keySchema: any): string {
    let type = keySchema.type;

    if (type === "string") {
        if (keySchema.pattern) return keySchema.pattern;
        if (keySchema.format && STRING_FORMAT_PATTERNS[keySchema.format]) {
            return STRING_FORMAT_PATTERNS[keySchema.format];
        }
        return "^.*$";
    }

    if (type === "number" || type === "integer") {
        return (
            NUMBER_PATTERNS[type as keyof typeof NUMBER_PATTERNS] ??
            NUMBER_PATTERNS.number
        );
    }

    throw PreconditionFailed(
        "Schema.Record: key schema must be Schema.String() or Schema.Number()",
    );
}

/**
 * @description Creates a JSON Schema for a record / dictionary type. The key schema must
 * be either `Schema.String()` or `Schema.Number()`. The output always uses
 * `patternProperties` with the appropriate regex pattern for the key type.
 *
 * @example
 * ```ts
 * // Record<string, number> — patternProperties: { "^.*$": { type: "number" } }
 * Schema.Record(Schema.String(), Schema.Number())
 *
 * // Record<number, string> — patternProperties: { "^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$": { type: "string" } }
 * Schema.Record(Schema.Number(), Schema.String())
 *
 * // String key with pattern — uses the pattern as the record key regex
 * Schema.Record(Schema.String({ pattern: "^[a-z]+$" }), Schema.Any())
 *
 * // String key with format — maps format to a known regex
 * Schema.Record(Schema.String({ format: "email" }), Schema.Any())
 *
 * // Integer key — uses integer-only regex (no decimals)
 * Schema.Record(Schema.Number({ integer: true }), Schema.String())
 * ```
 */
export function Record<K extends RecordKeySchema, V extends TSchema<any>>(
    keySchema: K,
    valueSchema: V,
    options?: RecordOptions,
): TSchema<globalThis.Record<ResolveRecordKey<K>, Static<V>>> {
    let pattern = resolveKeyPattern(keySchema);
    return {
        ...(options ?? {}),
        type: "object",
        patternProperties: { [pattern]: valueSchema },
    } as any;
}
