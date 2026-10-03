import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Room from './models/Room.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;
const rooms = [
  { name: 'Harbour Single', number: '101', type: 'single', pricePerNight: 79, capacity: 1, description: 'A quiet single room with a work desk, rain shower and a view over the marina.', amenities: ['WiFi', 'Air conditioning', 'Desk', 'Rain shower'], images: [img('photo-1631049307264-da0ec9d70304')] },
  { name: 'Lantern Double', number: '204', type: 'double', pricePerNight: 129, capacity: 2, description: 'A king bed, linen curtains and a small balcony facing the courtyard garden.', amenities: ['WiFi', 'Air conditioning', 'Balcony', 'Minibar'], images: [img('photo-1618773928121-c32242e63f39')] },
  { name: 'Tidewater Family Room', number: '305', type: 'family', pricePerNight: 189, capacity: 4, description: 'Two queen beds, a reading nook and a connecting door for larger groups.', amenities: ['WiFi', 'Air conditioning', 'Kids amenities', 'Kettle'], images: [img('photo-1611892440504-42a792e24d32')] },
  { name: 'Brass Deluxe', number: '402', type: 'deluxe', pricePerNight: 249, capacity: 2, description: 'Corner room with floor-to-ceiling windows, a soaking tub and a lounge area.', amenities: ['WiFi', 'Air conditioning', 'Bathtub', 'Coffee machine', 'Lounge'], images: [img('photo-1590490360182-c33d57733427')] },
  { name: 'Captain\'s Suite', number: '501', type: 'suite', pricePerNight: 399, capacity: 3, description: 'Top-floor suite with a separate living room, dining table and private terrace.', amenities: ['WiFi', 'Air conditioning', 'Terrace', 'Kitchenette', 'Butler on call'], images: [img('photo-1582719478250-c89cae4dc85b')] },
];

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany(), Room.deleteMany(), Booking.deleteMany(), Review.deleteMany()]);

await User.create({ name: 'Hotel Admin', email: 'admin@hotel.com', password: 'admin123', role: 'admin' });
const guest = await User.create({ name: 'Demo Guest', email: 'guest@hotel.com', password: 'guest123' });
const created = await Room.insertMany(rooms);

// one completed stay so the review flow can be tried straight away
const day = 86400000;
const b = await Booking.create({
  user: guest._id, room: created[1]._id, guests: 2, nights: 2, totalPrice: created[1].pricePerNight * 2,
  checkIn: new Date(Date.now() - 6 * day), checkOut: new Date(Date.now() - 4 * day),
  status: 'completed', paymentStatus: 'paid', paymentId: 'demo_seed', paidAt: new Date(Date.now() - 8 * day),
});
console.log('Seeded.\n  admin@hotel.com / admin123\n  guest@hotel.com / guest123');
console.log('Demo guest has a completed booking (', String(b._id), ') ready to review.');
await mongoose.disconnect();
