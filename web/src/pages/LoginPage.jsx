import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Toast from '../utils/toast';
import { useLoginMutation } from '../app/apiSlice';
import { setCredentials } from '../features/auth/authSlice';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ token: res.token, user: res.user }));
      Toast.success('Welcome back');
      navigate(res.user?.role === 'admin' ? '/dashboard/admin' : '/dashboard');
    } catch (err) {
      Toast.error(err?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-muted via-surface to-soft">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border border-line p-8">
        <h1 className="text-2xl font-bold text-text">Sign in</h1>
        <p className="text-sm text-text-subtle mt-1">MY VILLAGE</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="theme-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="theme-link text-sm">Forgot password?</Link>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="theme-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast font-medium py-2.5 disabled:opacity-60"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-text-subtle">
          No account?{' '}
          <Link to="/register" className="theme-link">
            Register
          </Link>
        </p>
        <p className="mt-2 text-sm text-center">
          <Link to="/" className="text-text-subtle hover:text-primary transition">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
