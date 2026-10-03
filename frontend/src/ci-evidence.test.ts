import { expect, test } from "vitest";

test("CI detects an incorrect result", () => {
  expect(1 + 1).toBe(3);
});
