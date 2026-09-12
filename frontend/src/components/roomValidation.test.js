import { describe, expect, test } from "vitest";
import { validateCreateRoom, validateJoinRoom } from "./roomValidation";

describe("room form validation", () => {
  test("rejects a create request without a display name", () => {
    expect(validateCreateRoom({ name: "   ", roomId: "room-1" })).toEqual({
      ok: false,
      message: "Please enter your name!",
    });
  });

  test("rejects a join request without a room id", () => {
    expect(validateJoinRoom({ name: "Asha", roomId: "   " })).toEqual({
      ok: false,
      message: "Please enter a room ID!",
    });
  });

  test("trims valid create and join form values", () => {
    expect(validateCreateRoom({ name: " Asha ", roomId: " room-1 " })).toEqual({
      ok: true,
      name: "Asha",
      roomId: "room-1",
    });

    expect(validateJoinRoom({ name: " Dev ", roomId: " room-2 " })).toEqual({
      ok: true,
      name: "Dev",
      roomId: "room-2",
    });
  });
});
