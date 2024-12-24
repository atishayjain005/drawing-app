import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Canvas from "./Canvas";

const Room = ({ userNo, socket, setUsers, setUserNo }) => {
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("pencil");

  useEffect(() => {
    socket.on("message", (data) => {
      toast.info(data.message);
    });
  }, []);
  useEffect(() => {
    socket.on("users", (data) => {
      setUsers(data);
      setUserNo(data.length);
    });
  }, []);

  // Room.js - Add this to handle drawing events
useEffect(() => {
    socket.on('drawingEvent', (data) => {
      setElements(prevElements => [...prevElements, data]);
    });
  
    return () => {
      socket.off('drawingEvent');
    };
  }, [socket]);
  
  // When elements change, emit to all users
  useEffect(() => {
    if (elements.length > 0) {
      socket.emit('drawing', elements[elements.length - 1]);
    }
  }, [elements]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setElements([]);
  };

  const undo = () => {
    setHistory((prevHistory) => [
      ...prevHistory,
      elements[elements.length - 1],
    ]);
    setElements((prevElements) =>
      prevElements.filter((ele, index) => index !== elements.length - 1)
    );
  };
  const redo = () => {
    setElements((prevElements) => [
      ...prevElements,
      history[history.length - 1],
    ]);
    setHistory((prevHistory) =>
      prevHistory.filter((ele, index) => index !== history.length - 1)
    );
  };
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {/* Header */}
      <header className="w-full max-w-4xl mb-6">
        <h1 className="text-4xl font-extrabold text-center text-indigo-600">
          React Drawing App
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Users Online:{" "}
          <span className="font-semibold text-indigo-500">{userNo}</span>
        </p>
      </header>

      {/* Controls */}
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Color Picker */}
          <div className="flex items-center space-x-3">
            <label className="text-gray-700 font-medium">Choose Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>

          {/* Tool Selection */}
          <div className="flex items-center space-x-4">
            {[
              { id: "pencil", label: "Pencil" },
              { id: "line", label: "Line" },
              { id: "rect", label: "Rectangle" },
            ].map(({ id, label }) => (
              <label
                key={id}
                className="flex items-center space-x-2 text-gray-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="tools"
                  id={id}
                  value={id}
                  checked={tool === id}
                  onChange={(e) => setTool(e.target.value)}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="font-medium">{label}</span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              className={`flex items-center px-4 py-2 bg-indigo-500 text-white rounded-md shadow hover:bg-indigo-600 transition ${
                elements.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={elements.length === 0}
              onClick={undo}
            >
              Undo
            </button>
            <button
              type="button"
              className={`flex items-center px-4 py-2 bg-indigo-500 text-white rounded-md shadow hover:bg-indigo-600 transition ${
                history.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={history.length === 0}
              onClick={redo}
            >
              Redo
            </button>
            <button
              type="button"
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition"
              onClick={clearCanvas}
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-lg shadow-md">
        <Canvas
          canvasRef={canvasRef}
          ctx={ctx}
          color={color}
          setElements={setElements}
          elements={elements}
          tool={tool}
          socket={socket}
        />
      </div>

      {/* Toast Container (Ensure to include this in your main App component) */}
      {/* <ToastContainer position="top-right" autoClose={3000} hideProgressBar /> */}
    </div>
  );
};

export default Room;