import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import io from "socket.io-client";
import JoinCreateRoom from "./components/JoinCreateRoom";
import Room from "./components/Room";
import { v4 as uuid } from "uuid";
import { getBackendUrl } from "./config";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

const server = getBackendUrl();
const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: Infinity,
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
  }, [roomJoined, user]);

  return (
    <div className="home">
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />
      {roomJoined ? (
        <>
          <Room
            userNo={userNo}
            user={user}
            users={users}
            socket={socket}
            setUsers={setUsers}
            setUserNo={setUserNo}
            roomId={roomId}
          />
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
