const { getUsers, resetUsersForTest, userJoin, userLeave } = require("./user");

describe("user room registry", () => {
  beforeEach(() => {
    resetUsersForTest();
  });

  test("assigns the first available color within each room", () => {
    const roomOneUser = userJoin("socket-1", "Asha", "room-one", true, true);
    const roomTwoUser = userJoin("socket-2", "Dev", "room-two", true, true);

    expect(roomOneUser.color).toBe("#e6194b");
    expect(roomTwoUser.color).toBe("#e6194b");
  });

  test("reuses a room color after the user leaves", () => {
    const firstUser = userJoin("socket-1", "Asha", "room-one", true, true);
    userJoin("socket-2", "Dev", "room-one", false, false);

    userLeave(firstUser.id);
    const nextUser = userJoin("socket-3", "Mira", "room-one", false, false);

    expect(nextUser.color).toBe(firstUser.color);
    expect(getUsers("room-one")).toHaveLength(2);
  });
});
