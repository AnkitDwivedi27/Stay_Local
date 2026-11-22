import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookingRecord, BookingStatus } from '../types';
import { apiService } from '../services/api';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Home,
  Check,
  X,
  ShieldAlert,
  Phone,
  Mail,
  Ban,
  Bed,
  BarChart3,
  CalendarDays,
} from 'lucide-react';

export const HostBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'timeline'>('all');

  const fetchHostBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getHostBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve host bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostBookings();
  }, [fetchHostBookings]);

  const handleConfirm = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      setActionError(null);
      setActionSuccess(null);
      const updated = await apiService.confirmBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      setActionSuccess(`Reservation ${updated.bookingReference} confirmed successfully! Beds and dates are locked.`);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to confirm booking. It may conflict with an existing reservation.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = window.prompt(
      'Please provide an optional reason for declining this request (e.g. seasonal maintenance, room repair):',
      'Seasonal room maintenance'
    );
    if (reason === null) return;

    try {
      setProcessingId(bookingId);
      setActionError(null);
      setActionSuccess(null);
      const updated = await apiService.rejectBooking(bookingId, reason || undefined);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      setActionSuccess(`Request ${updated.bookingReference} declined and bed inventory released.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to decline booking request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatIST = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return isoStr;
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
            Awaiting Your Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sand-200 text-charcoal-700 border border-sand-300">
            <Ban className="w-3.5 h-3.5" />
            Cancelled by Guest
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    if (activeTab === 'pending') return bookings.filter((b) => b.status === 'pending');
    if (activeTab === 'confirmed') return bookings.filter((b) => b.status === 'confirmed');
    return bookings;
  }, [bookings, activeTab]);

  // Timeline & Bed Occupancy statistics
  const activeReservations = useMemo(() => {
    return bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  }, [bookings]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-300 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider border border-amber-200 mb-2">
              <Home className="w-3.5 h-3.5 text-amber-700" />
              <span>Host Operations Dashboard</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-forest-950">
              Manage Booking Requests
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
              Time-based interval management, real-time bed inventory allocation, and guest turnover scheduling for your verified homestays.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-sand-200 pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
            }`}
          >
            Pending Review ({bookings.filter((b) => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'confirmed'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
            }`}
          >
            Confirmed ({bookings.filter((b) => b.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-clay-700 text-white shadow-xs'
                : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bed Timeline View ({activeReservations.length})</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{actionSuccess}</div>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{actionError}</div>
          </div>
        )}

        {/* Timeline View */}
        {activeTab === 'timeline' ? (
          <div className="bg-white rounded-2xl p-6 border border-sand-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-forest-700" />
                <h3 className="font-serif text-lg font-bold text-forest-950">
                  Bed Occupancy & Turnover Schedule
                </h3>
              </div>
              <span className="text-xs text-charcoal-500 font-medium">
                Indian Standard Time (IST)
              </span>
            </div>

            {activeReservations.length === 0 ? (
              <div className="py-12 text-center text-charcoal-500 text-xs">
                No active reservations currently scheduled. Beds are completely available!
              </div>
            ) : (
              <div className="space-y-3">
                {activeReservations.map((res) => {
                  const beds = res.bedsRequired || res.guestCount || 1;
                  const isConfirmed = res.status === 'confirmed';

                  return (
                    <div
                      key={res.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isConfirmed
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/60 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold tracking-wider">{res.bookingReference}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isConfirmed ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                          }`}>
                            {res.status}
                          </span>
                          <span className="font-medium text-charcoal-700">{res.stayName}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-charcoal-600 pt-0.5">
                          <span>
                            <strong>Arrival:</strong> {formatIST(res.checkIn)} IST
                          </span>
                          <span>→</span>
                          <span>
                            <strong>Departure:</strong> {formatIST(res.checkOut)} IST
                          </span>
                          <span className="text-charcoal-400">
                            (+{res.cleaningBufferMinutes ?? 60}m prep buffer)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 sm:text-right">
                        <div>
                          <div className="font-bold text-forest-900 flex items-center sm:justify-end gap-1">
                            <Bed className="w-3.5 h-3.5 text-forest-700" />
                            <span>{beds} Bed(s) Occupied</span>
                          </div>
                          <div className="text-[10px] text-charcoal-500">
                            {res.guestDetails?.adults || res.guestCount} Adults
                            {res.guestDetails?.children ? `, ${res.guestDetails.children} Children` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : loading ? (
          /* Loading Skeleton */
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-sand-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-sand-300">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchHostBookings}
              className="mt-3 text-xs text-forest-700 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-sand-300 p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 text-amber-700" />
            </div>
            <h3 className="font-serif text-xl font-bold text-forest-950">
              No Booking Requests in this View
            </h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              When travelers book your homestay, their reservations will appear here for confirmation and schedule management.
            </p>
          </div>
        ) : (
          /* Bookings Cards */
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const isPending = booking.status === 'pending';
              const beds = booking.bedsRequired || booking.guestCount || 1;
              const adults = booking.guestDetails?.adults ?? booking.guestCount ?? 1;
              const children = booking.guestDetails?.children ?? 0;
              const male = booking.guestDetails?.maleGuests;
              const female = booking.guestDetails?.femaleGuests;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-sand-300 space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-xl font-bold text-forest-950">
                          {booking.stayName}
                        </h3>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sand-100 text-charcoal-600 border border-sand-200">
                          {booking.bookingReference}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-clay-500 shrink-0" />
                        <span>
                          {booking.stayLocality}, {booking.stayDistrict} District
                        </span>
                      </div>
                    </div>
                    <div>{getStatusBadge(booking.status)}</div>
                  </div>

                  {/* Guest & Reservation Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Guest Contact & Party Composition */}
                    <div className="p-3.5 rounded-xl bg-sand-50/70 border border-sand-200 space-y-1">
                      <span className="text-charcoal-500 uppercase font-semibold text-[10px] block">
                        Guest & Group Details
                      </span>
                      <div className="font-semibold text-charcoal-900 text-sm">
                        {booking.touristName}
                      </div>
                      <div className="text-charcoal-700 text-xs font-medium pt-0.5">
                        {adults} Adult{adults > 1 ? 's' : ''}
                        {children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}
                        {(male !== undefined || female !== undefined) && (
                          <span className="text-charcoal-500 text-[11px] block">
                            (Gender: {male ?? 0} Male, {female ?? 0} Female)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-charcoal-600 pt-1">
                        <Mail className="w-3 h-3 text-charcoal-400" />
                        <span>{booking.touristEmail}</span>
                      </div>
                      {booking.touristPhone && (
                        <div className="flex items-center gap-1 text-charcoal-600">
                          <Phone className="w-3 h-3 text-charcoal-400" />
                          <span>{booking.touristPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Precise Time Window & Bed Inventory */}
                    <div className="p-3.5 rounded-xl bg-sand-50/70 border border-sand-200 space-y-1.5">
                      <span className="text-charcoal-500 uppercase font-semibold text-[10px] block">
                        Schedule & Inventory
                      </span>
                      <div className="space-y-0.5 text-charcoal-800">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-semibold text-charcoal-600">In:</span>
                          <span>{formatIST(booking.checkIn)} IST</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-semibold text-charcoal-600">Out:</span>
                          <span>{formatIST(booking.checkOut)} IST</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-sand-200 flex items-center justify-between text-forest-900 font-bold">
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-forest-700" />
                          <span>{beds} Bed(s) Allocated</span>
                        </span>
                        <span className="text-[10px] text-charcoal-500 font-normal">
                          {booking.cleaningBufferMinutes ?? 60}m buffer
                        </span>
                      </div>
                    </div>

                    {/* Financial Payout */}
                    <div className="p-3.5 rounded-xl bg-sand-50/70 border border-sand-200 space-y-1">
                      <span className="text-charcoal-500 uppercase font-semibold text-[10px] block">
                        Gross Payout on Arrival
                      </span>
                      <div className="font-bold text-forest-900 text-sm">
                        ₹{booking.pricing.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-charcoal-500 text-[10px]">
                        Base: ₹{booking.pricing.baseAmount.toLocaleString('en-IN')} ({booking.pricing.nights} night{booking.pricing.nights > 1 ? 's' : ''})
                      </div>
                      <div className="text-[10px] text-emerald-800 font-medium">
                        Direct guest cash/UPI settlement on check-in
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <div className="text-xs text-charcoal-600 bg-sand-50 p-3 rounded-xl border border-sand-200">
                      <span className="font-semibold text-charcoal-800 block mb-0.5">Guest Arrival & Meal Notes:</span>
                      <p>{booking.specialRequests}</p>
                    </div>
                  )}

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <div className="pt-3 border-t border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Confirming locks the bed inventory. Overlapping requests will be rejected if capacity is exceeded.</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirm(booking.id)}
                          disabled={processingId === booking.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{processingId === booking.id ? 'Confirming...' : 'Confirm Reservation'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(booking.id)}
                          disabled={processingId === booking.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-clay-300 text-clay-700 hover:bg-clay-50 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Decline Request</span>
                        </button>
                      </div>
                    </div>
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
