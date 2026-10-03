import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

export const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const b = await Booking.findById(bookingId);
  if (!b || String(b.user) !== String(req.user._id)) { res.status(404); throw new Error('Booking not found'); }
  const stayDone = b.status === 'completed' || (b.paymentStatus === 'paid' && b.checkOut < new Date() && b.status !== 'cancelled');
  if (!stayDone) { res.status(400); throw new Error('You can review a room after your stay'); }
  if (await Review.exists({ booking: b._id })) { res.status(400); throw new Error('You already reviewed this stay'); }
  const review = await Review.create({ user: req.user._id, room: b.room, booking: b._id, rating, comment });
  await Review.recalc(b.room);
  res.status(201).json(review);
};

export const deleteReview = async (req, res) => {
  const r = await Review.findById(req.params.id);
  if (!r) { res.status(404); throw new Error('Review not found'); }
  if (String(r.user) !== String(req.user._id) && req.user.role !== 'admin') { res.status(403); throw new Error('Not allowed'); }
  await r.deleteOne();
  await Review.recalc(r.room);
  res.json({ message: 'Review deleted' });
};

export const allReviews = async (_req, res) =>
  res.json(await Review.find().populate('user', 'name').populate('room', 'name').sort('-createdAt'));
