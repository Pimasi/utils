export { type Schema as JsonSchema } from "jsonschema";
export type * from "./common";
import { Const } from "./const";
import { String } from "./string";
import { Number } from "./number";
import { Boolean } from "./boolean";
import { Array } from "./array";
import { Object } from "./object";
import { Pick } from "./pick";
import { Omit } from "./omit";
import { Composite } from "./composite";
import { AnyOf } from "./any-of";
import { OneOf } from "./one-of";
import { Recursive } from "./recursive";
import { Any } from "./any";
import { Record } from "./record";
import { Nullable } from "./nullable";
import { Optional } from "./optional";
import { Required } from "./required";
import { From } from "./from";
import { validate } from "./validator";

export const Schema = {
    Const,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Pick,
    Omit,
    Composite,
    AnyOf,
    OneOf,
    Recursive,
    Any,
    Record,
    Nullable,
    Optional,
    Required,
    From,
    validate,
};
