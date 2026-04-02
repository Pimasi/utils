import { PreconditionFailed } from "../error";
import type { TSchema, Static, Simplify, BaseOpts } from "./common";

type ObjectOptions = BaseOpts & {
    additionalProperties?: boolean;
};

type NullifyValues<T> = { [K in keyof T]: T[K] | null };

type MergeSchemaEntry<S> =
    null extends Static<S>
        ? NullifyValues<Exclude<Static<S>, null>>
        : Static<S>;

type MergeSchemas<T extends readonly any[]> = T extends readonly [
    infer First,
    ...infer Rest,
]
    ? MergeSchemaEntry<First> & MergeSchemas<Rest>
    : {};

/**
 * @description Merges multiple object schemas into a single object schema. Accepts plain
 * object schemas as well as `Schema.OneOf` / `Schema.AnyOf` unions whose members are all
 * objects. Plain object properties are merged into one flat object. Union schemas are
 * preserved and combined using JSON Schema `allOf`. If a source schema is nullable, its
 * properties become nullable (`T | null`) in the merged result since the source object
 * could be null. Use `Schema.Nullable`, `Schema.Optional`, and `Schema.Required` wrappers
 * to control the merged schema itself.
 *
 * @example
 * ```ts
 * let user = Schema.Object({ name: Schema.String() });
 * let profile = Schema.Object({ bio: Schema.Optional(Schema.String()) });
 * let full = Schema.Composite([user, profile]);
 * // { name: string; bio?: string }
 *
 * let address = Schema.Nullable(Schema.Object({ city: Schema.String() }));
 * let merged = Schema.Composite([user, address]);
 * // { name: string; city: string | null }
 *
 * // OneOf / AnyOf unions are preserved and combined via allOf:
 * let byPostcode = Schema.Object({ postcode: Schema.String() });
 * let byLatLon = Schema.Object({ lat: Schema.Number(), lon: Schema.Number() });
 * let search = Schema.Composite([user, Schema.OneOf([byPostcode, byLatLon])]);
 * // { name: string } & ({ postcode: string } | { lat: number; lon: number })
 * ```
 */
export function Composite<const T extends readonly TSchema<any>[]>(
    schemas: [...T],
    options?: ObjectOptions,
): TSchema<Simplify<MergeSchemas<T>>> {
    let mergedProperties: any = {};
    let mergedRequired: string[] = [];
    let allOfEntries: any[] = [];

    for (let schema of schemas) {
        let s = schema as any;

        // Handle oneOf / anyOf union schemas
        if (s.oneOf || s.anyOf) {
            let unionKey: "oneOf" | "anyOf" = s.oneOf ? "oneOf" : "anyOf";
            let members: any[] = s[unionKey];

            for (let member of members) {
                let mType = member.type;
                let mIsObject =
                    mType === "object" ||
                    (globalThis.Array.isArray(mType) &&
                        mType.includes("object"));
                if (!mIsObject) {
                    throw PreconditionFailed(
                        "Schema.Composite: all schemas in a union must be of type 'object'",
                    );
                }
            }

            allOfEntries.push(s);
            continue;
        }

        let type = s.type;
        let isObject =
            type === "object" ||
            (globalThis.Array.isArray(type) && type.includes("object"));

        if (!isObject) {
            throw PreconditionFailed(
                "Schema.Composite: all schemas must be of type 'object'",
            );
        }

        let props = s.properties ?? {};
        let required: string[] = s.required ?? [];
        let isNullable =
            globalThis.Array.isArray(type) && type.includes("null");

        for (let key of globalThis.Object.keys(props)) {
            if (isNullable) {
                let prop = props[key];
                let propType = prop?.type;
                if (propType) {
                    let types = globalThis.Array.isArray(propType)
                        ? propType
                        : [propType];
                    if (!types.includes("null")) types = [...types, "null"];
                    mergedProperties[key] = { ...prop, type: types };
                } else {
                    mergedProperties[key] = prop;
                }
            } else {
                mergedProperties[key] = props[key];
            }
        }

        mergedRequired.push(...required);
    }

    let uniqueRequired = [...new globalThis.Set(mergedRequired)];
    let { additionalProperties, ...rest } = options ?? ({} as any);

    let apOpt =
        additionalProperties !== undefined ? { additionalProperties } : {};

    // No unions — flat merged object
    if (allOfEntries.length === 0) {
        return {
            ...rest,
            type: "object",
            properties: mergedProperties,
            ...(uniqueRequired.length ? { required: uniqueRequired } : {}),
            ...apOpt,
        } as any;
    }

    // Single union — distribute merged base properties into each branch
    if (allOfEntries.length === 1) {
        let union = allOfEntries[0];
        let unionKey: "oneOf" | "anyOf" = union.oneOf ? "oneOf" : "anyOf";
        let branches: any[] = union[unionKey];
        let { [unionKey]: _, ...unionOpts } = union;

        let hasBaseProps = globalThis.Object.keys(mergedProperties).length > 0;
        let distributed = branches.map((branch: any) => {
            let branchProps = branch.properties ?? {};
            let branchRequired: string[] = branch.required ?? [];
            let combinedRequired =
                uniqueRequired.length && branchRequired.length
                    ? [
                          ...new globalThis.Set([
                              ...uniqueRequired,
                              ...branchRequired,
                          ]),
                      ]
                    : uniqueRequired.length
                      ? uniqueRequired
                      : branchRequired;
            let { properties: __, required: ___, ...branchRest } = branch;
            return {
                ...branchRest,
                properties: hasBaseProps
                    ? { ...mergedProperties, ...branchProps }
                    : branchProps,
                ...(combinedRequired.length
                    ? { required: combinedRequired }
                    : {}),
                ...apOpt,
            };
        });

        return { ...rest, ...unionOpts, [unionKey]: distributed } as any;
    }

    // Multiple unions — use allOf with a base object entry
    let hasBase =
        globalThis.Object.keys(mergedProperties).length ||
        uniqueRequired.length;
    let baseEntry = {
        type: "object",
        properties: mergedProperties,
        ...(uniqueRequired.length ? { required: uniqueRequired } : {}),
        ...apOpt,
    };

    return {
        ...rest,
        allOf: [...(hasBase ? [baseEntry] : []), ...allOfEntries],
        ...apOpt,
    } as any;
}
