import React, { useEffect, useRef, useState, useCallback } from "react";
import rough from "roughjs";
import { debounce } from 'lodash';

const generator = rough.generator();

const Canvas = ({ canvasRef, ctx, color, setElements, elements, tool, socket }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const startCoords = useRef(null);
  const drawingRef = useRef(false);
  const requestRef = useRef();
  const bufferRef = useRef([]);

  // Debounced emit function to reduce socket events
  const debouncedEmit = useCallback(
    debounce((element) => {
      socket.emit("drawing", element);
    }, 50),
    [socket]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const context = canvas.getContext("2d", { willReadFrequently: true });
    ctx.current = context;
    
    // Enable canvas optimization
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const handleIncomingDrawing = (data) => {
      if (data.socketId === socket.id) return;
      setElements(prevElements => [...prevElements, data]);
      requestAnimationFrame(() => drawElement(data, ctx.current));
    };

    socket.on("initialize-canvas", (existingElements) => {
      setElements(existingElements);
      requestAnimationFrame(() => {
        existingElements.forEach(element => {
          drawElement(element, ctx.current);
        });
      });
    });

    socket.on("drawing", handleIncomingDrawing);

    return () => {
      socket.off("drawing");
      socket.off("initialize-canvas");
      cancelAnimationFrame(requestRef.current);
    };
  }, [socket]);

  const getCanvasCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const drawElement = useCallback((data, context) => {
    if (!context) return;
    
    const roughCanvas = rough.canvas(canvasRef.current);

    switch (data.tool) {
      case "pencil":
        if (!data.path?.length) return;
        context.beginPath();
        context.strokeStyle = data.stroke;
        context.lineWidth = 2;
        context.lineJoin = 'round';
        context.lineCap = 'round';
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
  }, []);

  const redrawCanvas = useCallback(() => {
    if (!ctx.current || !canvasRef.current) return;
    
    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    elements.forEach(element => {
      drawElement(element, ctx.current);
    });
  }, [elements, drawElement]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault(); // Prevent focus issues
    if (drawingRef.current) return;
    
    const coords = getCanvasCoordinates(e);
    startCoords.current = coords;
    drawingRef.current = true;
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
      path: tool === "pencil" ? [[coords.x, coords.y]] : []
    };

    setElements(prev => [...prev, element]);
  }, [tool, color, socket.id, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e) => {
    e.preventDefault(); // Prevent focus issues
    if (!drawingRef.current) return;

    const coords = getCanvasCoordinates(e);
    const updatedElements = [...elements];
    const currentElementIndex = updatedElements.length - 1;
    const currentElement = updatedElements[currentElementIndex];

    if (tool === "pencil") {
      if (!currentElement.path) currentElement.path = [];
      currentElement.path.push([coords.x, coords.y]);
      bufferRef.current.push(currentElement);
      
      // Only emit every few points to reduce network traffic
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

    updatedElements[currentElementIndex] = currentElement;
    setElements(updatedElements);
    
    // Use requestAnimationFrame for smooth rendering
    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(redrawCanvas);
  }, [elements, tool, getCanvasCoordinates, debouncedEmit, redrawCanvas]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault(); // Prevent focus issues
    if (!drawingRef.current) return;
    
    drawingRef.current = false;
    setIsDrawing(false);
    bufferRef.current = [];
    
    const currentElement = elements[elements.length - 1];
    socket.emit("drawing", currentElement); // Final emit without debounce
    debouncedEmit.cancel(); // Cancel any pending debounced emits
  }, [elements, socket, debouncedEmit]);

  useEffect(() => {
    const handleResize = debounce(() => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas();
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [redrawCanvas]);

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
        style={{ touchAction: 'none' }} // Prevent touch scrolling
      />
    </div>
  );
};

export default Canvas;