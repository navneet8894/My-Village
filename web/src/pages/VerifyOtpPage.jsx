import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Toast from '../utils/toast';
import { useVerifyOtpMutation, useResendOtpMutation } from '../app/apiSlice';
import { setCredentials } from '../features/auth/authSlice';
import ThemeToggle from '../components/ThemeToggle';

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || '');
  const [code, setCode] = useState('');
  const [verify, { isLoading }] = useVerifyOtpMutation();
  const [resend, { isLoading: resending }] = useResendOtpMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await verify({ email, code }).unwrap();
      dispatch(setCredentials({ token: res.token, user: res.user }));
      Toast.success('Account verified');
      navigate(res.user?.role === 'admin' ? '/dashboard/admin' : '/dashboard');
    } catch (err) {
      Toast.error(err?.data?.message || 'Invalid code');
    }
  }

  async function onResend() {
    try {
      const r = await resend({ email }).unwrap();
      if (r.devOtp) Toast.success(`Dev OTP: ${r.devOtp}`);
      else Toast.success('Code resent');
    } catch (err) {
      Toast.error(err?.data?.message || 'Could not resend');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-muted via-surface to-soft">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-2xl bg-card shadow border border-line p-8">
        <h1 className="text-xl font-bold">Verify email</h1>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            className="theme-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="theme-input"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary text-primary-contrast py-2 font-medium disabled:opacity-60"
          >
            Verify
          </button>
        </form>
        <button
          type="button"
          onClick={onResend}
          disabled={resending || !email}
          className="mt-3 text-sm text-primary hover:underline disabled:opacity-50"
        >
          Resend code
        </button>
        <p className="mt-4 text-sm">
          <Link to="/login" className="text-text-subtle hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
