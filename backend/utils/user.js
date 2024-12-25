// utils/user.js

const users = [];

// Predefined color palette
const COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8",
  "#f58231", "#911eb4", "#46f0f0", "#f032e6",
  "#bcf60c", "#fabebe", "#008080", "#e6beff",
  "#9a6324", "#fffac8", "#800000", "#aaffc3",
  "#808000", "#ffd8b1", "#000075", "#808080"
];

// Function to get an available color
const getAvailableColor = () => {
  const usedColors = users.map(user => user.color);
  const availableColors = COLORS.filter(color => !usedColors.includes(color));
  // If all predefined colors are used, generate a random color
  if (availableColors.length === 0) {
    return `#${Math.floor(Math.random()*16777215).toString(16)}`;
  }
  // Return the first available color
  return availableColors[0];
};

// Join user to chat
const userJoin = (id, username, room, host, presenter) => {
  const color = getAvailableColor();
  const user = { id, username, room, host, presenter, color };

  users.push(user);
  return user;
};

// User leaves chat
const userLeave = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    // Optionally, you can handle color reuse here
    return users.splice(index, 1)[0];
  }
};

// Get users in a room
const getUsers = (room) => {
  return users.filter(user => user.room === room);
};

module.exports = {
  userJoin,
  userLeave,
  getUsers,
};
