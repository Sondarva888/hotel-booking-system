import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';
import RoomCard from '../components/RoomCard.jsx';

const TYPES = ['single', 'double', 'deluxe', 'family', 'suite'];

export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ rooms: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const p = Object.fromEntries(params);

  useEffect(() => {
    setLoading(true);
    api.get('/rooms', { params: p }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [params]);

  const update = (k, val) => {
    const next = { ...p };
    val ? (next[k] = val) : delete next[k];
    setParams(next);
  };
  const stay = p.checkIn && p.checkOut ? `?checkIn=${p.checkIn}&checkOut=${p.checkOut}&guests=${p.guests || 1}` : '';

  return (
    <div className="wrap">
      <h2>{p.checkIn ? `Rooms free ${p.checkIn} to ${p.checkOut}` : 'All rooms'}</h2>
      <div className="filters">
        <input placeholder="Search rooms" defaultValue={p.search} onKeyDown={(e) => e.key === 'Enter' && update('search', e.target.value)} />
        <select value={p.type || ''} onChange={(e) => update('type', e.target.value)}>
          <option value="">Any type</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input type="number" min="0" placeholder="Max price" value={p.maxPrice || ''} onChange={(e) => update('maxPrice', e.target.value)} />
        <select value={p.sort || ''} onChange={(e) => update('sort', e.target.value)}>
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Best rated</option>
        </select>
      </div>
      {loading ? <p className="muted">Loading rooms...</p> : (
        <>
          <p className="muted">{data.total} room{data.total === 1 ? '' : 's'} found</p>
          <div className="grid">{data.rooms.map((r) => <RoomCard key={r._id} room={r} query={stay} />)}</div>
          {!data.rooms.length && <p>No rooms match. Try different dates or clear a filter.</p>}
        </>
      )}
    </div>
  );
}
