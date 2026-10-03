import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import { isRoomFree, parseRange } from '../utils/availability.js';
import { refundPayment } from './payments.js';

export const createBooking = async (req, res) => {
  const { roomId, checkIn, checkOut, guests, specialRequests } = req.body;
  const room = await Room.findById(roomId);
  if (!room || !room.isActive) { res.status(404); throw new Error('Room not available'); }

  const r = parseRange(checkIn, checkOut);
  if (r.nights < 1) { res.status(400); throw new Error('Check-out must be after check-in'); }
  if (r.checkIn < new Date(Date.now() - 86400000)) { res.status(400); throw new Error('Check-in cannot be in the past'); }
  if (+guests > room.capacity) { res.status(400); throw new Error(`This room sleeps up to ${room.capacity} guests`); }
  if (!(await isRoomFree(room._id, r.checkIn, r.checkOut))) { res.status(409); throw new Error('Room is not available for those dates'); }

  // price always computed on the server
  const booking = await Booking.create({
    user: req.user._id, room: room._id, checkIn: r.checkIn, checkOut: r.checkOut,
    guests, nights: r.nights, totalPrice: r.nights * room.pricePerNight, specialRequests,
  });
  res.status(201).json(booking);
};

export const myBookings = async (req, res) =>
  res.json(await Booking.find({ user: req.user._id }).populate('room', 'name number type images').sort('-createdAt'));

export const getBooking = async (req, res) => {
  const b = await Booking.findById(req.params.id).populate('room').populate('user', 'name email');
  if (!b) { res.status(404); throw new Error('Booking not found'); }
  if (String(b.user._id) !== String(req.user._id) && req.user.role !== 'admin') { res.status(403); throw new Error('Not allowed'); }
  res.json(b);
};

export const cancelBooking = async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b) { res.status(404); throw new Error('Booking not found'); }
  const isOwner = String(b.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') { res.status(403); throw new Error('Not allowed'); }
  if (!['pending', 'confirmed'].includes(b.status)) { res.status(400); throw new Error(`Cannot cancel a ${b.status} booking`); }
  if (isOwner && req.user.role !== 'admin' && b.checkIn < new Date()) { res.status(400); throw new Error('Stay has already started'); }

  b.status = 'cancelled';
  if (b.paymentStatus === 'paid') { await refundPayment(b); b.paymentStatus = 'refunded'; }
  await b.save();
  res.json(b);
};
