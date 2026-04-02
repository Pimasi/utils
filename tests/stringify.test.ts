import { describe, it, expect } from "vitest";
import { jsonStringify } from "../src/helpers";

describe("jsonStringify", () => {
    it("does not scape stringified jsons", () => {
        let jsonString = `{"abc": 123}`;

        let result = jsonStringify(jsonString);

        expect(JSON.parse(jsonString)).toEqual(JSON.parse(result));
    });
});
