# Saltmarsh Harbour: Hotel Booking & Management System (MERN)

A full-stack hotel app: guests search by date, book rooms, pay and review their stay; admins manage rooms, bookings, guests and reviews.

## Features
**Guests**
- Register / login (JWT, bcrypt)
- Search rooms by dates, guests, type, price, keyword; sort by price or rating
- Live availability and price quote on each room page
- Book a room (price computed on the server; double-booking is prevented)
- Pay with Stripe Checkout, or the built-in demo payment when no Stripe key is set
- View and cancel bookings (paid cancellations are marked refunded and refunded in Stripe)
- Review a room after the stay; room rating updates automatically

**Admin** (`/admin`)
- Dashboard: revenue, bookings, occupancy today, monthly revenue chart
- Room CRUD (rooms are hidden, not deleted, so history stays intact)
- Booking workflow: pending → confirmed → checked in → completed (or cancelled)
- Guest list and review moderation

## Tech
MongoDB + Mongoose, Express, React 18 (Vite, React Router), Node 18+, JWT, Stripe.

## Setup
Requirements: Node 18+, MongoDB running locally (or an Atlas URI).

```bash
npm run install:all          # installs root, server and client deps
# edit server/.env (already copied from .env.example)
npm run seed                 # sample rooms + demo users
npm run dev                  # API on :5000, web on :5173
```

Demo accounts after seeding:
- Admin: `admin@hotel.com` / `admin123`
- Guest: `guest@hotel.com` / `guest123` (has a completed stay, so you can try a review)

## Stripe (optional)
Put your test key in `server/.env`:
```
STRIPE_SECRET_KEY=sk_test_...
```
Pay with test card `4242 4242 4242 4242`. After Stripe redirects back, the server verifies the session before confirming the booking. Without a key, "Pay now" uses a demo confirmation.

## Project structure
```
server/
  models/        User, Room, Booking, Review
  controllers/   auth, rooms, bookings, payments, reviews, admin
  routes/        one router per resource
  middleware/    auth (protect, adminOnly), error handling
  utils/         availability (overlap check, 30-minute hold), token
  seed.js
client/src/
  pages/         Home, Rooms, RoomDetails, AuthPages, MyBookings, PaymentSuccess, Admin
  components/    Navbar, RoomCard, DateGuestForm
  context/       AuthContext
```

## API summary
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me`, PUT `/api/auth/profile` | user |
| GET | `/api/rooms` (filters: type, minPrice, maxPrice, guests, search, sort, checkIn, checkOut, page) | public |
| GET | `/api/rooms/:id`, `/api/rooms/:id/availability` | public |
| POST/PUT/DELETE | `/api/rooms`, `/api/rooms/:id` | admin |
| POST | `/api/bookings` | user |
| GET | `/api/bookings/mine`, `/api/bookings/:id` | user |
| PUT | `/api/bookings/:id/cancel` | owner/admin |
| POST | `/api/payments/checkout`, `/api/payments/confirm` | user |
| POST | `/api/reviews` | user (after stay) |
| DELETE | `/api/reviews/:id` | owner/admin |
| GET | `/api/admin/stats`, `/bookings`, `/users`, `/reviews` | admin |
| PUT | `/api/admin/bookings/:id/status` | admin |

## Ideas to extend
Image uploads (Cloudinary), email confirmations (Nodemailer), Stripe webhooks, room calendars, coupon codes, multi-room bookings.
