import { useEffect, useState } from 'react';
import api, { errMsg, fmtDate, money } from '../api.js';
import { StatusBadge } from './MyBookings.jsx';

const NEXT = { pending: ['confirmed', 'cancelled'], confirmed: ['checked_in', 'cancelled'], checked_in: ['completed'] };

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <p className="muted">Loading...</p>;
  const max = Math.max(1, ...s.monthly.map((m) => m.revenue));
  return (
    <>
      <div className="stats">
        {[['Revenue', money(s.revenue)], ['Bookings', s.bookings], ['Occupancy today', `${s.occupancyRate}%`], ['Active rooms', s.rooms], ['Guests', s.users]].map(([k, v]) => (
          <div className="stat" key={k}><span className="muted">{k}</span><strong>{v}</strong></div>
        ))}
      </div>
      <h3>Revenue by month</h3>
      <div className="bars">
        {s.monthly.length === 0 && <p className="muted">No paid bookings yet.</p>}
        {s.monthly.map((m) => (
          <div key={m._id} className="bar"><div style={{ height: `${(m.revenue / max) * 100}%` }} /><small>{m._id}</small><small>{money(m.revenue)}</small></div>
        ))}
      </div>
    </>
  );
}

const blank = { name: '', number: '', type: 'double', pricePerNight: 100, capacity: 2, description: '', amenities: '', images: '' };

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api.get('/rooms/admin/all').then((r) => setRooms(r.data));
  useEffect(() => { load(); }, []);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setErr('');
    const body = { ...f, pricePerNight: +f.pricePerNight, capacity: +f.capacity,
      amenities: String(f.amenities).split(',').map((x) => x.trim()).filter(Boolean),
      images: String(f.images).split(',').map((x) => x.trim()).filter(Boolean) };
    try {
      editing ? await api.put(`/rooms/${editing}`, body) : await api.post('/rooms', body);
      setF(blank); setEditing(null); load();
    } catch (e) { setErr(errMsg(e)); }
  };
  const edit = (r) => { setEditing(r._id); setF({ ...r, amenities: r.amenities.join(', '), images: r.images.join(', ') }); window.scrollTo(0, 0); };
  const toggle = (r) => api.put(`/rooms/${r._id}`, { isActive: !r.isActive }).then(load);

  return (
    <>
      <form className="panel grid2" onSubmit={save}>
        <h3 className="span2">{editing ? 'Edit room' : 'Add a room'}</h3>
        <label>Name<input value={f.name} onChange={on('name')} required /></label>
        <label>Room number<input value={f.number} onChange={on('number')} required /></label>
        <label>Type<select value={f.type} onChange={on('type')}>{['single', 'double', 'deluxe', 'family', 'suite'].map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Price per night (USD)<input type="number" min="0" value={f.pricePerNight} onChange={on('pricePerNight')} required /></label>
        <label>Capacity<input type="number" min="1" value={f.capacity} onChange={on('capacity')} required /></label>
        <label>Image URLs (comma separated)<input value={f.images} onChange={on('images')} /></label>
        <label className="span2">Amenities (comma separated)<input value={f.amenities} onChange={on('amenities')} /></label>
        <label className="span2">Description<textarea rows="2" value={f.description} onChange={on('description')} required /></label>
        {err && <p className="error span2">{err}</p>}
        <div className="span2 row gap">
          <button className="btn">{editing ? 'Save changes' : 'Add room'}</button>
          {editing && <button type="button" className="btn ghost" onClick={() => { setEditing(null); setF(blank); }}>Cancel</button>}
        </div>
      </form>
      <table className="table">
        <thead><tr><th>No.</th><th>Name</th><th>Type</th><th>Price</th><th>Rating</th><th>Status</th><th></th></tr></thead>
        <tbody>{rooms.map((r) => (
          <tr key={r._id}>
            <td>{r.number}</td><td>{r.name}</td><td>{r.type}</td><td>{money(r.pricePerNight)}</td><td>{r.rating || '-'}</td>
            <td>{r.isActive ? 'Active' : 'Hidden'}</td>
            <td className="row gap"><button className="link" onClick={() => edit(r)}>Edit</button><button className="link" onClick={() => toggle(r)}>{r.isActive ? 'Hide' : 'Show'}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

function Bookings() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState('');
  const load = () => api.get('/admin/bookings', { params: filter ? { status: filter } : {} }).then((r) => setList(r.data));
  useEffect(() => { load(); }, [filter]);
  const move = async (id, status) => {
    try { await api.put(`/admin/bookings/${id}/status`, { status }); setErr(''); load(); } catch (e) { setErr(errMsg(e)); }
  };
  return (
    <>
      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>
      {err && <p className="error">{err}</p>}
      <table className="table">
        <thead><tr><th>Guest</th><th>Room</th><th>Stay</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{list.map((b) => (
          <tr key={b._id}>
            <td>{b.user?.name}<br /><small className="muted">{b.user?.email}</small></td>
            <td>{b.room?.number} {b.room?.name}</td>
            <td>{fmtDate(b.checkIn)} to {fmtDate(b.checkOut)}</td>
            <td>{money(b.totalPrice)}</td>
            <td><span className={`badge pay-${b.paymentStatus}`}>{b.paymentStatus}</span></td>
            <td><StatusBadge s={b.status} /></td>
            <td className="row gap">{(NEXT[b.status] || []).map((n) => <button key={n} className="link" onClick={() => move(b._id, n)}>{n === 'cancelled' ? 'Cancel' : `Mark ${n.replace('_', ' ')}`}</button>)}</td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

function Reviews() {
  const [list, setList] = useState([]);
  const load = () => api.get('/admin/reviews').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const del = async (id) => { if (confirm('Delete this review?')) { await api.delete(`/reviews/${id}`); load(); } };
  return (
    <>
      {!list.length && <p className="muted">No reviews yet.</p>}
      {list.map((r) => (
        <article className="review" key={r._id}>
          <div className="row between"><strong>{r.user?.name} on {r.room?.name}</strong><span>{'★'.repeat(r.rating)}</span></div>
          <p>{r.comment}</p>
          <button className="link" onClick={() => del(r._id)}>Delete review</button>
        </article>
      ))}
    </>
  );
}

function Users() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/admin/users').then((r) => setList(r.data)); }, []);
  return (
    <table className="table">
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead>
      <tbody>{list.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.phone || '-'}</td><td>{u.role}</td><td>{fmtDate(u.createdAt)}</td></tr>)}</tbody>
    </table>
  );
}

const TABS = { Overview, Rooms, Bookings, Reviews, Guests: Users };

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const Tab = TABS[tab];
  return (
    <div className="wrap">
      <h2>Hotel management</h2>
      <div className="tabs">{Object.keys(TABS).map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      <Tab />
    </div>
  );
}
