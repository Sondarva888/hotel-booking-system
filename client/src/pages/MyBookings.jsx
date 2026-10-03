import { useEffect, useState } from 'react';
import api, { errMsg, fmtDate, money } from '../api.js';

export function StatusBadge({ s }) {
  return <span className={`badge ${s}`}>{s.replace('_', ' ')}</span>;
}

function ReviewForm({ booking, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const send = async (e) => {
    e.preventDefault();
    try { await api.post('/reviews', { bookingId: booking._id, rating, comment }); onDone(); }
    catch (e) { setErr(errMsg(e)); }
  };
  return (
    <form className="inline-form" onSubmit={send}>
      <select value={rating} onChange={(e) => setRating(+e.target.value)}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && 's'}</option>)}
      </select>
      <input placeholder="How was your stay?" value={comment} onChange={(e) => setComment(e.target.value)} required />
      <button className="btn small">Post review</button>
      {err && <small className="error">{err}</small>}
    </form>
  );
}

export default function MyBookings() {
  const [list, setList] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/bookings/mine').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const pay = async (b) => {
    try {
      const { data } = await api.post('/payments/checkout', { bookingId: b._id });
      if (data.mode === 'stripe') return (window.location.href = data.url);
      // demo mode: no card needed
      if (confirm(`Demo payment of ${money(b.totalPrice)}. Confirm?`)) {
        await api.post('/payments/confirm', { bookingId: b._id });
        setMsg('Payment received. Your booking is confirmed.');
        load();
      }
    } catch (e) { setMsg(errMsg(e)); }
  };
  const cancel = async (b) => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.put(`/bookings/${b._id}/cancel`); setMsg('Booking cancelled.'); load(); }
    catch (e) { setMsg(errMsg(e)); }
  };

  if (!list) return <p className="center muted">Loading...</p>;
  return (
    <div className="wrap">
      <h2>My bookings</h2>
      {msg && <p className="notice">{msg}</p>}
      {!list.length && <p>You have no bookings yet. <a href="/rooms">Browse rooms</a></p>}
      {list.map((b) => {
        const stayDone = b.status === 'completed' || (b.paymentStatus === 'paid' && new Date(b.checkOut) < new Date() && b.status !== 'cancelled');
        return (
          <article className="booking" key={b._id}>
            <div className="row between wrapflex">
              <div>
                <h3>{b.room?.name}</h3>
                <p className="muted">{fmtDate(b.checkIn)} to {fmtDate(b.checkOut)}, {b.nights} night{b.nights > 1 && 's'}, {b.guests} guest{b.guests > 1 && 's'}</p>
              </div>
              <div className="right">
                <strong>{money(b.totalPrice)}</strong><br />
                <StatusBadge s={b.status} /> <span className={`badge pay-${b.paymentStatus}`}>{b.paymentStatus}</span>
              </div>
            </div>
            <div className="row gap">
              {b.paymentStatus === 'unpaid' && b.status === 'pending' && <button className="btn small" onClick={() => pay(b)}>Pay now</button>}
              {['pending', 'confirmed'].includes(b.status) && <button className="btn small ghost" onClick={() => cancel(b)}>Cancel booking</button>}
              {stayDone && <button className="btn small ghost" onClick={() => setReviewing(reviewing === b._id ? null : b._id)}>Write a review</button>}
            </div>
            {reviewing === b._id && <ReviewForm booking={b} onDone={() => { setReviewing(null); setMsg('Thanks for your review.'); }} />}
          </article>
        );
      })}
    </div>
  );
}
