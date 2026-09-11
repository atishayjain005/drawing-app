const { normalizeDrawingElement } = require("./drawingValidation");

describe("drawing payload validation", () => {
  test("normalizes a valid line element", () => {
    expect(
      normalizeDrawingElement({
        tool: "line",
        startX: 1,
        startY: 2,
        endX: 10,
        endY: 20,
      })
    ).toEqual({
      tool: "line",
      startX: 1,
      startY: 2,
      endX: 10,
      endY: 20,
    });
  });

  test("rejects unsupported drawing tools", () => {
    expect(normalizeDrawingElement({ tool: "circle" })).toBeNull();
  });

  test("rejects pencil payloads without coordinate pairs", () => {
    expect(
      normalizeDrawingElement({
        tool: "pencil",
        path: [["x", 1]],
      })
    ).toBeNull();
  });
});
