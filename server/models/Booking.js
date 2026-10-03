import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, min: 1 },
  nights: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  specialRequests: String,
  status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  paymentId: String,
  paidAt: Date,
}, { timestamps: true });

bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
export default mongoose.model('Booking', bookingSchema);
