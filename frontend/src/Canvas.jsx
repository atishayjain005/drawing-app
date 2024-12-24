import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";

const generator = rough.generator();

const Canvas = ({ canvasRef, ctx, color, setElements, elements, tool, socket }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const startCoords = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size to match its display size
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const context = canvas.getContext("2d");
    ctx.current = context;

    socket.on("initialize-canvas", (existingElements) => {
      setElements(existingElements);
      existingElements.forEach(element => {
        drawElement(element, ctx.current);
      });
    });

    socket.on("drawing", (data) => {
      if (data.socketId === socket.id) return;
      setElements(prevElements => [...prevElements, data]);
      drawElement(data, ctx.current);
    });

    return () => {
      socket.off("drawing");
      socket.off("initialize-canvas");
    };
  }, [socket]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const drawElement = (data, context) => {
    const roughCanvas = rough.canvas(canvasRef.current);

    switch (data.tool) {
      case "pencil":
        context.beginPath();
        context.strokeStyle = data.stroke;
        context.lineWidth = 2;
        data.path.forEach(([x, y], i) => {
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
        break;
      
      case "rect":
        roughCanvas.draw(
          generator.rectangle(
            data.startX,
            data.startY,
            data.width,
            data.height,
            { stroke: data.stroke, roughness: 0 }
          )
        );
        break;
      
      case "line":
        roughCanvas.draw(
          generator.line(
            data.startX, 
            data.startY, 
            data.endX, 
            data.endY, 
            { stroke: data.stroke, roughness: 0 }
          )
        );
        break;
    }
  };

  const redrawCanvas = () => {
    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    elements.forEach(element => {
      drawElement(element, ctx.current);
    });
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);
    startCoords.current = coords;
    setIsDrawing(true);

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
      path: []
    };

    if (tool === "pencil") {
      element.path = [[coords.x, coords.y]];
    }

    setElements((prev) => [...prev, element]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const coords = getCanvasCoordinates(e);
    const updatedElements = [...elements];
    const currentElementIndex = updatedElements.length - 1;
    const currentElement = updatedElements[currentElementIndex];

    if (tool === "pencil") {
      if (!currentElement.path) {
        currentElement.path = [];
      }
      currentElement.path.push([coords.x, coords.y]);
    } else if (tool === "rect") {
      const width = coords.x - startCoords.current.x;
      const height = coords.y - startCoords.current.y;
      currentElement.width = width;
      currentElement.height = height;
    } else if (tool === "line") {
      currentElement.endX = coords.x;
      currentElement.endY = coords.y;
    }

    updatedElements[currentElementIndex] = currentElement;
    setElements(updatedElements);
    redrawCanvas();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    const currentElement = elements[elements.length - 1];
    socket.emit("drawing", currentElement);
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [elements]);

  return (
    <div
      className="relative h-screen w-full bg-gray-100 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full bg-white shadow-lg rounded-md" />
    </div>
  );
};

export default Canvas;