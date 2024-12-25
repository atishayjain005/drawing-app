// Room.jsx

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
}) => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState("#000000"); // Default color, will be overwritten
  const [tool, setTool] = useState("pencil");
  const [isInRoom, setIsInRoom] = useState(true); // Track if user is in the room

  console.log(userNo);

  // Listen for messages from the server
  useEffect(() => {
    const handleMessage = (data) => {
      toast.info(data.message);
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);

  // Listen for user list updates and set the current user's color
  useEffect(() => {
    const handleUsers = (data) => {
      setUsers(data);
      setUserNo(data.length);

      // Find the current user based on socket ID
      const currentUser = data.find((user) => user.id === socket.id);
      if (currentUser && currentUser.color) {
        setColor(currentUser.color);
      }
    };

    socket.on("users", handleUsers);

    return () => {
      socket.off("users", handleUsers);
    };
  }, [socket, setUsers, setUserNo]);

  // Implement the leaveRoom function
  const handleLeaveRoom = () => {
    // Emit a "leave room" event to the server
    socket.emit("leave room", { roomId, userId: socket.id });

    // Optionally, you can also emit a disconnect event
    socket.disconnect();

    // Update the component state to reflect that the user has left
    setIsInRoom(false);

    // Optionally, show a toast notification
    toast.success("You have left the room.");
  };

  // Optionally, handle socket disconnect/reconnect if needed
  useEffect(() => {
    const handleDisconnect = () => {
      console.log("Socket disconnected.");
    };

    const handleReconnect = () => {
      console.log("Socket reconnected.");
      // Optionally, rejoin the room if needed
      // socket.emit("join room", { roomId, userId: socket.id, ... });
    };

    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect", handleReconnect);

    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", handleReconnect);
    };
  }, [socket]);

  if (!isInRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-800 ">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">You have left the room.</h1>
          <button
            onClick={() => {
              // Optionally, reload the page or navigate to a different component/state
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg shadow-md bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-200"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* Main Content */}
      <div className="flex relative justify-between p-4 m-4 shadow-md bg-zinc-800 rounded-lg text-white">
        {/* Top Bar with Leave Button and Active Users */}
        <div className="flex space-x-4 items-center">
          <h2 className="text-lg font-semibold text-white">
            Active Users ({userNo}):
          </h2>
          <div className="flex space-x-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center space-y-1"
                title={user.username}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: user.color || "#000000" }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={handleLeaveRoom}
          className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          title="Leave Room"
        >
          <FaSignOutAlt className="mr-2" />
          Leave
        </button>
      </div>

      <div
        className="w-full flex justify-between items-start p-4"
        style={{ minHeight: "80vh" }}
      >
        {/* Toolbar */}
        <div className="w-20 bg-zinc-800 rounded-lg text-white flex flex-col items-center p-0">
          {[
            { id: "pencil", icon: <FaPencilAlt size={20} />, label: "Pencil" },
            { id: "line", icon: <FaMinus size={20} />, label: "Line" },
            {
              id: "rect",
              icon: <FaDrawPolygon size={20} />,
              label: "Rectangle",
            },
          ].map(({ id, icon, label }) => (
            <React.Fragment key={id}>
              <button
                onClick={() => setTool(id)}
                className={`flex flex-col items-center justify-center px-2 py-4 focus-visible:outline-none focus-visible:border-0 focus:outline-none w-full ${
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
              <hr
                className="border-t border-zinc-600 w-full"
                style={{ borderTop: "solid 1px #52525b" }}
              />
            </React.Fragment>
          ))}

          {/* Display Current User's Color */}
          <div className="flex flex-col items-center justify-center px-2 py-4 w-full rounded-none">
            <div
              className="h-8 w-full cursor-default bg-transparent border-none flex items-center justify-center"
              title="Your Assigned Color"
            >
              <div
                className="h-6 w-6 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              ></div>
            </div>
            <span className="text-xs pt-1">Color</span>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="bg-white shadow-md rounded-lg border border-gray-200 ml-4 mb-4 w-full h-full"
          style={{ minHeight: "80vh" }}
        >
          <Canvas
            canvasRef={canvasRef}
            color={color}
            tool={tool}
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
};

export default Room;
