import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";

const generator = rough.generator();

const Canvas = ({ canvasRef, ctx, color, setElements, elements, tool, socket }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const startCoords = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    const context = canvas.getContext("2d");
    ctx.current = context;

    // Handle incoming drawing events
    socket.on("drawing", (data) => {
      if (data.socketId === socket.id) return; // Ignore self-emitted events
      drawElement(data, ctx.current);
    });

    return () => {
      socket.off("drawing");
    };
  }, [socket]);

  const drawElement = (data, context) => {
    const roughCanvas = rough.canvas(canvasRef.current);

    if (data.tool === "pencil") {
      context.beginPath();
      context.strokeStyle = data.stroke;
      context.lineWidth = 2;
      data.path.forEach(([x, y], i) => {
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    } else if (data.tool === "rect") {
      roughCanvas.draw(
        generator.rectangle(
          data.startX,
          data.startY,
          data.width,
          data.height,
          { stroke: data.stroke, roughness: 0 }
        )
      );
    } else if (data.tool === "line") {
      roughCanvas.draw(
        generator.line(data.startX, data.startY, data.endX, data.endY, {
          stroke: data.stroke,
          roughness: 0,
        })
      );
    }
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    startCoords.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);

    const element = {
      tool,
      startX: offsetX,
      startY: offsetY,
      endX: offsetX,
      endY: offsetY,
      width: 0,
      height: 0,
      path: tool === "pencil" ? [[offsetX, offsetY]] : [],
      stroke: color,
      socketId: socket.id,
    };

    setElements((prev) => [...prev, element]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const updatedElements = [...elements];
    const currentElementIndex = updatedElements.length - 1;
    const currentElement = updatedElements[currentElementIndex];

    if (tool === "pencil") {
      currentElement.path.push([offsetX, offsetY]);
    } else if (tool === "rect") {
      const width = offsetX - startCoords.current.x;
      const height = offsetY - startCoords.current.y;
      currentElement.width = width;
      currentElement.height = height;
    } else if (tool === "line") {
      currentElement.endX = offsetX;
      currentElement.endY = offsetY;
    }

    // Update the last element
    updatedElements[currentElementIndex] = currentElement;
    setElements(updatedElements);

    // Dynamic drawing
    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    updatedElements.forEach((ele) => drawElement(ele, ctx.current));
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    // Emit the finalized drawing
    const currentElement = elements[elements.length - 1];
    socket.emit("drawing", currentElement);
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#ffffff",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Canvas;
