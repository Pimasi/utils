import { describe, it, expect } from "vitest";
import { getenv } from "../src/helpers/get-env";

describe("getenv", () => {
    it("given 0, it'll return string '0'", () => {
        process.env.var = "0";
        (<any>process.env).bar = 0;

        expect(getenv("var")).toBe("0");
        expect(getenv("bar")).toBe("0");
    });

    it("given empty string, it'll return string ''", () => {
        process.env.var = "";

        expect(getenv("var")).toBe("");
    });

    it("returns a default value if env is not set and was passed as second parameter", () => {
        delete process.env.var;

        let result = getenv("var", "default_value");

        expect(result).toBe("default_value");
    });

    it("throws an error if key does not exist and no default value was given", () => {
        delete process.env.var;

        expect(() => getenv("var")).toThrow(Error);
    });
});
