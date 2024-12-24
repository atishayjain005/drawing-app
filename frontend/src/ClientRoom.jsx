import React, { useEffect, useRef,useState } from "react";
import { toast } from "react-toastify";
import Canvas from "./Canvas"; // Reuse the same Canvas component

const ClientRoom = ({ userNo, socket, setUsers, setUserNo }) => {
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState("pencil");

  useEffect(() => {
    socket.on("message", (data) => {
      toast.info(data.message);
    });

    socket.on("users", (data) => {
      setUsers(data);
      setUserNo(data.length);
    });

    socket.on('drawingEvent', (data) => {
      setElements(prevElements => [...prevElements, data]);
    });

    return () => {
      socket.off("message");
      socket.off("users");
      socket.off("drawingEvent");
    };
  }, []);

  useEffect(() => {
    if (elements.length > 0) {
      socket.emit('drawing', elements[elements.length - 1]);
    }
  }, [elements]);

  return (
    <div className="container-fluid">
      <div className="row pb-2">
        <h1 className="display-5 pt-4 pb-3 text-center">
          React Drawing App - users online:{userNo}
        </h1>
      </div>
      <div className="row justify-content-center align-items-center text-center py-2">
        <div className="col-md-2">
          <div className="color-picker d-flex align-items-center justify-content-center">
            Color Picker : &nbsp;
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="tools"
              id="pencil"
              value="pencil"
              checked={tool === "pencil"}
              onChange={(e) => setTool(e.target.value)}
            />
            <label className="form-check-label" htmlFor="pencil">
              Pencil
            </label>
          </div>
          {/* Add other tools similar to Room component */}
        </div>
      </div>
      <div className="row">
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
    </div>
  );
};

export default ClientRoom;