import React, { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { GrRefresh } from "react-icons/gr";
import { MdOutlineContentCopy } from "react-icons/md";
import { toast } from "react-toastify";

const JoinCreateRoom = ({ uuid, setUser, setRoomJoined, setGlobalRoomId }) => {
  const [activeTab, setActiveTab] = useState("create"); // State to track active tab
  const [name, setName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [roomId, setRoomId] = useState(uuid());

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name) return toast.dark("Please enter your name!");

    setUser({
      roomId,
      userId: uuid(),
      userName: name,
      host: true,
      presenter: true,
    });
    setRoomJoined(true);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinName) return toast.dark("Please enter your name!");

    setUser({
      roomId: joinRoomId,
      userId: uuid(),
      userName: joinName,
      host: false,
      presenter: false,
    });
    setRoomJoined(true);
  };

  useEffect(() => {
    if (roomId) {
      setGlobalRoomId(roomId);
    }
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-800 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-gray-800 dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-12">
        {/* Heading Section */}
        <h1 className="text-3xl font-extrabold text-white text-center mb-6">
          Realtime Whiteboard Sharing
        </h1>

        {/* Tab Navigation */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2 px-4 text-center rounded-tl-2xl rounded-bl-2xl ${
              activeTab === "create"
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            } transition-colors duration-300`}
          >
            Create Room
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-2 px-4 text-center rounded-tr-2xl rounded-br-2xl ${
              activeTab === "join"
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            } transition-colors duration-300`}
          >
            Join Room
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-gray-700 dark:bg-gray-800 rounded-xl p-6">
          {activeTab === "create" ? (
            /* Create Room Form */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Your Name Input */}
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Room ID and Buttons */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={roomId}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setRoomId(uuid())}
                  className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center justify-center"
                  aria-label="Generate Room ID"
                >
                  {/* Refresh Icon */}
                  <GrRefresh />
                </button>
                <CopyToClipboard
                  text={roomId}
                  onCopy={() => toast.success("Room ID copied to clipboard!")}
                >
                  <button
                    type="button"
                    className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center justify-center"
                    aria-label="Copy Room ID"
                  >
                    {/* Clipboard Icon */}
                    <MdOutlineContentCopy />
                  </button>
                </CopyToClipboard>
              </div>

              {/* Create Room Button */}
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition"
              >
                Create Room
              </button>
            </form>
          ) : (
            /* Join Room Form */
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              {/* Your Name Input */}
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 bg-white"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                />
              </div>

              {/* Room ID Input */}
              <div>
                <input
                  type="text"
                  placeholder="Room ID"
                  className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 bg-white"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
              </div>

              {/* Join Room Button */}
              <button
                type="submit"
                className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition"
              >
                Join Room
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinCreateRoom;
