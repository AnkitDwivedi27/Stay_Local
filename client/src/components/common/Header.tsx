import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Mountain, X, ShieldCheck, User, LogOut, Calendar, Home, UserCheck, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenExplainer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExplainer }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/destinations', label: 'Destinations' },
    { to: '/stays', label: 'Stays' },
    { to: '/experiences', label: 'Experiences' },
    { to: '/about', label: 'About StayLocal' },
  ];

  const getRoleBadgeClasses = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-forest-900 text-sand-100 border-forest-800';
      case 'host':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'guide':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-forest-100 text-forest-800 border-forest-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sand-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      {/* Top micro-bar: Uttarakhand Research Initiative */}
      <div className="bg-forest-900 text-sand-100 text-xs py-2 px-4 border-b border-forest-800/80">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-clay-400"></span>
            <span className="font-medium">Researched Regions: Pithoragarh, Nainital, Bageshwar & Johar Valley</span>
          </div>
          {onOpenExplainer && (
            <button
              onClick={onOpenExplainer}
              className="hidden sm:inline-flex items-center gap-1.5 text-sand-200 hover:text-white underline text-[11px] font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-clay-400" />
              How we verify homestays & craft leads
            </button>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-sm group-hover:bg-forest-800 transition-colors">
              <Mountain className="w-5 h-5 text-sand-100" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-forest-950 group-hover:text-forest-700 transition-colors">
                StayLocal
              </span>
              <span className="block text-[10px] tracking-widest font-bold uppercase text-clay-600 -mt-1">
                Uttarakhand Stays & Crafts
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'text-forest-900 bg-forest-50 font-semibold shadow-xs'
                      : 'text-charcoal-700 hover:text-forest-900 hover:bg-sand-100/80'
                  }`}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' ? (
                  <>
                    <Link
                      to="/admin/assignments"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-forest-50 text-forest-900 border border-forest-200 hover:bg-forest-100 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-forest-700" />
                      <span>Host Assignments</span>
                    </Link>
                    <Link
                      to="/admin/verification"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-forest-900 text-sand-50 hover:bg-forest-950 transition-colors shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-sand-200" />
                      <span>Admin Portal</span>
                    </Link>
                    <Link
                      to="/host/bookings"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sand-100 text-charcoal-800 border border-sand-300 hover:bg-sand-200 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-charcoal-600" />
                      <span>Bookings</span>
                    </Link>
                  </>
                ) : user.role === 'guide' ? (
                  <Link
                    to="/guide/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Guide Dashboard</span>
                  </Link>
                ) : user.role === 'host' ? (
                  <>
                    <Link
                      to="/host/listings"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      <Home className="w-3.5 h-3.5 text-amber-700" />
                      <span>My Listings</span>
                    </Link>
                    <Link
                      to="/host/bookings"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>Host Bookings</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/bookings"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-forest-50 text-forest-900 border border-forest-200 hover:bg-forest-100 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-forest-700" />
                    <span>My Bookings</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-sand-300 hover:border-forest-600 bg-sand-50/70 hover:bg-sand-100 transition-colors text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-forest-700 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-charcoal-800 max-w-[120px] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${getRoleBadgeClasses(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="p-2 rounded-xl text-charcoal-500 hover:text-clay-600 hover:bg-sand-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-sand-100 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 text-sm font-semibold text-white bg-forest-700 hover:bg-forest-800 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  Join Community
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-charcoal-700 hover:bg-sand-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-sand-200 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-semibold text-charcoal-800 hover:bg-forest-50 hover:text-forest-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Auth actions */}
          <div className="pt-4 border-t border-sand-200 space-y-2">
            {isAuthenticated && user ? (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link
                      to="/admin/assignments"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-50 text-forest-900 border border-forest-200 font-semibold text-sm"
                    >
                      <UserCheck className="w-4 h-4 text-forest-700" />
                      <span>Host Assignments</span>
                    </Link>
                    <Link
                      to="/admin/verification"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 text-white font-semibold text-sm"
                    >
                      <ShieldCheck className="w-4 h-4 text-sand-200" />
                      <span>Admin Verification Queue</span>
                    </Link>
                  </>
                ) : user.role === 'guide' ? (
                  <Link
                    to="/guide/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-sm"
                  >
                    <Compass className="w-4 h-4 text-emerald-700" />
                    <span>Guide Dashboard</span>
                  </Link>
                ) : user.role === 'host' ? (
                  <Link
                    to="/host/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-sm"
                  >
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Manage Host Bookings</span>
                  </Link>
                ) : (
                  <Link
                    to="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-50 text-forest-900 border border-forest-200 font-semibold text-sm"
                  >
                    <Calendar className="w-4 h-4 text-forest-700" />
                    <span>My Bookings</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-sand-100 text-forest-900 font-semibold text-sm"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-forest-700" />
                    <span>{user.fullName}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${getRoleBadgeClasses(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-clay-700 hover:bg-clay-50 rounded-xl border border-clay-200"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-forest-800 bg-sand-100 hover:bg-sand-200 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-forest-700 hover:bg-forest-800 rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}

            {onOpenExplainer && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenExplainer();
                }}
                className="mt-3 w-full text-center text-xs text-charcoal-600 hover:text-forest-800 underline py-1 font-medium"
              >
                Verification Standards Explained
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
