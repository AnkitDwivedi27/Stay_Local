import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mountain, Lock, Mail, User, Compass, AlertCircle, Home, MapPin, Check } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'tourist' | 'host' | 'guide'>('tourist');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*[0-9\W_])/.test(password)) {
      setErrorMessage('Password must contain both letters and at least one number or special symbol.');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: phone.trim() ? phone.trim() : undefined,
        bio: bio.trim() ? bio.trim() : undefined,
      });
      navigate('/profile', { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to complete registration. Please verify details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: Array<{
    id: 'tourist' | 'host' | 'guide';
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'tourist',
      title: 'Conscious Traveler',
      description: 'Discover authentic homestays, local food & traditions across Uttarakhand.',
      icon: Compass,
    },
    {
      id: 'host',
      title: 'Homestay Host',
      description: 'List your village cottage, farmstay or eco-lodge and welcome mindful visitors.',
      icon: Home,
    },
    {
      id: 'guide',
      title: 'Cultural / Trekking Guide',
      description: 'Lead authentic mountain trails, craft workshops, and regional storytelling.',
      icon: MapPin,
    },
  ];

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-himalayan-mesh">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-md border border-sand-300/80">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-forest-700 flex items-center justify-center text-white mx-auto shadow-sm">
            <Mountain className="w-6 h-6 text-sand-100" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-forest-950">
            Join the StayLocal Community
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-md mx-auto">
            Create an account to support regional livelihoods and explore genuine Himalayan hospitality.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm font-medium text-red-800">{errorMessage}</div>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-2">
              Select Your Role in Uttarakhand
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRole(opt.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-forest-700 bg-forest-50/70 ring-2 ring-forest-700 shadow-xs'
                        : 'border-sand-300 hover:border-forest-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-forest-700 text-white'
                              : 'bg-sand-100 text-charcoal-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-forest-700 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-charcoal-900">{opt.title}</h4>
                      <p className="text-[11px] text-charcoal-500 mt-1 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="full-name"
              className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
            >
              Full Name *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Devendra Joshi"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-sand-300 rounded-xl text-sm font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors bg-white"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
            >
              Email Address *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="devendra@example.com"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-sand-300 rounded-xl text-sm font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors bg-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
            >
              Password * (min 8 characters, letters & numbers)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="reg-password"
                name="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-sand-300 rounded-xl text-sm font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors bg-white"
              />
            </div>
            <p className="mt-1 text-[11px] text-charcoal-500">
              Must include letters plus at least one number or symbol (e.g., Mountain#2026).
            </p>
          </div>

          {/* Optional Phone & Bio (especially helpful for Hosts and Guides) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
              >
                Phone (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="block w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-sm font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
              >
                Bio / Specialization (Optional)
              </label>
              <input
                id="bio"
                name="bio"
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Kumaoni organic farmer in Munsiari"
                className="block w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-sm font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-forest-700 hover:bg-forest-800 active:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-600 transition-all shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register as {role === 'tourist' ? 'Traveler' : role === 'host' ? 'Homestay Host' : 'Cultural Guide'}</span>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-sand-200 text-center">
          <p className="text-xs sm:text-sm text-charcoal-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-forest-700 hover:text-forest-900 underline transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
