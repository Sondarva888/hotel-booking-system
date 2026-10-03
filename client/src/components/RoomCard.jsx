import { Link } from 'react-router-dom';
import { money } from '../api.js';

export const Stars = ({ value = 0, count }) => (
  <span className="stars" aria-label={`${value} out of 5`}>
    {'★'.repeat(Math.round(value))}<span className="off">{'★'.repeat(5 - Math.round(value))}</span>
    {count !== undefined && <small> {count ? `${value} (${count})` : 'No reviews yet'}</small>}
  </span>
);

export default function RoomCard({ room, query = '' }) {
  return (
    <Link to={`/rooms/${room._id}${query}`} className="room-card">
      <div className="room-img" style={{ backgroundImage: `url(${room.images?.[0] || ''})` }} />
      <div className="room-body">
        <div className="row between">
          <h3>{room.name}</h3>
          <strong>{money(room.pricePerNight)}<small className="muted"> / night</small></strong>
        </div>
        <p className="muted">{room.type} room, sleeps {room.capacity}</p>
        <Stars value={room.rating} count={room.numReviews} />
      </div>
    </Link>
  );
}
