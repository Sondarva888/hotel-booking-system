import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  number: { type: String, required: true, unique: true },
  type: { type: String, enum: ['single', 'double', 'suite', 'family', 'deluxe'], required: true },
  description: { type: String, required: true },
  pricePerNight: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  amenities: [String],
  images: [String],
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
}, { timestamps: true });

roomSchema.index({ type: 1, pricePerNight: 1 });
export default mongoose.model('Room', roomSchema);
