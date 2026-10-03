import Stripe from 'stripe';
import Booking from '../models/Booking.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
export const paymentMode = () => (stripe ? 'stripe' : 'demo');

const ownBooking = async (req, res) => {
  const b = await Booking.findById(req.body.bookingId).populate('room', 'name');
  if (!b || String(b.user) !== String(req.user._id)) { res.status(404); throw new Error('Booking not found'); }
  if (b.status === 'cancelled') { res.status(400); throw new Error('Booking is cancelled'); }
  if (b.paymentStatus === 'paid') { res.status(400); throw new Error('Booking is already paid'); }
  return b;
};

export const mode = (_req, res) => res.json({ mode: paymentMode() });

// Step 1: start payment
export const createCheckout = async (req, res) => {
  const b = await ownBooking(req, res);
  if (!stripe) return res.json({ mode: 'demo' });
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: b.nights,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round((b.totalPrice / b.nights) * 100),
        product_data: { name: `${b.room.name} - nightly rate` },
      },
    }],
    metadata: { bookingId: String(b._id) },
    success_url: `${process.env.CLIENT_URL}/payment/success?booking=${b._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/bookings`,
  });
  res.json({ mode: 'stripe', url: session.url });
};

// Step 2: confirm payment and confirm the booking
export const confirmPayment = async (req, res) => {
  const b = await ownBooking(req, res);
  let paymentId;
  if (stripe) {
    const session = await stripe.checkout.sessions.retrieve(req.body.sessionId);
    if (session.payment_status !== 'paid' || session.metadata.bookingId !== String(b._id)) {
      res.status(400); throw new Error('Payment not completed');
    }
    paymentId = session.payment_intent;
  } else {
    paymentId = `demo_${Date.now()}`;
  }
  b.paymentStatus = 'paid';
  b.status = 'confirmed';
  b.paymentId = paymentId;
  b.paidAt = new Date();
  await b.save();
  res.json(b);
};

export async function refundPayment(booking) {
  if (stripe && booking.paymentId && !booking.paymentId.startsWith('demo_')) {
    try { await stripe.refunds.create({ payment_intent: booking.paymentId }); }
    catch (e) { console.error('Refund failed', e.message); }
  }
}
