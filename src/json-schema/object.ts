import type {
    TSchema,
    TOptionalSchema,
    Static,
    Simplify,
    BaseOpts,
} from "./common";

type PropertySchemas = Record<string, TSchema<any> | TOptionalSchema<any>>;

type ObjectOptions = BaseOpts & {
    additionalProperties?: boolean;
};

type RequiredKeys<P extends PropertySchemas> = {
    [K in keyof P]: P[K] extends TOptionalSchema<any> ? never : K;
}[keyof P];

type OptionalKeys<P extends PropertySchemas> = {
    [K in keyof P]: P[K] extends TOptionalSchema<any> ? K : never;
}[keyof P];

type ResolveObjectProperties<P extends PropertySchemas> = {
    [K in RequiredKeys<P>]: Static<P[K]>;
} & {
    [K in OptionalKeys<P>]?: Static<P[K]>;
};

/**
 * @description Creates a JSON Schema for an object type. Properties are defined as a record
 * of key-schema pairs. Properties wrapped in `Schema.Optional()` become optional keys;
 * all others are required. Use `Schema.Nullable`, `Schema.Optional`, and `Schema.Required`
 * wrappers to control nullability and optionality of the object itself.
 *
 * @example
 * ```ts
 * Schema.Object({
 *     name: Schema.String(),
 *     bio: Schema.Optional(Schema.String()),
 * })
 * // { name: string; bio?: string }
 *
 * Schema.Nullable(Schema.Object({ id: Schema.Number() }))
 * // { id: number } | null
 * ```
 */
function _Object<P extends PropertySchemas>(
    properties: P,
    options?: ObjectOptions,
): TSchema<Simplify<ResolveObjectProperties<P>>> {
    let { additionalProperties, ...rest } = options ?? ({} as any);
    let allKeys = globalThis.Object.keys(properties);
    let required: string[] = [];
    let cleanedProperties: any = {};

    for (let key of allKeys) {
        let value = (properties as any)[key];
        if (value == null) {
            cleanedProperties[key] = value;
            continue;
        }
        let { _optional, ...prop } = value;
        cleanedProperties[key] = prop;
        if (!_optional) required.push(key);
    }

    return {
        ...rest,
        type: "object",
        properties: cleanedProperties,
        ...(required.length ? { required } : {}),
        ...(additionalProperties !== undefined ? { additionalProperties } : {}),
    } as any;
}

export { _Object as Object };
