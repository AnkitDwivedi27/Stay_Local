import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookingRecord, BookingStatus, GuideBookingRecord } from '../types';
import { apiService } from '../services/api';
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldCheck,
  Ban,
  Home,
} from 'lucide-react';
import { DestinationGuidesSection } from '../components/booking/DestinationGuidesSection';
import { DestinationTreasuresSection } from '../components/booking/DestinationTreasuresSection';
import { MyGuideBookingsSection } from '../components/booking/MyGuideBookingsSection';

export const MyBookingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'homestays' | 'guides'>('homestays');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [guideBookings, setGuideBookings] = useState<GuideBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [homestayData, guideData] = await Promise.all([
        apiService.getMyBookings(),
        apiService.getTouristGuideBookings().catch(() => []),
      ]);
      setBookings(homestayData);
      setGuideBookings(guideData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve your bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshGuideBookings = async () => {
    try {
      const data = await apiService.getTouristGuideBookings();
      setGuideBookings(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking request? The reserved dates will be released.')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setActionError(null);
      const updated = await apiService.cancelBooking(bookingId, 'Cancelled by traveler');
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed Reservation
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Host Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Declined by Host
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sand-200 text-charcoal-700 border border-sand-300">
            <Ban className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Stay Completed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-300 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-semibold uppercase tracking-wider border border-forest-200 mb-2">
              <Compass className="w-3.5 h-3.5 text-forest-700" />
              <span>Traveler Portal</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-forest-950">
              My Reservations & Experiences
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
              Track your authentic village stays and guided mountain experiences across Uttarakhand.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/stays"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Explore Stays</span>
            </Link>
            <Link
              to="/experiences"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sand-200 hover:bg-sand-300 text-charcoal-800 text-xs font-semibold transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-forest-700" />
              <span>Browse Guides</span>
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-sand-300">
          <button
            type="button"
            onClick={() => setActiveTab('homestays')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'homestays'
                ? 'border-forest-700 text-forest-900 bg-forest-50/50 rounded-t-lg'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-sand-400'
            }`}
          >
            <Home className="w-4 h-4 text-forest-700" />
            <span>My Homestay Bookings</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sand-200 font-bold">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guides')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'guides'
                ? 'border-forest-700 text-forest-900 bg-forest-50/50 rounded-t-lg'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-sand-400'
            }`}
          >
            <Compass className="w-4 h-4 text-forest-700" />
            <span>My Guide Bookings</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sand-200 font-bold">
              {guideBookings.length}
            </span>
          </button>
        </div>

        {actionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{actionError}</div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-sand-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-sand-300">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-3 text-xs text-forest-700 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : activeTab === 'guides' ? (
          <MyGuideBookingsSection
            bookings={guideBookings}
            onRefresh={refreshGuideBookings}
          />
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-sand-300 p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sand-100 text-charcoal-500 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 text-forest-700" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-forest-950">
                No Booking Requests Yet
              </h3>
              <p className="text-xs text-charcoal-500 max-w-sm mx-auto mt-1">
                You haven't requested any homestay reservations. Experience living heritage with local hosts in Munsiyari, Bhimtal, and Bageshwar.
              </p>
            </div>
            <Link
              to="/stays"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Discover Verified Homestays</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

              return (
                <div
                  key={booking.id}
                  className="editorial-card p-6 sm:p-7 space-y-5"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-200">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-950">
                          {booking.stayName}
                        </h3>
                        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-sand-100 text-charcoal-700 border border-sand-300">
                          {booking.bookingReference}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-clay-500 shrink-0" />
                        <span>
                          {booking.stayLocality}, {booking.stayDistrict} District, Uttarakhand
                        </span>
                      </div>
                    </div>
                    <div>{getStatusBadge(booking.status)}</div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-sand-50/80 border border-sand-200/90">
                      <span className="text-charcoal-500 uppercase font-bold text-[10px] tracking-wider block mb-1">
                        Reservation Dates
                      </span>
                      <div className="font-semibold text-charcoal-900 text-xs sm:text-sm">
                        {booking.checkIn} → {booking.checkOut}
                      </div>
                      <div className="text-charcoal-500 mt-0.5 text-[11px]">
                        {booking.pricing.nights} {booking.pricing.nights === 1 ? 'night' : 'nights'} stay
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sand-50/80 border border-sand-200/90">
                      <span className="text-charcoal-500 uppercase font-bold text-[10px] tracking-wider block mb-1">
                        Travelers
                      </span>
                      <div className="font-semibold text-charcoal-900 flex items-center gap-1.5 text-xs sm:text-sm">
                        <Users className="w-4 h-4 text-forest-700" />
                        <span>{booking.guestCount} Guests</span>
                      </div>
                      <div className="text-charcoal-500 mt-0.5 text-[11px]">
                        Direct host hospitality
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sand-50/80 border border-sand-200/90">
                      <span className="text-charcoal-500 uppercase font-bold text-[10px] tracking-wider block mb-1">
                        Total Tariff
                      </span>
                      <div className="font-serif font-bold text-forest-900 text-base sm:text-lg">
                        ₹{booking.pricing.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-charcoal-500 mt-0.5 text-[11px]">
                        Includes local community fund
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <div className="text-xs text-charcoal-600 bg-sand-50 p-3 rounded-xl border border-sand-200">
                      <span className="font-semibold text-charcoal-800 block mb-0.5">Special Requests:</span>
                      <p>{booking.specialRequests}</p>
                    </div>
                  )}

                  {/* Cancellation Reason if cancelled/rejected */}
                  {booking.cancellationReason && (
                    <div className="text-xs text-charcoal-600 bg-sand-100 p-3 rounded-xl border border-sand-200">
                      <span className="font-semibold text-charcoal-800 block mb-0.5">Note:</span>
                      <p>{booking.cancellationReason}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-charcoal-500 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
                      <span>Payment directly settled with host on arrival (Cash or UPI)</span>
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="text-xs font-semibold text-clay-700 hover:text-clay-800 underline transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}
                  </div>

                  {/* Dynamic Location-Based Destination Guide Discovery (Shown when confirmed) */}
                  {booking.status === 'confirmed' && (
                    <>
                      <DestinationGuidesSection
                        booking={booking}
                        allUserStays={bookings.filter((b) => b.status === 'confirmed')}
                        onBookingCreated={refreshGuideBookings}
                      />
                      <DestinationTreasuresSection booking={booking} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
