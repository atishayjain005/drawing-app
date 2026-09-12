const invalid = (message) => ({ ok: false, message });

export const validateCreateRoom = ({ name, roomId }) => {
  const trimmedName = name.trim();
  const trimmedRoomId = roomId.trim();

  if (!trimmedName) {
    return invalid("Please enter your name!");
  }

  if (!trimmedRoomId) {
    return invalid("Please generate a room ID!");
  }

  return {
    ok: true,
    name: trimmedName,
    roomId: trimmedRoomId,
  };
};

export const validateJoinRoom = ({ name, roomId }) => {
  const trimmedName = name.trim();
  const trimmedRoomId = roomId.trim();

  if (!trimmedName) {
    return invalid("Please enter your name!");
  }

  if (!trimmedRoomId) {
    return invalid("Please enter a room ID!");
  }

  return {
    ok: true,
    name: trimmedName,
    roomId: trimmedRoomId,
  };
};
