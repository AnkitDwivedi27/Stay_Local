import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mountain, Lock, Mail, ArrowRight, AlertCircle, Compass } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim().toLowerCase(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Invalid email or password. Please verify your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-himalayan-mesh">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-md border border-sand-300/80">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-forest-700 flex items-center justify-center text-white mx-auto shadow-sm">
            <Mountain className="w-6 h-6 text-sand-100" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-forest-950">
            Welcome Back
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-charcoal-600 leading-relaxed">
            Sign in to access your StayLocal dashboard, homestay leads, or cultural trails.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm font-medium text-red-800">{errorMessage}</div>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email-address"
              className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-sand-300 rounded-xl text-sm font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700"
              >
                Password
              </label>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-sand-300 rounded-xl text-sm font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors bg-white"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-forest-700 hover:bg-forest-800 active:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-600 transition-all shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-sand-200 text-center space-y-3">
          <p className="text-xs sm:text-sm text-charcoal-600">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-semibold text-forest-700 hover:text-forest-900 underline transition-colors"
            >
              Register here
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-charcoal-500 font-medium">
            <Compass className="w-3.5 h-3.5 text-clay-500" />
            <span>Community-Led Himalayan Tourism Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};
