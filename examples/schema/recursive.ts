import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Recursive ───────────────────────────────────────────────────────────────

type TreeNode = { value: string; children: TreeNode[] };

let treeSchema = Schema.Recursive<TreeNode>("TreeNode", (self) =>
    Schema.Object({
        value: Schema.String(),
        children: Schema.Array(self),
    }),
);
type ITree = Static<typeof treeSchema>; // TreeNode

type LinkedListNode = { data: number; next: LinkedListNode | null };

let linkedListSchema = Schema.Recursive<LinkedListNode>(
    "LinkedListNode",
    (self) =>
        Schema.Object({
            data: Schema.Number(),
            next: Schema.Nullable(Schema.AnyOf([self])),
        }),
);
type ILinkedList = Static<typeof linkedListSchema>; // LinkedListNode

// Output:
//   treeSchema       → { type: "object", properties: { value: { type: "string" }, children: { type: "array", items: { $ref: "TreeNode" } } }, required: ["value", "children"], $id: "TreeNode" }
//   linkedListSchema → { type: "object", properties: { data: { type: "number" }, next: { anyOf: [{ $ref: "LinkedListNode" }, { type: "null" }] } }, required: ["data", "next"], $id: "LinkedListNode" }
logger.info({ treeSchema, linkedListSchema }, "=== Recursive schemas ===");
