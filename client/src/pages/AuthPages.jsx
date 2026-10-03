import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function AuthForm({ mode }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [err, setErr] = useState('');
  const isReg = mode === 'register';
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const u = await (isReg ? register(f) : login(f));
      nav(u.role === 'admin' ? '/admin' : '/rooms');
    } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <form className="panel auth" onSubmit={submit}>
      <h2>{isReg ? 'Create your account' : 'Sign in'}</h2>
      {isReg && <label>Full name<input value={f.name} onChange={on('name')} required /></label>}
      <label>Email<input type="email" value={f.email} onChange={on('email')} required /></label>
      {isReg && <label>Phone<input value={f.phone} onChange={on('phone')} /></label>}
      <label>Password<input type="password" minLength="6" value={f.password} onChange={on('password')} required /></label>
      {err && <p className="error">{err}</p>}
      <button className="btn block">{isReg ? 'Create account' : 'Sign in'}</button>
      <p className="muted">{isReg ? <>Already registered? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
      {!isReg && <small className="muted">Demo: guest@hotel.com / guest123, admin@hotel.com / admin123</small>}
    </form>
  );
}
export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
