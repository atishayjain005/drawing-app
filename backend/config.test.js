const { getAllowedOrigins } = require("./config");

describe("server config", () => {
  test("returns local development origin when no explicit origins are configured", () => {
    expect(getAllowedOrigins({})).toEqual(["http://localhost:5173"]);
  });

  test("parses and trims comma-separated client origins", () => {
    expect(
      getAllowedOrigins({
        CLIENT_ORIGINS:
          "https://whiteboard.example.com, http://localhost:5173 ,",
      })
    ).toEqual(["https://whiteboard.example.com", "http://localhost:5173"]);
  });
});
