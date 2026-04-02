import { describe, it, expect } from "vitest";
import { Formatters, Logger } from "../src/logger";

const LOGGER_TEST_PAYLOAD = {
    foo: "bar",
    "c-137": [
        "rick",
        "morty",
        {
            summer: "sister",
            jerry: "useless",
            beth: ["mother", "clone"],
        },
    ],
    number: 123,
    nulleo: null,
    undefo: undefined,
    bool: true,
    date: new Date(),
    err: new Error(),
    array: ["hello", new Error("error inside array")],
    banana: "pijama",
    func: () => `this is a function`,
    bigint: BigInt("12345678901234567890"),
};

describe("pretty print", () => {
    const _logger = Logger({ formatter: Formatters.Pretty });

    it("pretty debug", async () => {
        _logger.debug({ foo: "bar" }, "debug");
    });

    it("pretty info", async () => {
        _logger.info(function doSomething() {}, "info");
    });

    it("pretty warning", async () => {
        _logger.warn(["rick", "sanchez", "c-137"], "warning");
    });

    it("pretty error", async () => {
        _logger.error({ error: "error" }, "error");
    });
});

describe("no pretty settings", () => {
    let _logger = Logger({ id: "[no colours]" });

    it("does not display colours", () => {
        let payload = [{ rick: "sanchez" }, "hello"] as const;

        _logger.debug(...payload);
    });
});

describe("error logging", () => {
    let logger = Logger();

    it("formats normal errors", () => {
        logger.error(new TypeError("an error"), "Error instance");
    });

    it("formats generic context", () => {
        logger.error(
            {
                morty: { rick: "sanchez" },
                req_id: "c-137",
            },
            "generic",
        );
    });
});

describe("nested context building", () => {
    it("parses nested object keys into format", () => {
        let logger = Logger({
            formatter: Formatters.Pretty,
            id: "nested context parsing",
        });

        logger.info(
            {
                ...LOGGER_TEST_PAYLOAD,
            },
            "lorem ipsum",
        );

        logger.info(function funcWithName() {
            return `this is a function`;
        }, "function with name");

        logger.info(() => "nameless function", "nameless function");

        logger.warn("no context no problem");

        logger.error(null, "a null");
    });
});

describe("Symbols", () => {
    let logger = Logger({
        id: "symbol log",
    });

    it("can handle symbols", () => {
        let withDescription = Symbol("desc");
        let empty = Symbol();

        logger.info(withDescription, "with description");
        logger.info(empty, "empty symbol");
        logger.info(
            {
                withDescription,
                empty,
                list: [withDescription, empty],
            },
            "nested",
        );
    });
});
