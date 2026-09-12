// Canvas.jsx

import { useEffect, useRef, useCallback, useMemo } from "react";
import rough from "roughjs";
import { debounce } from "lodash";

const generator = rough.generator();

const Canvas = ({ canvasRef, color, tool, socket }) => {
  const isDrawing = useRef(false);
  const startCoords = useRef(null);
  const bufferRef = useRef([]);
  const elementsRef = useRef([]); // Manage elements using ref to prevent unnecessary re-renders
  const seenElementKeys = useRef(new Set());
  const offscreenCanvasRef = useRef(null);
  const ctx = useRef(null);

  // Debounced function to emit drawing events
  const debouncedEmit = useMemo(
    () =>
      debounce((element) => {
        socket.emit("drawing", element);
      }, 50),
    [socket]
  );

  // Helper to get canvas coordinates from mouse event
  const getCanvasCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [canvasRef]);

  const getElementKey = useCallback((element) => {
    if (!element || element.sequence === undefined) return null;
    return `${element.socketId || "remote"}:${element.sequence}`;
  }, []);

  const normalizeElement = useCallback((element) => {
    if (!element || Array.isArray(element)) return null;

    return {
      ...element,
      path:
        element.tool === "pencil" && !Array.isArray(element.path)
          ? []
          : element.path,
    };
  }, []);

  // Function to draw an element on the canvas
  const drawElement = useCallback((element, context) => {
    if (!context) return;

    const roughCanvas = rough.canvas(offscreenCanvasRef.current);

    switch (element.tool) {
      case "pencil":
        if (!Array.isArray(element.path) || element.path.length === 0) return;
        context.beginPath();
        context.strokeStyle = element.color || "#000000";
        context.lineWidth = 2;
        context.lineJoin = "round";
        context.lineCap = "round";
        element.path.forEach(([x, y], i) => {
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
        break;
      case "rect":
        roughCanvas.draw(
          generator.rectangle(
            element.startX,
            element.startY,
            element.width,
            element.height,
            { stroke: element.color || "#000000", roughness: 0 }
          )
        );
        break;
      case "line":
        roughCanvas.draw(
          generator.line(
            element.startX,
            element.startY,
            element.endX,
            element.endY,
            { stroke: element.color || "#000000", roughness: 0 }
          )
        );
        break;
      default:
        break;
    }
  }, []);

  // Function to redraw the entire canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!ctx.current || !canvas) return;

    const offscreenContext = offscreenCanvasRef.current.getContext("2d");
    offscreenContext.clearRect(0, 0, canvas.width, canvas.height);

    elementsRef.current.forEach((element) => drawElement(element, offscreenContext));

    ctx.current.clearRect(0, 0, canvas.width, canvas.height);
    ctx.current.drawImage(offscreenCanvasRef.current, 0, 0);
  }, [drawElement, canvasRef]);

  const rememberElements = useCallback(
    (elements) => {
      seenElementKeys.current = new Set();
      elements.forEach((element) => {
        const key = getElementKey(element);
        if (key) seenElementKeys.current.add(key);
      });
    },
    [getElementKey]
  );

  const addRemoteElement = useCallback(
    (element) => {
      const normalizedElement = normalizeElement(element);
      if (!normalizedElement || normalizedElement.socketId === socket.id) return;

      const key = getElementKey(normalizedElement);
      if (key && seenElementKeys.current.has(key)) return;
      if (key) seenElementKeys.current.add(key);

      elementsRef.current.push(normalizedElement);
      requestAnimationFrame(redrawCanvas);
    },
    [getElementKey, normalizeElement, redrawCanvas, socket.id]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Initialize offscreen canvas for rough.js
    offscreenCanvasRef.current = document.createElement("canvas");
    offscreenCanvasRef.current.width = rect.width;
    offscreenCanvasRef.current.height = rect.height;

    ctx.current = canvas.getContext("2d", { willReadFrequently: true });
    ctx.current.imageSmoothingEnabled = true;

    const handleDrawing = (data) => {
      if (Array.isArray(data)) {
        data.forEach(addRemoteElement);
        return;
      }
      addRemoteElement(data);
    };

    const handleDrawingBatch = (batch) => {
      if (!Array.isArray(batch)) return;
      batch.forEach(addRemoteElement);
    };

    const handleInitializeCanvas = (existingElements) => {
      elementsRef.current = Array.isArray(existingElements)
        ? existingElements.map(normalizeElement).filter(Boolean)
        : [];
      rememberElements(elementsRef.current);
      requestAnimationFrame(redrawCanvas);
    };

    const handleClear = () => {
      elementsRef.current = [];
      seenElementKeys.current = new Set();
      requestAnimationFrame(redrawCanvas);
    };

    const handleUpdateCanvas = (elements) => {
      elementsRef.current = Array.isArray(elements)
        ? elements.map(normalizeElement).filter(Boolean)
        : [];
      rememberElements(elementsRef.current);
      requestAnimationFrame(redrawCanvas);
    };

    socket.on("drawing", handleDrawing);
    socket.on("drawing-batch", handleDrawingBatch);
    socket.on("initialize-canvas", handleInitializeCanvas);
    socket.on("clear", handleClear);
    socket.on("update-canvas", handleUpdateCanvas);

    // Cleanup on unmount
    return () => {
      socket.off("drawing", handleDrawing);
      socket.off("drawing-batch", handleDrawingBatch);
      socket.off("initialize-canvas", handleInitializeCanvas);
      socket.off("clear", handleClear);
      socket.off("update-canvas", handleUpdateCanvas);
    };
  }, [
    socket,
    redrawCanvas,
    canvasRef,
    addRemoteElement,
    normalizeElement,
    rememberElements,
  ]);

  const handlePointerDown = useCallback(
    (e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const coords = getCanvasCoordinates(e);
      startCoords.current = coords;
      isDrawing.current = true;

      const newElement = {
        tool,
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        width: 0,
        height: 0,
        color: color || "#000000", // Use server-assigned color
        socketId: socket.id,
        path: tool === "pencil" ? [[coords.x, coords.y]] : [],
      };

      elementsRef.current.push(newElement);
    },
    [tool, color, socket.id, getCanvasCoordinates]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDrawing.current) return;

      const coords = getCanvasCoordinates(e);
      const currentElement = elementsRef.current[elementsRef.current.length - 1];

      if (!currentElement) {
        console.error("No current element found during drawing.");
        return;
      }

      if (tool === "pencil") {
        if (!Array.isArray(currentElement.path)) {
          currentElement.path = [];
        }
        currentElement.path.push([coords.x, coords.y]);
        bufferRef.current.push(currentElement);

        if (bufferRef.current.length >= 3) {
          debouncedEmit(currentElement);
          bufferRef.current = [];
        }
      } else {
        if (tool === "rect") {
          currentElement.width = coords.x - startCoords.current.x;
          currentElement.height = coords.y - startCoords.current.y;
        } else if (tool === "line") {
          currentElement.endX = coords.x;
          currentElement.endY = coords.y;
        }
        debouncedEmit(currentElement);
      }

      requestAnimationFrame(redrawCanvas);
    },
    [tool, getCanvasCoordinates, debouncedEmit, redrawCanvas]
  );

  const handlePointerUp = useCallback((e) => {
    if (!isDrawing.current) return;

    if (e?.currentTarget?.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isDrawing.current = false;
    bufferRef.current = [];
    const currentElement = elementsRef.current[elementsRef.current.length - 1];
    if (currentElement) {
      socket.emit("drawing", currentElement);
    }
    debouncedEmit.cancel();
  }, [debouncedEmit, socket]);

  return (
    <div
      className="relative h-screen w-full bg-gray-100 overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full bg-white shadow-lg rounded-md"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

export default Canvas;
