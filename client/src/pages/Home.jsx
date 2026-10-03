import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { today } from '../api.js';
import DateGuestForm from '../components/DateGuestForm.jsx';
import RoomCard from '../components/RoomCard.jsx';

export default function Home() {
  const nav = useNavigate();
  const [v, set] = useState({ checkIn: today(1), checkOut: today(3), guests: 2 });
  const [rooms, setRooms] = useState([]);

  useEffect(() => { api.get('/rooms?sort=rating&limit=3').then((r) => setRooms(r.data.rooms)); }, []);

  const go = () => nav(`/rooms?checkIn=${v.checkIn}&checkOut=${v.checkOut}&guests=${v.guests}`);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Wake up to the tide, not the traffic.</h1>
          <p>Thirty-two rooms above the marina. Check which nights are free and book in a minute.</p>
        </div>
        <DateGuestForm v={v} set={set} onSubmit={go}>
          <button className="btn">See available rooms</button>
        </DateGuestForm>
      </section>

      <section className="wrap">
        <h2>Guest favourites</h2>
        <div className="grid">{rooms.map((r) => <RoomCard key={r._id} room={r} />)}</div>
        {!rooms.length && <p className="muted">No rooms yet. Run <code>npm run seed</code> to add sample rooms.</p>}
      </section>
    </>
  );
}
