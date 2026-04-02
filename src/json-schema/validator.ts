import jsonschema, { Schema } from "jsonschema";
import { ValidationFailed } from "../error";
import type { TSchema, Static } from "./common";

const validator = new jsonschema.Validator();

/**
 * @description Registers a schema with the validator for `$ref` resolution. Schemas added
 * here can be referenced by their `$id` in other schemas using `{ $ref: "<$id>" }`.
 * This is called automatically by `Schema.Recursive`.
 */
export function addSchema(schema: any, uri: string): void {
    validator.addSchema(schema, uri);
}

/**
 * @description Returns the object if it's valid, Throws an exception if there are validation errors
 */
export function validate<T extends TSchema | Schema>(
    val: any,
    schema: T,
): T extends TSchema ? Static<T> : any {
    let result = validator.validate(val, schema);

    if (!result.errors.length) return val;

    throw ValidationFailed(result.errors, "JsonSchema Validation Failed");
}
