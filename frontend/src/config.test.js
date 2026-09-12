import { describe, expect, test } from "vitest";
import { getBackendUrl } from "./config";

describe("frontend config", () => {
  test("uses Vite backend URL when it is provided", () => {
    expect(
      getBackendUrl({
        VITE_BACKEND_URL: "https://drawing-api.example.com",
      })
    ).toBe("https://drawing-api.example.com");
  });

  test("falls back to the local backend during development", () => {
    expect(getBackendUrl({})).toBe("http://localhost:5000");
  });
});
