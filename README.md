# @pimasi/utils

```bash
npm install @pimasi/utils
```

The only utility library you'll ever need - a comprehensive collection of TypeScript utilities for common programming tasks.

## Table of Contents

- [Logger](#logger)
- [Helpers](#helpers)
- [JsonSchema](#jsonschema)
- [Observable](#observable)
- [Error](#error)
- [Http](#http)

---

## Logger

Fast and simple event-driven logger with customizable formatting and log level control.

### Features

- Event-driven architecture for async processing
- Multiple log levels: DEBUG, INFO, WARNING, ERROR
- Customizable formatters (JSON or pretty-print)
- Dynamic logger ID via function or string
- Non-blocking async handlers
- Minimum log level filtering
- Symbol and circular reference serialization in context

### Usage

```ts
import { Logger } from "@pimasi/utils/lib/logger";

const logger = Logger({
    id: "myLogger",
    pretty: false,
    minLogLevel: "INFO",
});

// Log messages
logger.debug({ userId: 123 }, "User action");
logger.info("Application started");
logger.warn({ retry: 3 }, "Retrying operation");
logger.error(new Error("Something went wrong"), "Operation failed");

// Listen to log events
const handler = logger.on("ERROR", async (entry) => {
    // Send to error tracking service
    await sendToSentry(entry);
});

// Wait for all async handlers to complete
await logger.flush();

// Remove handler
logger.off("ERROR", handler);
```

### Formatters

```ts
import { Formatters } from "@pimasi/utils/lib/logger";

Formatters.Pretty(entry); // Human-readable coloured output
Formatters.Yml(context); // YAML-like indented format
```

### API

- `Logger(options?)` - Create a new logger instance
- `logger.debug(context, message?)` - Log debug information
- `logger.info(context, message?)` - Log informational messages
- `logger.warn(context, message?)` - Log warnings
- `logger.error(err, message?)` - Log errors
- `logger.on(level, handler)` - Attach async handler to log level
- `logger.off(level, handler)` - Remove handler
- `logger.flush()` - Wait for all pending async handlers

---

## Helpers

Collection of highly useful helper functions for common tasks.

### `parallelize`

Execute tasks in parallel with controlled concurrency using a worker pool.

```ts
import { parallelize } from "@pimasi/utils/lib/helpers";

const urls = ["url1", "url2", "url3", ...];

await parallelize({
    workers: 10,
    queue: urls,
    handler: async (url) => {
        const data = await fetch(url);
        // process data
    },
});
```

### `retry`

Retry a function with exponential backoff on failure.

```ts
import { retry } from "@pimasi/utils/lib/helpers";

const result = await retry(
    async () => {
        return await unstableApiCall();
    },
    {
        tries: 5, // Number of retry attempts (default: 3)
        baseDelay: 1000, // Base timeout in ms (default: 0)
        factor: 2, // Exponential backoff factor (default: 1)
    },
);
```

### `getenv`

Safely retrieve environment variables with optional default values.

```ts
import { getenv } from "@pimasi/utils/lib/helpers";

// With default value
const apiKey = getenv("API_KEY", "default-key");

// Without default (throws InternalError if not set)
const dbUrl = getenv("DATABASE_URL");
```

### `sleep`

Pause execution for a specified duration.

```ts
import { sleep } from "@pimasi/utils/lib/helpers";

await sleep(2000); // Sleep for 2 seconds
```

### `jsonStringify`

Safe JSON stringification with circular reference handling using fast-safe-stringify.

```ts
import { jsonStringify } from "@pimasi/utils/lib/helpers";

const circularObj = { a: 1 };
circularObj.self = circularObj;

const json = jsonStringify(circularObj);
// Returns safe JSON string instead of throwing
```

### `jsonParse`

Safe JSON parsing that returns `undefined` instead of throwing errors.

```ts
import { jsonParse } from "@pimasi/utils/lib/helpers";

const obj = jsonParse('{"valid": "json"}');
// Returns: { valid: "json" }

const invalid = jsonParse("invalid json");
// Returns: undefined (instead of throwing)
```

### `execute`

Wrapper for command-line scripts with proper error handling and process exit codes.

```ts
import { execute } from "@pimasi/utils/lib/helpers";

execute(async () => {
    // Your script logic
    await doSomething();
    // Exits with code 0 on success, 1 on error
});
```

---

## JsonSchema

Type-safe JSON Schema builder with full TypeScript inference — no external schema library required.

### Features

- Zero-dependency schema builders (`String`, `Number`, `Boolean`, `Array`, `Object`, `Const`, `Any`, `Record`, `Composite`, `AnyOf`, `OneOf`, `Recursive`)
- Wrappers: `Nullable`, `Optional`, `Required`, `Pick`, `Omit`
- Full TypeScript type inference via `Static<T>` branded types
- Raw `as const` schema inference via `InferRawSchema<T>`
- `Schema.From()` for inferring schemas from non-`as const` objects and JSON imports
- `enum` option on primitive builders, `$id`, `$schema`, `description`, `title` metadata on every builder
- Runtime validation using [jsonschema](https://www.npmjs.com/package/jsonschema)

### Import

```ts
import { Schema, type Static, type InferRawSchema } from "@pimasi/utils/lib/json-schema";

// Type helpers
type MyType = Static<typeof MySchema>;
type RawInferred = InferRawSchema<typeof rawSchema>;
```

### Schema Builders

#### Primitives

```ts
Schema.String(); // string
Schema.Nullable(Schema.String()); // string | null
Schema.String({ enum: ["a", "b"] as const }); // "a" | "b"
Schema.String({ format: "email" }); // string (validated as email)

Schema.Number(); // number
Schema.Number({ enum: [1, 2, 3] as const }); // 1 | 2 | 3
Schema.Number({ integer: true }); // integer (no decimals)
Schema.Number({ integer: true, minimum: 1 }); // integer with constraints

Schema.Boolean(); // boolean
Schema.Nullable(Schema.Boolean()); // boolean | null
```

#### Const

```ts
Schema.Const("active"); // "active"
Schema.Const(42); // 42
```

#### Any

```ts
Schema.Any(); // any
Schema.Any({ description: "metadata" }); // any (with description)
```

#### Array

```ts
Schema.Array(Schema.String()); // string[]
Schema.Nullable(Schema.Array(Schema.Number())); // number[] | null
```

#### Object

```ts
const UserSchema = Schema.Object({
    id: Schema.Number(),
    name: Schema.String(),
    role: Schema.String({ enum: ["admin", "user"] as const }),
    bio: Schema.Optional(Schema.Nullable(Schema.String())),
});

type User = Static<typeof UserSchema>;
// { id: number; name: string; role: "admin" | "user"; bio?: string | null }
```

#### Composite

Merges multiple object schemas into one. Handles nullable source schemas. Also accepts `Schema.OneOf` / `Schema.AnyOf` unions (whose members are all objects) — these are preserved and combined via JSON Schema `allOf`.

```ts
const BaseSchema = Schema.Object({
    id: Schema.Number(),
    createdAt: Schema.String(),
});

const UserSchema = Schema.Composite([
    BaseSchema,
    Schema.Object({
        name: Schema.String(),
        email: Schema.String(),
    }),
]);
// { id: number; createdAt: string; name: string; email: string }

// Composite with OneOf — union branches are kept in allOf
const ByPostcode = Schema.Object({ postcode: Schema.String() });
const ByLatLon = Schema.Object({ lat: Schema.Number(), lon: Schema.Number() });

const SearchSchema = Schema.Composite([
    Schema.Object({ bedrooms: Schema.Number() }),
    Schema.OneOf([ByPostcode, ByLatLon]),
]);
// { bedrooms: number } & ({ postcode: string } | { lat: number; lon: number })
```

#### AnyOf / OneOf

```ts
const StatusSchema = Schema.AnyOf([Schema.String(), Schema.Number()]);
// string | number

const EventSchema = Schema.OneOf(
    [
        Schema.Object({ type: Schema.Const("click"), x: Schema.Number() }),
        Schema.Object({ type: Schema.Const("key"), code: Schema.String() }),
    ],
    { discriminator: { propertyName: "type" } },
);
// { type: "click"; x: number } | { type: "key"; code: string }
```

#### Recursive

Define self-referencing schemas using `$ref`. The schema is automatically registered for validation.

```ts
type TreeNode = { value: string; children: TreeNode[] };

const TreeSchema = Schema.Recursive<TreeNode>("TreeNode", (self) =>
    Schema.Object({
        value: Schema.String(),
        children: Schema.Array(self),
    }),
);
// { value: string; children: TreeNode[] }
```

#### Record

```ts
Schema.Record(Schema.String(), Schema.Number()); // Record<string, number>
Schema.Record(Schema.Number(), Schema.String()); // Record<number, string>

// Key with pattern — uses the regex directly as the patternProperties key
Schema.Record(Schema.String({ pattern: "^[a-z]+$" }), Schema.Any());

// Key with format — maps known formats (email, uuid, date-time, etc.) to regex
Schema.Record(Schema.String({ format: "email" }), Schema.Any());

// Integer key — uses integer-only regex (no decimals)
Schema.Record(Schema.Number({ integer: true }), Schema.String());
```

#### Nullable / Optional / Required

```ts
Schema.Nullable(Schema.String()); // string | null
Schema.Optional(Schema.String()); // string (optional in parent object)
Schema.Required(Schema.Nullable(Schema.String())); // string (strips null + optional)
```

#### Pick / Omit

```ts
const User = Schema.Object({
    name: Schema.String(),
    age: Schema.Number(),
    email: Schema.String(),
});

Schema.Pick(User, ["name", "email"]); // { name: string; email: string }
Schema.Omit(User, ["email"]); // { name: string; age: number }
```

#### From

Infer a typed schema from a plain object (e.g. a JSON import). No `as const` needed — the type is inferred via a `const` generic parameter.

```ts
const schema = Schema.From({
    type: "object",
    properties: {
        name: { type: "string" },
        age: { type: "number" },
    },
    required: ["name", "age"],
});
type T = Static<typeof schema>; // { name: string; age: number }
```

### Raw Schema Inference

Use `InferRawSchema` to extract TypeScript types directly from `as const` JSON Schema objects — no builder functions needed:

```ts
const schema = {
    type: "object",
    properties: {
        id: { type: "number" },
        name: { type: "string" },
        role: { enum: ["admin", "user"] },
        active: { const: true },
    },
    required: ["id", "name", "role", "active"],
} as const;

type MyType = InferRawSchema<typeof schema>;
// { id: number; name: string; role: "admin" | "user"; active: true }
```

Supported keywords: `type`, `const`, `enum`, `properties`/`required`, `items`, `anyOf`, `oneOf`, `nullable`.

### Validation

`Schema.validate` returns the typed object if valid, or throws `ValidationFailed` with details.

```ts
const UserSchema = Schema.Object({
    id: Schema.Number(),
    name: Schema.String(),
});

// Returns typed object
const user = Schema.validate({ id: 1, name: "John" }, UserSchema);
user.id; // number
user.name; // string

// Throws on invalid data
try {
    Schema.validate({ id: "bad" }, UserSchema);
} catch (err) {
    // err is ValidationFailed with error details
    console.error(err.context);
}
```

### API Reference

**Builders** — accept an options object with `$id?`, `$schema?`, `description?`, `title?`:

- `Schema.Const(value, opts?)` — literal value schema
- `Schema.String(opts?)` — string schema (supports `enum`, `format`, `minLength`, `maxLength`, `pattern`)
- `Schema.Number(opts?)` — number schema (supports `enum`, `minimum`, `maximum`, `multipleOf`)
- `Schema.Boolean(opts?)` — boolean schema
- `Schema.Any(opts?)` — any value (empty schema)
- `Schema.Array(items, opts?)` — array schema (supports `minItems`, `maxItems`, `uniqueItems`)
- `Schema.Object(properties, opts?)` — object schema (supports `additionalProperties`)
- `Schema.Record(keySchema, valueSchema)` — record / dictionary schema
- `Schema.Composite(schemas[], opts?)` — merge multiple object schemas (also accepts `OneOf`/`AnyOf` unions of objects)
- `Schema.AnyOf(schemas[], opts?)` — union (any match)
- `Schema.OneOf(schemas[], opts?)` — union (exactly one match, supports `discriminator`)
- `Schema.Recursive(id, builder)` — self-referencing schema via `$ref`
- `Schema.From(raw)` — infer typed schema from a plain object

**Wrappers:**

- `Schema.Nullable(schema)` — make schema accept `null`
- `Schema.Optional(schema)` — make property optional in parent object
- `Schema.Required(schema)` — strip `null` and optional from schema
- `Schema.Pick(objectSchema, keys[])` — keep only selected keys
- `Schema.Omit(objectSchema, keys[])` — remove selected keys

**Validation:**

- `Schema.validate(data, schema)` — validate and return typed data, or throw `ValidationFailed`

---

## Observable

Runtime-agnostic, type-safe implementation of event emitter pattern.

### Features

- Type-safe event names and payloads
- Handler registration and removal
- One-time event handlers
- Global event listeners
- No dependencies on Node.js EventEmitter

### Usage

```ts
import { Observable } from "@pimasi/utils/lib/observable";

// Define events with types
type Events = "userCreated" | "userDeleted" | "userUpdated";
type Payload = { userId: number; timestamp: Date };

const events = Observable<Events, Payload>();

// Listen to specific event
events.on("userCreated", (payload) => {
    console.log(`User ${payload.userId} created`);
});

// Listen once
events.once("userDeleted", (payload) => {
    console.log(`User ${payload.userId} deleted`);
});

// Listen to all events
events.onEvent((event, payload) => {
    console.log(`Event: ${event}`, payload);
});

// Emit events
events.emit("userCreated", { userId: 123, timestamp: new Date() });

// Remove listener
const handler = (payload) => console.log(payload);
events.on("userUpdated", handler);
events.off("userUpdated", handler);
```

### API

- `on(event, handler)` - Register event handler
- `once(event, handler)` - Register one-time handler
- `onEvent(handler)` - Register global handler for all events
- `off(event, handler)` - Remove event handler
- `emit(event, payload?)` - Emit event with optional payload

---

## Error

Pre-configured HTTP exception classes for common error scenarios.

### Available Exceptions

All exceptions include:

- `name` - Error name
- `message` - Error message
- `statusCode` / `code` - HTTP status code
- `context` - Additional error context

```ts
import {
    BadRequest, ValidationFailed, Unauthorized, PaymentRequired,
    Forbidden, NotFound, NotAcceptable, TimeOut, Conflict, Gone,
    PreconditionFailed, PayloadTooLarge, URITooLong, UnsupportedMediaType,
    ExpectationFailed, UnprocessableEntity, TooManyRequests,
    InternalError, NotImplemented,
} from "@pimasi/utils/lib/error";

// 4xx Client Errors
throw BadRequest({ field: "email" }, "Invalid email format");
throw ValidationFailed({ errors: [...] });
throw Unauthorized();
throw PaymentRequired();
throw Forbidden();
throw NotFound({ resource: "user", id: 123 });
throw NotAcceptable();
throw TimeOut();
throw Conflict({ reason: "duplicate email" });
throw Gone();
throw PreconditionFailed();
throw PayloadTooLarge();
throw URITooLong();
throw UnsupportedMediaType();
throw ExpectationFailed();
throw UnprocessableEntity();
throw TooManyRequests();

// 5xx Server Errors
throw InternalError(err, "Database connection failed");
throw NotImplemented();
```

### Usage Example

```ts
import { NotFound } from "@pimasi/utils/lib/error";

function getUser(id: number) {
    const user = db.users.find(id);

    if (!user) {
        throw NotFound({ userId: id }, "User not found");
    }

    return user;
}

try {
    const user = getUser(123);
} catch (err) {
    console.error(err.statusCode); // 404
    console.error(err.message); // "User not found"
    console.error(err.context); // { userId: 123 }
}
```

---

## Http

Axios-compatible HTTP client built on native `fetch`. Drop-in replacement with the same API — `create`, interceptors, config merging, and error handling all work like axios.

### Features

- Built on native `fetch` — zero HTTP dependencies
- Axios-compatible API (`create`, callable instances, interceptors)
- Automatic JSON serialization/parsing
- `baseURL` + relative URL resolution
- Query parameter serialization
- Request/response interceptors with `use`/`eject`/`clear`
- Configurable status validation
- Timeout support via `AbortController`
- `HttpError` with `isAxiosError: true` for compatibility

### Usage

```ts
import { http } from "@pimasi/utils/lib/http";

// Use the default instance directly
const response = await http({
    url: "https://api.example.com/users",
    method: "get",
});
response.data; // parsed JSON
response.status; // 200

// Create a custom instance with defaults
const client = http.create({
    baseURL: "https://api.example.com",
    headers: { Authorization: "Bearer token" },
    timeout: 5000,
});

// Make requests — config merges with defaults
const user = await client({
    url: "/users/1",
    method: "get",
});

// POST with JSON body (auto-serialized, Content-Type set automatically)
const created = await client({
    url: "/users",
    method: "post",
    data: { name: "Rick", dimension: "C-137" },
});
```

### Interceptors

```ts
import { http } from "@pimasi/utils/lib/http";

const client = http.create({ baseURL: "https://api.example.com" });

// Request interceptor — modify config before sending
const id = client.interceptors.request.use(
    (config) => {
        config.headers = {
            ...config.headers,
            Authorization: "Bearer " + getToken(),
        };
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor — transform or handle responses
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.status === 401) {
            // handle unauthorized
        }
        return Promise.reject(error);
    },
);

// Remove an interceptor
client.interceptors.request.eject(id);

// Remove all interceptors
client.interceptors.request.clear();
```

### Error Handling

```ts
import { http, HttpError } from "@pimasi/utils/lib/http";

const client = http.create({ baseURL: "https://api.example.com" });

try {
    await client({ url: "/not-found" });
} catch (err) {
    if (err instanceof HttpError) {
        err.status; // 404
        err.message; // "Request failed with status code 404"
        err.response; // { data, status, statusText, headers, config }
        err.isAxiosError; // true (for compatibility)
    }
}

// Accept all status codes (don't throw)
const response = await client({
    url: "/not-found",
    validateStatus: null,
});
response.status; // 404
```

### Request Config

```ts
interface HttpRequestConfig<D = any> {
    url?: string; // Request URL
    method?: string; // HTTP method (default: "get")
    baseURL?: string; // Prepended to relative URLs
    headers?: Record<string, string>; // Request headers
    params?: Record<string, string | number | boolean>; // Query parameters
    data?: D; // Request body (auto-serialized to JSON)
    timeout?: number; // Timeout in ms
    validateStatus?: ((status: number) => boolean) | null; // Custom status validation
    signal?: AbortSignal; // Abort signal
}
```

### Response

```ts
interface HttpResponse<T = any, D = any> {
    data: T; // Parsed response body
    status: number; // HTTP status code
    statusText: string; // HTTP status text
    headers: Record<string, string>; // Response headers
    config: HttpRequestConfig<D>; // Request config used
}
```

### API

- `http(config)` — make a request using the default instance
- `http.create(defaults?)` — create a new instance with defaults
- `instance(config)` — make a request
- `instance.defaults` — instance default config
- `instance.interceptors.request.use(onFulfilled?, onRejected?)` — add request interceptor, returns ID
- `instance.interceptors.response.use(onFulfilled?, onRejected?)` — add response interceptor, returns ID
- `instance.interceptors.request.eject(id)` — remove request interceptor
- `instance.interceptors.response.eject(id)` — remove response interceptor
- `instance.interceptors.request.clear()` — remove all request interceptors
- `instance.interceptors.response.clear()` — remove all response interceptors

---

## License

Apache-2.0

## Contributing

Issues and pull requests are welcome at [github.com/pimasi/utils](https://github.com/pimasi/utils)
