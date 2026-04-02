import { type Static, Schema } from "../../src/json-schema";
import { Logger } from "../../src";
import { Formatters } from "../../src/logger";

let logger = Logger.Logger({ formatter: Formatters.Pretty });

// ─── Composite (object-only) ─────────────────────────────────────────────────

let userSchema = Schema.Object({
    name: Schema.String(),
    email: Schema.String({ format: "email" }),
});

let profileSchema = Schema.Object({
    bio: Schema.Optional(Schema.String()),
    avatar: Schema.String(),
});

// basic merge — all keys from both schemas
let fullUser = Schema.Composite([userSchema, profileSchema]);
type IFullUser = Static<typeof fullUser>;
// { name: string; email: string; bio?: string; avatar: string }
logger.info({ fullUser }, "basic merge");

// nullable schema — its keys become nullable in the composite
let addressSchema = Schema.Nullable(
    Schema.Object({
        street: Schema.String(),
        city: Schema.String(),
    }),
);

let userWithAddress = Schema.Composite([userSchema, addressSchema]);
type IUserWithAddress = Static<typeof userWithAddress>;
// { name: string; email: string; street: string | null; city: string | null }
logger.info({ userWithAddress }, "nullable source schema");

// composite itself can be nullable/optional
let nullableComposite = Schema.Nullable(
    Schema.Composite([userSchema, profileSchema]),
);
type INullableComposite = Static<typeof nullableComposite>;
// { name: string; email: string; bio?: string; avatar: string } | null
logger.info({ nullableComposite }, "nullable composite");
