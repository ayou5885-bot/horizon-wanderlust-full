export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const n = Math.round(ms / 86400000);
  return n > 0 ? n : 0;
}

/** Hotel estimate: nights × price per night × rooms. */
export function hotelEstimate(checkIn: string, checkOut: string, pricePerNight: number, rooms: number): number {
  return nightsBetween(checkIn, checkOut) * pricePerNight * Math.max(0, rooms);
}

export function seatsRemaining(d: { seats_total: number; seats_booked: number }) {
  return Math.max(0, d.seats_total - d.seats_booked);
}

export function isFullyBooked(d: { seats_total: number; seats_booked: number }) {
  return d.seats_booked >= d.seats_total;
}

export function generateTrackingToken(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
