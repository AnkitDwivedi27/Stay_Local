import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Shield,
  Calendar,
  LogOut,
  Home,
  MapPin,
  Compass,
  CheckCircle2,
  Sparkles,
  Info,
  Camera,
  TreePine,
  Droplets,
  HeartHandshake,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout, isHost, isGuide, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-forest-900 text-sand-100 border-forest-800',
          label: 'Platform Administrator',
        };
      case 'host':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          label: 'Homestay Host',
        };
      case 'guide':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          label: 'Cultural / Nature Guide',
        };
      case 'tourist':
      default:
        return {
          bg: 'bg-sand-100 text-charcoal-800 border-sand-300',
          label: 'Conscious Traveler',
        };
    }
  };

  const badge = getRoleBadge(user.role);

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header Card with Himalayan Panorama Backdrop */}
        <div className="relative rounded-3xl overflow-hidden shadow-sm border border-sand-300/80 bg-white editorial-card">
          {/* Scenic Mountain Panorama Top Bar */}
          <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-forest-950">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
              alt="Himalayan Mountain Range"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/75 via-transparent to-transparent" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-forest-950 backdrop-blur-md shadow-xs border border-white/50">
                <MapPin className="w-3.5 h-3.5 text-clay-600" />
                <span>Uttarakhand Living Heritage</span>
              </span>
            </div>
          </div>

          {/* User Details Below Panorama */}
          <div className="px-6 sm:px-8 pb-7 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                {/* Only the avatar overlaps the banner smoothly */}
                <div className="-mt-12 sm:-mt-16 relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-forest-900 text-sand-100 flex items-center justify-center font-serif text-3xl sm:text-4xl font-bold border-4 border-white shadow-lg shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>

                {/* Name, badges, and details sit cleanly on the white surface with full contrast */}
                <div className="pt-2 sm:pt-0 pb-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-950 leading-tight">
                      {user.fullName}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${badge.bg}`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Active Member
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal-600 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-charcoal-400" />
                      {user.email}
                    </span>
                    <span className="text-sand-300">•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-charcoal-400" />
                      Member since {formattedDate}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-2 sm:pt-0 pb-1 shrink-0">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-50 text-charcoal-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4 text-clay-600" />
                  <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Role-Specific Portal Section: Host */}
        {isHost && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-300/80 editorial-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-sand-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Home className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest-950">
                      Homestay Host Portal
                    </h2>
                    <p className="text-xs text-charcoal-500">
                      Manage your village stay listings, lead verification, and guest policies.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/host/listings"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Manage Listings</span>
                  </Link>
                  <Link
                    to="/host/bookings"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Host Bookings</span>
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80">
                  <div className="text-2xl font-bold text-forest-900 font-serif">1</div>
                  <div className="text-xs font-semibold text-charcoal-700 mt-1">Homestay Property Linked</div>
                  <div className="text-[11px] text-clay-700 mt-2 font-medium">Under Ground Verification</div>
                </div>
                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80">
                  <div className="text-2xl font-bold text-forest-900 font-serif">100%</div>
                  <div className="text-xs font-semibold text-charcoal-700 mt-1">Direct Community Earnings</div>
                  <div className="text-[11px] text-forest-700 mt-2 font-medium">No middleman commissions</div>
                </div>
                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80">
                  <div className="text-2xl font-bold text-forest-900 font-serif">Verified</div>
                  <div className="text-xs font-semibold text-charcoal-700 mt-1">Operator Identity</div>
                  <div className="text-[11px] text-emerald-700 mt-2 font-medium">Valid Uttarakhand Resident</div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900 space-y-1">
                  <div className="font-semibold text-amber-950">Uttarakhand Homestay Scheme Standards</div>
                  <p className="leading-relaxed">
                    All listings on StayLocal adhere to local Panchayati verification standards. Hosts must ensure clean running water, solar or reliable heating in high altitude zones, and authentic Kumaoni or Garhwali meals sourced from local farmers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role-Specific Portal Section: Guide */}
        {isGuide && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-300/80 editorial-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-sand-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest-950">
                      Cultural & Trekking Guide Hub
                    </h2>
                    <p className="text-xs text-charcoal-500">
                      Manage artisan workshop collaborations and local storytelling routes.
                    </p>
                  </div>
                </div>
                <Link
                  to="/guide/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Open Guide Dashboard</span>
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-sand-200 bg-sand-50/60">
                  <div className="flex items-center gap-2 text-forest-900 font-semibold text-sm mb-2">
                    <Sparkles className="w-4 h-4 text-clay-600" />
                    Artisan & Craft Partnerships
                  </div>
                  <p className="text-xs text-charcoal-600 leading-relaxed">
                    Collaborate with Bhotia wool weavers, Tamta coppersmiths, and ringal bamboo artisans. Guarantee that 80%+ of workshop revenue directly supports the craftsmen and women.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-sand-200 bg-sand-50/60">
                  <div className="flex items-center gap-2 text-forest-900 font-semibold text-sm mb-2">
                    <Shield className="w-4 h-4 text-forest-700" />
                    Responsible Mountain Protocol
                  </div>
                  <p className="text-xs text-charcoal-600 leading-relaxed">
                    Strict adherence to zero-single-use plastics, trail preservation along Johar Valley & Pindari routes, and respect for sacred deodar groves and high-altitude Bugyals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role-Specific Portal Section: Admin */}
        {isAdmin && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-300/80 editorial-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-sand-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-forest-900 text-sand-100 flex items-center justify-center shadow-xs">
                    <Shield className="w-5 h-5 text-sand-200" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest-950">
                      Platform Administration Control
                    </h2>
                    <p className="text-xs text-charcoal-500">
                      Moderate accommodation leads, review host evidence, and assign preloaded homestays.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/admin/verification"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-sand-200" />
                    <span>Verification Queue</span>
                  </Link>
                  <Link
                    to="/admin/assignments"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Host Assignments</span>
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80">
                  <div className="font-semibold text-forest-950 text-sm mb-1">Database Records</div>
                  <div className="text-xs text-charcoal-600">Verified Uttarakhand homestay catalog and field evidence.</div>
                </div>
                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80">
                  <div className="font-semibold text-forest-950 text-sm mb-1">Lead Verification</div>
                  <div className="text-xs text-charcoal-600">Multi-tier audit queue with document inspection logs.</div>
                </div>
                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80">
                  <div className="font-semibold text-forest-950 text-sm mb-1">Security Status</div>
                  <div className="text-xs text-emerald-700 font-semibold">RBAC enforced with immutable audit records.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Traveler Journey Hub (For Conscious Travelers & All Members) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-300/80 editorial-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-sand-200 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center border border-forest-200">
                  <Compass className="w-5 h-5 text-forest-700" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-forest-950">
                    Traveler Journey Hub
                  </h2>
                  <p className="text-xs text-charcoal-500">
                    Your mindful exploration journey across Uttarakhand's living villages.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/bookings"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>My Bookings</span>
                </Link>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
              <Link
                to="/stays"
                className="p-3.5 rounded-2xl bg-gradient-to-br from-white to-sand-50/80 border border-sand-200/90 hover:border-forest-600 shadow-xs hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block">Stays Directory</span>
                  <span className="text-xs font-bold text-forest-950 group-hover:text-forest-700 transition-colors">Verified Homestays</span>
                </div>
                <Home className="w-4 h-4 text-forest-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/experiences"
                className="p-3.5 rounded-2xl bg-gradient-to-br from-white to-sand-50/80 border border-sand-200/90 hover:border-forest-600 shadow-xs hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block">Guided Treks</span>
                  <span className="text-xs font-bold text-forest-950 group-hover:text-forest-700 transition-colors">Native Guides</span>
                </div>
                <Compass className="w-4 h-4 text-forest-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/destinations"
                className="p-3.5 rounded-2xl bg-gradient-to-br from-white to-sand-50/80 border border-sand-200/90 hover:border-forest-600 shadow-xs hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block">Regional Catalog</span>
                  <span className="text-xs font-bold text-forest-950 group-hover:text-forest-700 transition-colors">Kumaon & Garhwal</span>
                </div>
                <MapPin className="w-4 h-4 text-clay-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Illustrated Conscious Travel Code Grid */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-900">
                <Sparkles className="w-4 h-4 text-clay-500" />
                <span>The Uttarakhand Conscious Travel Code</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/90 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-xs text-forest-950">
                    <Camera className="w-4 h-4 text-forest-700 shrink-0" />
                    <span>Respect Local Customs</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed pl-6">
                    Always ask respectfully before photographing village elders, traditional homes, or master craftspeople.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/90 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-xs text-forest-950">
                    <TreePine className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Zero-Waste Alpine Trails</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed pl-6">
                    Carry reusable containers. Never leave single-use plastic bottles or wrappers in remote mountain passes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/90 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-xs text-forest-950">
                    <HeartHandshake className="w-4 h-4 text-clay-600 shrink-0" />
                    <span>Direct Economic Impact</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed pl-6">
                    Support local family economies by purchasing woollens, wild honey, and produce directly from village artisans.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/90 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-xs text-forest-950">
                    <Droplets className="w-4 h-4 text-mountain-500 shrink-0" />
                    <span>Protect Sacred Springs</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed pl-6">
                    Mountain aquifers (dhāras) are sacred village lifelines. Use high-altitude natural spring water with deep mindfulness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details & Metadata Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-300/80 editorial-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <h3 className="font-serif text-lg font-bold text-forest-950">
              Account Credentials & Verification
            </h3>
            <span className="text-xs text-charcoal-500 font-medium">Platform Membership Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
              <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">Full Name</span>
              <span className="font-semibold text-charcoal-900 block text-sm">{user.fullName}</span>
            </div>

            <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
              <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">Email Address</span>
              <span className="font-semibold text-charcoal-900 block text-sm truncate">{user.email}</span>
            </div>

            <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
              <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">Assigned Role</span>
              <span className="font-semibold text-forest-800 capitalize block text-sm">{user.role}</span>
            </div>

            <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
              <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">Account Status</span>
              <span className="font-semibold text-emerald-700 capitalize flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {user.status}
              </span>
            </div>

            {user.phone && (
              <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1">
                <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">Phone</span>
                <span className="font-semibold text-charcoal-900 block text-sm">{user.phone}</span>
              </div>
            )}

            {user.bio && (
              <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">Bio / Notes</span>
                <span className="text-charcoal-700 block text-xs leading-relaxed">{user.bio}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
