import { today } from '../api.js';

// Reusable check-in / check-out / guests fields
export default function DateGuestForm({ v, set, children, onSubmit }) {
  return (
    <form className="search" onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
      <label>Check-in
        <input type="date" min={today()} value={v.checkIn} onChange={(e) => set({ ...v, checkIn: e.target.value, checkOut: v.checkOut <= e.target.value ? '' : v.checkOut })} required />
      </label>
      <label>Check-out
        <input type="date" min={v.checkIn || today(1)} value={v.checkOut} onChange={(e) => set({ ...v, checkOut: e.target.value })} required />
      </label>
      <label>Guests
        <input type="number" min="1" max="10" value={v.guests} onChange={(e) => set({ ...v, guests: e.target.value })} />
      </label>
      {children}
    </form>
  );
}
