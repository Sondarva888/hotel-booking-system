import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="brand">Saltmarsh<span> Harbour</span></Link>
      <nav>
        <NavLink to="/rooms">Rooms</NavLink>
        {user && <NavLink to="/bookings">My bookings</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user ? (
          <button className="link" onClick={() => { logout(); nav('/'); }}>Sign out ({user.name.split(' ')[0]})</button>
        ) : (
          <>
            <NavLink to="/login">Sign in</NavLink>
            <Link className="btn small" to="/register">Create account</Link>
          </>
        )}
      </nav>
    </header>
  );
}
