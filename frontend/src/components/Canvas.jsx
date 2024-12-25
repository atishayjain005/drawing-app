// Canvas.jsx

import React, { useEffect, useRef, useCallback } from "react";
import rough from "roughjs";
import { debounce } from "lodash";

const generator = rough.generator();

const Canvas = ({ canvasRef, color, tool, socket }) => {
  const isDrawing = useRef(false);
  const startCoords = useRef(null);
  const bufferRef = useRef([]);
  const elementsRef = useRef([]); // Manage elements using ref to prevent unnecessary re-renders
  const offscreenCanvasRef = useRef(null);
  const ctx = useRef(null);

  // Debounced function to emit drawing events
  const debouncedEmit = useCallback(
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

    // Handle incoming drawing data from other users
    socket.on("drawing", (data) => {
      if (data.socketId === socket.id) return; // Ignore own drawings if echoed back
      if (data.tool === "pencil" && !Array.isArray(data.path)) {
        // Ensure path exists for pencil tool
        data.path = [];
      }
      elementsRef.current.push(data);
      requestAnimationFrame(redrawCanvas);
    });

    // Initialize canvas with existing elements when joining
    socket.on("initialize-canvas", (existingElements) => {
      elementsRef.current = existingElements.map((el) => ({
        ...el,
        path: el.tool === "pencil" && !Array.isArray(el.path) ? [] : el.path,
      }));
      requestAnimationFrame(redrawCanvas);
    });

    // Cleanup on unmount
    return () => {
      socket.off("drawing");
      socket.off("initialize-canvas");
    };
  }, [socket, redrawCanvas, canvasRef]);

  const handleMouseDown = useCallback(
    (e) => {
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

  const handleMouseMove = useCallback(
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

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return;

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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
