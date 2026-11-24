import { describe, expect, it } from "vitest";
import { canRescheduleWorkout, workoutForDate } from "@/lib/fittrack-data";

describe("moving a missed workout", () => {
  it("only allows moving a past workout to a later day in the same week", () => {
    expect(canRescheduleWorkout("2026-11-17", "2026-11-20", "2026-11-18")).toBe(true);
    expect(canRescheduleWorkout("2026-11-17", "2026-11-24", "2026-11-18")).toBe(false);
    expect(canRescheduleWorkout("2026-11-17", "2026-11-18", "2026-11-18")).toBe(true);
    expect(canRescheduleWorkout("2026-11-19", "2026-11-17", "2026-11-18")).toBe(false);
  });
  it("shows the moved workout on its new day", () => {
    const moves = { "2026-11-17": "2026-11-20" };
    expect(workoutForDate("2026-11-20", moves)?.type).toBe("Workout A");
    expect(workoutForDate("2026-11-17", moves)?.type).toBe("Moved");
  });
});

import { exercisesForDate, workoutForDate as plan } from "@/lib/fittrack-data";
describe("single exercise moves", () => {
  it("moves one exercise from Tuesday to Wednesday", () => {
    const tue = plan("2026-11-24");
    const moves = { [`2026-11-24|${tue.exercises[0]}`]: "2026-11-25" };
    expect(exercisesForDate("2026-11-24", tue, moves).map((x) => x.ex)).not.toContain(tue.exercises[0]);
    expect(exercisesForDate("2026-11-25", plan("2026-11-25"), moves)).toEqual([{ ex: tue.exercises[0], from: "2026-11-24" }]);
  });
});
