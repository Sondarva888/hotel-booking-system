import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Rooms from './pages/Rooms.jsx';
import RoomDetails from './pages/RoomDetails.jsx';
import { Login, Register } from './pages/AuthPages.jsx';
import MyBookings from './pages/MyBookings.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Admin from './pages/Admin.jsx';

function Guard({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bookings" element={<Guard><MyBookings /></Guard>} />
          <Route path="/payment/success" element={<Guard><PaymentSuccess /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="*" element={<p className="center muted">Page not found.</p>} />
        </Routes>
      </main>
      <footer className="footer">Saltmarsh Harbour Hotel. A demo MERN project.</footer>
    </>
  );
}
