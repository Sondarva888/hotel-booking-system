import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';

export default function PaymentSuccess() {
  const [qs] = useSearchParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    api.post('/payments/confirm', { bookingId: qs.get('booking'), sessionId: qs.get('session_id') })
      .then(() => setState({ ok: true }))
      .catch((e) => setState({ error: errMsg(e) }));
  }, []);

  return (
    <div className="panel auth center-text">
      {state.loading && <p>Confirming your payment...</p>}
      {state.ok && <><h2>Payment received</h2><p>Your booking is confirmed.</p><Link className="btn" to="/bookings">View my bookings</Link></>}
      {state.error && <><h2>We could not confirm payment</h2><p className="error">{state.error}</p><Link to="/bookings">Back to my bookings</Link></>}
    </div>
  );
}
