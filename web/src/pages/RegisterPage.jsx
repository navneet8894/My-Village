import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../utils/toast';
import { useRegisterMutation } from '../app/apiSlice';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 p-8">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-slate-500 mt-1">Join MY VILLAGE</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {['name', 'email', 'phone', 'password'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
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
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 disabled:opacity-60"
          >
            {isLoading ? 'Sending code…' : 'Continue'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-slate-500">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
