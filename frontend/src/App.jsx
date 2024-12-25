import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import io from "socket.io-client";
// import ClientRoom from "./ClientRoom";
import JoinCreateRoom from "./components/JoinCreateRoom";
import Room from "./components/Room";
import { v4 as uuid } from "uuid";

import "./index.css";

const server = process.env.REACT_APP_BACKEND_URL || "https://drawing-app-91bo.onrender.com" || "http://localhost:5000";
const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io(server, connectionOptions);

const App = () => {
  const [userNo, setUserNo] = useState(0);
  const [roomJoined, setRoomJoined] = useState(false);
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (roomJoined) {
      socket.emit("user-joined", user);
    }
  }, [roomJoined]);

  return (
    <div className="home">
      {/* <ToastContainer /> */}
      {roomJoined ? (
        <>
          {/* <Sidebar users={users} user={user} socket={socket} /> */}
          {/* {user.presenter ? ( */}
          <Room
            userNo={userNo}
            user={user}
            users={users}
            socket={socket}
            setUsers={setUsers}
            setUserNo={setUserNo}
            roomId={roomId}
          />
          {/* ) : (
            <ClientRoom
              userNo={userNo}
              user={user}
              socket={socket}
              setUsers={setUsers}
              setUserNo={setUserNo}
            />
          )} */}
        </>
      ) : (
        <JoinCreateRoom
          uuid={uuid}
          setRoomJoined={setRoomJoined}
          setUser={setUser}
          setGlobalRoomId={setRoomId}
        />
      )}
    </div>
  );
};
export default App;
