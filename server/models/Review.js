import mongoose from 'mongoose';
import Room from './Room.js';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

// keep the room's average rating in sync
reviewSchema.statics.recalc = async function (roomId) {
  const [s] = await this.aggregate([
    { $match: { room: new mongoose.Types.ObjectId(roomId) } },
    { $group: { _id: '$room', avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  await Room.findByIdAndUpdate(roomId, { rating: s ? +s.avg.toFixed(1) : 0, numReviews: s ? s.n : 0 });
};

export default mongoose.model('Review', reviewSchema);
