import { type Schema as JsonSchema } from "jsonschema";
import { PreconditionFailed } from "../error";

// ─── Branded Schema Type ─────────────────────────────────────────────────────

declare const phantomBrand: unique symbol;
declare const optionalBrand: unique symbol;

export type TSchema<T = unknown> = JsonSchema & {
    readonly [phantomBrand]: T;
};

export type TOptionalSchema<T = unknown> = TSchema<T> & {
    readonly [optionalBrand]: true;
};

// ─── Raw JSON Schema Inference ───────────────────────────────────────────────

type JsonTypeMap = {
    string: string;
    number: number;
    integer: number;
    boolean: boolean;
};

type InferRawUnion<T extends readonly any[]> = T extends readonly [
    infer First,
    ...infer Rest,
]
    ? InferRawSchema<First> | InferRawUnion<Rest>
    : never;

export type InferRawSchema<T> = T extends { readonly const: infer C }
    ? C
    : T extends { readonly enum: readonly (infer E)[] }
      ? E
      : T extends { readonly anyOf: infer A extends readonly any[] }
        ? InferRawUnion<A>
        : T extends { readonly oneOf: infer A extends readonly any[] }
          ? InferRawUnion<A>
          : T extends {
                  readonly type: readonly ["object", "null"];
                  readonly properties: infer P;
              }
            ? InferRawObjectProps<P, T> | null
            : T extends {
                    readonly type: readonly ["array", "null"];
                    readonly items: infer I;
                }
              ? InferRawSchema<I>[] | null
              : T extends {
                      readonly type: readonly [
                          infer Tp extends keyof JsonTypeMap,
                          "null",
                      ];
                  }
                ? JsonTypeMap[Tp] | null
                : T extends {
                        readonly type: "object";
                        readonly properties: infer P;
                    }
                  ? InferRawObjectProps<P, T>
                  : T extends { readonly type: "object" }
                    ? Record<string, any>
                    : T extends {
                            readonly type: "array";
                            readonly items: infer I;
                        }
                      ? InferRawSchema<I>[]
                      : T extends { readonly type: "array" }
                        ? any[]
                        : T extends {
                                readonly type: infer Tp extends
                                    keyof JsonTypeMap;
                            }
                          ? JsonTypeMap[Tp]
                          : any;

type InferRawObjectProps<P, T> = Simplify<
    T extends { readonly required: readonly (infer R extends string)[] }
        ? { [K in Extract<keyof P, R>]: InferRawSchema<P[K]> } & {
              [K in Exclude<keyof P & string, R>]?: InferRawSchema<P[K]>;
          }
        : { [K in keyof P]?: InferRawSchema<P[K]> }
>;

// ─── Static Type Extractor ───────────────────────────────────────────────────

export type Static<T> =
    T extends TOptionalSchema<infer U>
        ? U
        : T extends TSchema<infer U>
          ? U
          : InferRawSchema<T>;

// ─── Shared Options ──────────────────────────────────────────────────────────

type MetaOpts = {
    /** @description A unique URI identifier for this schema, used for `$ref` resolution. */
    $id?: string;
    /** @description Declares which JSON Schema draft this schema conforms to (e.g. `"http://json-schema.org/draft-07/schema#"`). Typically only set on the root schema. */
    $schema?: string;
};

export type BaseOpts = MetaOpts & {
    description?: string;
    title?: string;
};

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type ResolveEnum<Base, Opts> = Opts extends {
    enum: readonly (infer V)[];
}
    ? V
    : Base;

// ─── Union Type Helper ──────────────────────────────────────────────────────

export type ResolveUnion<T extends readonly TSchema<any>[]> =
    T extends readonly [
        infer First extends TSchema<any>,
        ...infer Rest extends TSchema<any>[],
    ]
        ? Static<First> | ResolveUnion<Rest>
        : never;

// ─── Runtime Helpers ─────────────────────────────────────────────────────────

export function buildPrimitiveSchema(typeName: string, options: any): any {
    let { enum: enumValues, ...rest } = options ?? ({} as any);
    return {
        ...rest,
        type: typeName,
        ...(enumValues ? { enum: enumValues } : {}),
    };
}

export function buildUnionSchema(
    key: "anyOf" | "oneOf",
    schemas: any[],
    options: any,
): any {
    return { ...(options ?? {}), [key]: schemas };
}

export function assertObjectSchema(schema: any, method: string): void {
    let type = schema.type;
    let isObject =
        type === "object" ||
        (globalThis.Array.isArray(type) && type.includes("object"));
    if (!isObject) {
        throw PreconditionFailed(
            `Schema.${method}: schema must be of type 'object'`,
        );
    }
}

export function pickFromSchema(
    schema: any,
    keys: string[],
    method: string,
): any {
    assertObjectSchema(schema, method);
    let props = schema.properties ?? {};
    let required: string[] = schema.required ?? [];
    let keySet = new globalThis.Set(keys);
    let picked: any = {};
    for (let key of keys) {
        picked[key] = props[key];
    }
    let newRequired = required.filter((k: string) => keySet.has(k));
    let { properties: _, required: __, ...rest } = schema;
    return {
        ...rest,
        properties: picked,
        ...(newRequired.length ? { required: newRequired } : {}),
    };
}
