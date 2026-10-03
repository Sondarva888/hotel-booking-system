import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { errMsg, fmtDate, money, today } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import DateGuestForm from '../components/DateGuestForm.jsx';
import { Stars } from '../components/RoomCard.jsx';

export default function RoomDetails() {
  const { id } = useParams();
  const [qs] = useSearchParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [v, set] = useState({ checkIn: qs.get('checkIn') || today(1), checkOut: qs.get('checkOut') || today(3), guests: qs.get('guests') || 1 });
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/rooms/${id}`).then((r) => { setRoom(r.data.room); setReviews(r.data.reviews); });
  }, [id]);

  // live price + availability quote
  useEffect(() => {
    setQuote(null);
    if (!v.checkIn || !v.checkOut || v.checkOut <= v.checkIn) return;
    api.get(`/rooms/${id}/availability`, { params: v }).then((r) => setQuote(r.data)).catch(() => {});
  }, [id, v.checkIn, v.checkOut]);

  const book = async () => {
    if (!user) return nav('/login');
    setBusy(true); setMsg('');
    try {
      await api.post('/bookings', { roomId: id, ...v, specialRequests: notes });
      nav('/bookings');
    } catch (e) { setMsg(errMsg(e)); } finally { setBusy(false); }
  };

  if (!room) return <p className="center muted">Loading...</p>;

  return (
    <div className="wrap detail">
      <div>
        <div className="detail-img" style={{ backgroundImage: `url(${room.images?.[0] || ''})` }} />
        <h1>{room.name}</h1>
        <p className="muted">Room {room.number}, {room.type}, sleeps {room.capacity}</p>
        <Stars value={room.rating} count={room.numReviews} />
        <p className="lead">{room.description}</p>
        <ul className="chips">{room.amenities.map((a) => <li key={a}>{a}</li>)}</ul>

        <h2>Guest reviews</h2>
        {reviews.length === 0 && <p className="muted">No reviews yet. Guests can review after their stay.</p>}
        {reviews.map((r) => (
          <article className="review" key={r._id}>
            <div className="row between"><strong>{r.user?.name}</strong><small className="muted">{fmtDate(r.createdAt)}</small></div>
            <Stars value={r.rating} />
            <p>{r.comment}</p>
          </article>
        ))}
      </div>

      <aside className="panel sticky">
        <h3>{money(room.pricePerNight)} <small className="muted">/ night</small></h3>
        <DateGuestForm v={v} set={set} />
        <label>Special requests
          <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Late arrival, extra pillows..." />
        </label>
        {quote && (quote.available ? (
          <p className="quote">{quote.nights} night{quote.nights > 1 ? 's' : ''}: <strong>{money(quote.totalPrice)}</strong></p>
        ) : <p className="error">Not available for those dates. Try different dates.</p>)}
        {msg && <p className="error">{msg}</p>}
        <button className="btn block" disabled={busy || !quote?.available} onClick={book}>
          {user ? 'Reserve this room' : 'Sign in to reserve'}
        </button>
        <small className="muted">You pay in the next step. Unpaid reservations are held for 30 minutes.</small>
      </aside>
    </div>
  );
}
