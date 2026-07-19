import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../utils/toast';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../app/apiSlice';
import ThemeToggle from '../components/ThemeToggle';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotPassword, { isLoading: isSending }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  async function requestCode(e) {
    e.preventDefault();
    try {
      const result = await forgotPassword({ email }).unwrap();
      setStep('reset');
      Toast.success(result.message);
      if (result.devOtp) setCode(result.devOtp);
    } catch (err) {
      Toast.error(err?.data?.message || 'Could not send reset code');
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    if (password !== confirmPassword) return Toast.error('Passwords do not match');
    try {
      const result = await resetPassword({ email, code, password }).unwrap();
      Toast.success(result.message);
      navigate('/login', { replace: true });
    } catch (err) {
      Toast.error(err?.data?.message || err?.data?.errors?.[0]?.msg || 'Password reset failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-muted via-surface to-soft">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border border-line p-8">
        <h1 className="text-2xl font-bold text-text">Reset password</h1>
        <p className="mt-1 text-sm text-text-subtle">
          {step === 'request' ? 'Enter your registered email.' : `Enter the code sent to ${email}.`}
        </p>

        {step === 'request' ? (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Email
              <input required type="email" autoComplete="email" className="theme-input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button disabled={isSending} className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-contrast disabled:opacity-60">
              {isSending ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">6-digit code
              <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className="theme-input mt-1" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            </label>
            <label className="block text-sm font-medium">New password
              <input required type="password" minLength={8} autoComplete="new-password" className="theme-input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="mt-1 block text-xs text-text-subtle">8+ characters with uppercase, lowercase and a number.</span>
            </label>
            <label className="block text-sm font-medium">Confirm password
              <input required type="password" minLength={8} autoComplete="new-password" className="theme-input mt-1" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
            <button disabled={isResetting} className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-contrast disabled:opacity-60">
              {isResetting ? 'Resetting…' : 'Reset password'}
            </button>
            <button type="button" disabled={isSending} className="w-full text-sm theme-link" onClick={requestCode}>Resend code</button>
          </form>
        )}
        <p className="mt-5 text-center text-sm"><Link to="/login" className="theme-link">Back to sign in</Link></p>
      </div>
    </div>
  );
}
