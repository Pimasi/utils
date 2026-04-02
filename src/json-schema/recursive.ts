import type { TSchema } from "./common";
import { addSchema } from "./validator";

/**
 * @description Creates a recursive (self-referencing) JSON Schema. The first parameter is
 * a `$id` URI that uniquely identifies this schema. The second parameter is a callback
 * that receives a `self` reference (a `$ref` placeholder) and must return the full schema
 * definition. The schema is automatically registered with the validator for `$ref` resolution.
 *
 * The type parameter `T` must be provided explicitly since TypeScript cannot infer
 * recursive types.
 *
 * @example
 * ```ts
 * type TreeNode = { value: string; children: TreeNode[] };
 *
 * const treeSchema = Schema.Recursive<TreeNode>("TreeNode", self =>
 *     Schema.Object({
 *         value: Schema.String(),
 *         children: Schema.Array(self),
 *     }),
 * );
 * ```
 */
export function Recursive<T>(
    $id: string,
    callback: (self: TSchema<T>) => TSchema<T>,
): TSchema<T> {
    let self = { $ref: $id } as any as TSchema<T>;
    let schema = callback(self) as any;
    schema.$id = $id;
    addSchema(schema, $id);
    return schema as TSchema<T>;
}
