import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FaPencilAlt,
  FaDrawPolygon,
  FaMinus,
  FaSignOutAlt,
} from "react-icons/fa";
import Canvas from "./Canvas";

const Room = ({
  roomId,
  userNo,
  users,
  socket,
  setUsers,
  setUserNo,
  leaveRoom,
}) => {
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState("pencil");

  useEffect(() => {
    socket.on("message", (data) => {
      toast.info(data.message);
    });
  }, [socket]);

  useEffect(() => {
    socket.on("users", (data) => {
      setUsers(data);
      setUserNo(data.length);
    });
  }, [socket, setUsers, setUserNo]);

  useEffect(() => {
    socket.on("drawingEvent", (data) => {
      setElements((prevElements) => [...prevElements, data]);
    });

    return () => {
      socket.off("drawingEvent");
    };
  }, [socket]);

  useEffect(() => {
    if (elements.length > 0) {
      socket.emit("drawing", elements[elements.length - 1]);
    }
  }, [elements, socket]);

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* Toolbar */}

      {/* Main Content */}
      <div className="flex relative justify-between p-4 m-4 shadow-md bg-zinc-800 rounded-lg text-white">
        {/* Top Bar with Leave Button and Active Users */}
        <div className="flex space-x-4 items-center">
          <h2 className="text-lg font-semibold text-white">Active Users:</h2>
          <div className="flex space-x-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center space-y-1"
                title={user.name}
              >
                <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {user?.id?.charAt(0).toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={leaveRoom}
          className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          title="Leave Room"
        >
          <FaSignOutAlt className="mr-2" />
          Leave
        </button>
      </div>
      <div
        className="w-full flex  justify-between items-start p-4"
        style={{ minHeight: "80vh" }}
      >
        <div className="w-20 bg-zinc-800 rounded-lg text-white flex flex-col items-center p-0  ">
          {[
            { id: "pencil", icon: <FaPencilAlt size={20} />, label: "Pencil" },
            { id: "line", icon: <FaMinus size={20} />, label: "Line" },
            {
              id: "rect",
              icon: <FaDrawPolygon size={20} />,
              label: "Rectangle",
            },
          ].map(({ id, icon, label }) => (
            <>
              <button
                key={id}
                onClick={() => setTool(id)}
                className={`flex flex-col items-center justify-center px-2 py-4 focus-visible:outline-none focus-visible:border-0 focus:outline-none  w-full  ${
                  id === "pencil" ? `rounded-t-lg` : "rounded-none"
                } ${
                  tool === id
                    ? "bg-zinc-700"
                    : "hover:bg-zinc-900 transition-colors duration-200"
                }`}
                title={label}
              >
                {icon}
                <span className="text-xs pt-1">{label}</span>
              </button>
              <hr className="border-t border-zinc-600 w-full" style={{borderTop:"solid 1px #52525b"}} />
              {/* Color Picker */}
            </>
          ))}
          <div className=" flex flex-col items-center justify-center px-2 py-4  w-full rounded-none">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className=" h-8 border-none cursor-pointer bg-transparent w-full"
              title="Choose Color"
            />
            <span className="text-xs pt-1">Color</span>
          </div>
        </div>

        {/* Canvas */}
        <div
          className=" bg-white shadow-md rounded-lg border border-gray-200 ml-4 mb-4 w-full h-full"
          style={{ minHeight: "80vh" }}
        >
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
    </div>
  );
};

export default Room;
