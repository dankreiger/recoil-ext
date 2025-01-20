import { expect, test } from "bun:test";
import { greet } from "../src";

test("greet returns correct greeting", () => {
  expect(greet("World")).toBe("Hello, World!");
});
