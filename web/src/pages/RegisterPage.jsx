import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../utils/toast';
import { useRegisterMutation } from '../app/apiSlice';
import ThemeToggle from '../components/ThemeToggle';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await register(form).unwrap();
      if (res.devOtp) Toast.success(`Dev OTP: ${res.devOtp}`);
      else Toast.success(res.message || 'Check your email');
      navigate('/verify', { state: { email: form.email } });
    } catch (err) {
      Toast.error(err?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-muted via-surface to-soft">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border border-line p-8">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-text-subtle mt-1">Join MY VILLAGE</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {['name', 'email', 'phone', 'password'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
              <input
                className="theme-input"
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field !== 'phone'}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast font-medium py-2.5 disabled:opacity-60"
          >
            {isLoading ? 'Sending code…' : 'Continue'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-text-subtle">
          <Link to="/login" className="theme-link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
