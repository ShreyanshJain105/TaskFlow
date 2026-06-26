import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!form.name || form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!form.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email address';
    if (!form.password || form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      const { token, user } = res.data.data;
      login(user, token);
      toast.success(`Account created! Welcome, ${user.name}!`);
      navigate('/');
    } catch (err) {
      const serverFields = err.response?.data?.error?.fields;
      const message = err.response?.data?.error?.message || 'Registration failed';
      if (serverFields) setFieldErrors(serverFields);
      else toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-xl shadow-brand-500/20 text-white">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start managing tasks in seconds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="reg-name" className="label">Full name</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                className={`input ${fieldErrors.name ? 'border-red-400' : ''}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {fieldErrors.name && <p className="error-text">{fieldErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input ${fieldErrors.email ? 'border-red-400' : ''}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {fieldErrors.email && <p className="error-text">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={`input ${fieldErrors.password ? 'border-red-400' : ''}`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {fieldErrors.password && <p className="error-text">{fieldErrors.password}</p>}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-10"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
