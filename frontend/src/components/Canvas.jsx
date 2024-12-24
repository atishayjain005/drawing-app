import React, { useEffect, useRef, useState, useCallback } from "react";
import rough from "roughjs";
import { debounce } from "lodash";

const generator = rough.generator();

const Canvas = ({ canvasRef, color, tool, socket }) => {
  const isDrawing = useRef(false);
  const startCoords = useRef(null);
  const bufferRef = useRef([]);
  const elementsRef = useRef([]); // Avoid state updates for elements
  const offscreenCanvasRef = useRef(null);
  const ctx = useRef(null);

  const debouncedEmit = useCallback(
    debounce((element) => {
      socket.emit("drawing", element);
    }, 50),
    [socket]
  );

  const getCanvasCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const drawElement = useCallback((element, context) => {
    if (!context) return;

    const roughCanvas = rough.canvas(offscreenCanvasRef.current);

    switch (element.tool) {
      case "pencil":
        if (!element.path?.length) return;
        context.beginPath();
        context.strokeStyle = element.stroke;
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
            { stroke: element.stroke, roughness: 0 }
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
            { stroke: element.stroke, roughness: 0 }
          )
        );
        break;
      default:
        break;
    }
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!ctx.current || !canvas) return;

    const offscreenContext = offscreenCanvasRef.current.getContext("2d");
    offscreenContext.clearRect(0, 0, canvas.width, canvas.height);

    elementsRef.current.forEach((element) => drawElement(element, offscreenContext));

    ctx.current.clearRect(0, 0, canvas.width, canvas.height);
    ctx.current.drawImage(offscreenCanvasRef.current, 0, 0);
  }, [drawElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    offscreenCanvasRef.current = document.createElement("canvas");
    offscreenCanvasRef.current.width = rect.width;
    offscreenCanvasRef.current.height = rect.height;

    ctx.current = canvas.getContext("2d", { willReadFrequently: true });
    ctx.current.imageSmoothingEnabled = true;

    socket.on("drawing", (data) => {
      if (data.socketId === socket.id) return;
      elementsRef.current.push(data);
      requestAnimationFrame(redrawCanvas);
    });

    socket.on("initialize-canvas", (existingElements) => {
      elementsRef.current = existingElements;
      requestAnimationFrame(redrawCanvas);
    });

    return () => {
      socket.off("drawing");
      socket.off("initialize-canvas");
    };
  }, [socket, redrawCanvas]);

  const handleMouseDown = useCallback(
    (e) => {
      const coords = getCanvasCoordinates(e);
      startCoords.current = coords;
      isDrawing.current = true;

      const element = {
        tool,
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        width: 0,
        height: 0,
        stroke: color,
        socketId: socket.id,
        path: tool === "pencil" ? [[coords.x, coords.y]] : [],
      };

      elementsRef.current.push(element);
    },
    [tool, color, socket.id, getCanvasCoordinates]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing.current) return;

      const coords = getCanvasCoordinates(e);
      const currentElement = elementsRef.current[elementsRef.current.length - 1];

      if (tool === "pencil") {
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
    socket.emit("drawing", currentElement);
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
