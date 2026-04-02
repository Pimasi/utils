import { describe, it, expect } from "vitest";
import { retry } from "../src/helpers/retry";

describe("Retry Handler", () => {
    it("returns the handler's response", async () => {
        let msg = "hello there!";
        const stringHandler = (str: string) => str;

        let stringResult = await retry(() => stringHandler("hello there!"));

        expect(stringResult).toBe(msg);
    });
});
