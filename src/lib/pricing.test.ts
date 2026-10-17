import { describe, it, expect } from "vitest";
import { hotelEstimate, isFullyBooked, nightsBetween } from "./pricing";

describe("pricing rules", () => {
  it("hotel estimate is nights × price × rooms", () => {
    expect(hotelEstimate("2026-11-01", "2026-11-04", 10000, 2)).toBe(60000);
  });
  it("invalid date order gives zero nights", () => {
    expect(nightsBetween("2026-11-04", "2026-11-01")).toBe(0);
  });
  it("departure is fully booked when seats_booked >= seats_total", () => {
    expect(isFullyBooked({ seats_total: 20, seats_booked: 20 })).toBe(true);
    expect(isFullyBooked({ seats_total: 20, seats_booked: 19 })).toBe(false);
  });
});
