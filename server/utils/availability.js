import Booking from '../models/Booking.js';

const HOLD_MINUTES = 30; // unpaid pending bookings release the room after this

// Statuses that currently block a room for a date range
const blockingFilter = () => ({
  $or: [
    { status: { $in: ['confirmed', 'checked_in'] } },
    { status: 'pending', createdAt: { $gt: new Date(Date.now() - HOLD_MINUTES * 60 * 1000) } },
  ],
});

// Ids of rooms that are booked anywhere within [checkIn, checkOut)
export async function bookedRoomIds(checkIn, checkOut) {
  return Booking.distinct('room', {
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
    ...blockingFilter(),
  });
}

export async function isRoomFree(roomId, checkIn, checkOut, excludeBookingId) {
  const q = { room: roomId, checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn }, ...blockingFilter() };
  if (excludeBookingId) q._id = { $ne: excludeBookingId };
  return !(await Booking.exists(q));
}

export function parseRange(checkIn, checkOut) {
  const a = new Date(checkIn), b = new Date(checkOut);
  if (isNaN(a) || isNaN(b)) throw Object.assign(new Error('Invalid dates'), { status: 400 });
  a.setUTCHours(12, 0, 0, 0); b.setUTCHours(12, 0, 0, 0);
  const nights = Math.round((b - a) / 86400000);
  return { checkIn: a, checkOut: b, nights };
}
