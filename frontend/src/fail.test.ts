import { expect, test } from "vitest";
    
    test("deliberate failure to test CI lock", () => {
      expect(1 + 1).toBe(3); // ตั้งใจให้ผิดเพื่อให้ CI พังq
    });