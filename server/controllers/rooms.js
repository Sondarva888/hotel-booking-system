import Room from '../models/Room.js';
import Review from '../models/Review.js';
import { bookedRoomIds, isRoomFree, parseRange } from '../utils/availability.js';

export const listRooms = async (req, res) => {
  const { type, minPrice, maxPrice, guests, search, sort, checkIn, checkOut, page = 1, limit = 12 } = req.query;
  const q = { isActive: true };
  if (type) q.type = type;
  if (guests) q.capacity = { $gte: +guests };
  if (minPrice || maxPrice) q.pricePerNight = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
  if (search) q.$or = [{ name: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }];

  if (checkIn && checkOut) {
    const r = parseRange(checkIn, checkOut);
    if (r.nights < 1) { res.status(400); throw new Error('Check-out must be after check-in'); }
    q._id = { $nin: await bookedRoomIds(r.checkIn, r.checkOut) };
  }
  const sorts = { price_asc: { pricePerNight: 1 }, price_desc: { pricePerNight: -1 }, rating: { rating: -1 } };
  const [rooms, total] = await Promise.all([
    Room.find(q).sort(sorts[sort] || { createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
    Room.countDocuments(q),
  ]);
  res.json({ rooms, total, pages: Math.ceil(total / limit) });
};

export const getRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) { res.status(404); throw new Error('Room not found'); }
  const reviews = await Review.find({ room: room._id }).populate('user', 'name').sort('-createdAt');
  res.json({ room, reviews });
};

export const checkAvailability = async (req, res) => {
  const { checkIn, checkOut } = req.query;
  const r = parseRange(checkIn, checkOut);
  if (r.nights < 1) { res.status(400); throw new Error('Check-out must be after check-in'); }
  const room = await Room.findById(req.params.id);
  if (!room) { res.status(404); throw new Error('Room not found'); }
  const available = await isRoomFree(room._id, r.checkIn, r.checkOut);
  res.json({ available, nights: r.nights, totalPrice: r.nights * room.pricePerNight });
};

// ---- admin
export const createRoom = async (req, res) => res.status(201).json(await Room.create(req.body));

export const updateRoom = async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!room) { res.status(404); throw new Error('Room not found'); }
  res.json(room);
};

export const deleteRoom = async (req, res) => {
  // soft delete keeps booking history intact
  const room = await Room.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!room) { res.status(404); throw new Error('Room not found'); }
  res.json({ message: 'Room deactivated' });
};

export const adminListRooms = async (_req, res) => res.json(await Room.find().sort('number'));
