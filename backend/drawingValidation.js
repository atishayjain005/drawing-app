const MAX_PENCIL_POINTS = 500;
const SUPPORTED_TOOLS = new Set(["pencil", "rect", "line"]);

const isFiniteNumber = (value) => Number.isFinite(value);

const normalizeCoordinateFields = (element, fields) => {
  const normalized = { tool: element.tool };

  for (const field of fields) {
    if (!isFiniteNumber(element[field])) {
      return null;
    }

    normalized[field] = element[field];
  }

  return normalized;
};

const normalizePencil = (element) => {
  if (!Array.isArray(element.path) || element.path.length === 0) {
    return null;
  }

  const path = element.path.slice(0, MAX_PENCIL_POINTS);
  const hasOnlyCoordinatePairs = path.every(
    (point) =>
      Array.isArray(point) &&
      point.length === 2 &&
      isFiniteNumber(point[0]) &&
      isFiniteNumber(point[1])
  );

  return hasOnlyCoordinatePairs ? { tool: "pencil", path } : null;
};

const normalizeDrawingElement = (element) => {
  if (!element || !SUPPORTED_TOOLS.has(element.tool)) {
    return null;
  }

  if (element.tool === "pencil") {
    return normalizePencil(element);
  }

  if (element.tool === "line") {
    return normalizeCoordinateFields(element, ["startX", "startY", "endX", "endY"]);
  }

  return normalizeCoordinateFields(element, ["startX", "startY", "width", "height"]);
};

module.exports = {
  normalizeDrawingElement,
};
