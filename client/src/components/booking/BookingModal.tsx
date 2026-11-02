import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccommodationRecord, BookingRecord } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Users,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface BookingModalProps {
  stay: AccommodationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: BookingRecord) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  stay,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Tomorrow as default check-in
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // 3 days from now as default check-out
  const threeDaysOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, []);

  const [checkIn, setCheckIn] = useState<string>(tomorrow);
  const [checkOut, setCheckOut] = useState<string>(threeDaysOut);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null);

  if (!isOpen || !stay) return null;

  const isVerified = stay.verificationStatus === 'verified';
  const pricePerNight = stay.pricePerNight || 1800;
  const maxGuests = stay.guestCapacity?.maxGuests || 4;

  // Calculate live breakdown
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights =
    !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate
      ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  const baseAmount = pricePerNight * nights;
  const communityFee = Math.round(baseAmount * 0.05);
  const taxAmount = Math.round(baseAmount * 0.05);
  const totalAmount = baseAmount + communityFee + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/stays' } } });
      return;
    }

    if (nights < 1) {
      setErrorMessage('Please select a check-out date that is at least 1 day after check-in.');
      return;
    }

    if (guestCount > maxGuests) {
      setErrorMessage(`This homestay can accommodate a maximum of ${maxGuests} guests.`);
      return;
    }

    try {
      setSubmitting(true);
      const booking = await apiService.createBooking({
        stayId: stay.id,
        checkIn,
        checkOut,
        guestCount,
        specialRequests: specialRequests.trim() || undefined,
      });

      setCreatedBooking(booking);
      if (onBookingSuccess) {
        onBookingSuccess(booking);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to create booking request. Please verify dates and availability.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedBooking(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-sand-300 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-forest-800 text-white p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-forest-700/60 hover:bg-forest-700 text-sand-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest-700 text-sand-200 text-xs font-medium uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-clay-300" />
            <span>Direct Homestay Reservation</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-sand-50">
            {stay.name}
          </h2>
          <p className="text-xs text-sand-200 mt-1">
            {stay.locality}, {stay.district} District • ₹{pricePerNight.toLocaleString('en-IN')} / night
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdBooking ? (
            /* Success confirmation screen */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-forest-950">
                  Booking Request Submitted
                </h3>
                <p className="text-sm text-charcoal-600 mt-1 max-w-sm mx-auto">
                  Your reservation request has been transmitted directly to the host family.
                </p>
              </div>

              {/* Reference Card */}
              <div className="bg-sand-50 rounded-xl p-4 border border-sand-300 text-left max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                  <span className="text-xs text-charcoal-500 font-medium">Booking Reference</span>
                  <span className="font-mono font-bold text-forest-900 tracking-wider text-sm">
                    {createdBooking.bookingReference}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500">Dates</span>
                  <span className="font-semibold text-charcoal-800">
                    {createdBooking.checkIn} to {createdBooking.checkOut} ({createdBooking.pricing.nights} nights)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500">Guests</span>
                  <span className="font-semibold text-charcoal-800">
                    {createdBooking.guestCount} {createdBooking.guestCount === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-sand-200">
                  <span className="text-charcoal-500">Estimated Total (Pay on Arrival)</span>
                  <span className="font-bold text-forest-800 text-sm">
                    ₹{createdBooking.pricing.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Status: <strong className="uppercase">Pending Host Review</strong>. The host will confirm based on seasonal room turnover.
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    navigate('/bookings');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors"
                >
                  <span>Go to My Bookings</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-lg border border-sand-300 hover:bg-sand-100 text-charcoal-700 text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !isVerified ? (
            /* Unverified listing warning */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal-900">
                Direct Booking Unavailable
              </h3>
              <p className="text-sm text-charcoal-600 max-w-md mx-auto leading-relaxed">
                This listing is currently an{' '}
                <strong className="text-amber-900">{stay.verificationStatus}</strong>. StayLocal strictly prohibits booking reservations for properties that have not completed full physical inspection, sanitation audit, and district tourism registration.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 rounded-lg bg-forest-700 text-white text-sm font-medium hover:bg-forest-800 transition-colors"
              >
                Explore Other Verified Homestays
              </button>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {!isAuthenticated && (
                <div className="p-3 rounded-xl bg-sand-100 border border-sand-200 text-xs text-charcoal-700 flex items-center justify-between">
                  <span>Sign in required to request booking</span>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: { pathname: '/stays' } } })}
                    className="font-semibold text-forest-800 underline hover:text-forest-900"
                  >
                    Sign in here
                  </button>
                </div>
              )}

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="checkInDate"
                    className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
                  >
                    Check-in Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="checkInDate"
                      type="date"
                      required
                      min={tomorrow}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-sand-300 rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="checkOutDate"
                    className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
                  >
                    Check-out Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="checkOutDate"
                      type="date"
                      required
                      min={checkIn || tomorrow}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-sand-300 rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label
                  htmlFor="guestCount"
                  className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
                >
                  Number of Guests (Max {maxGuests}) *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="guestCount"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 border border-sand-300 rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label
                  htmlFor="specialRequests"
                  className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5"
                >
                  Special Requests / Dietary Needs (Optional)
                </label>
                <textarea
                  id="specialRequests"
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Vegetarian Kumaoni meals, arriving by late evening bus from Kathgodam..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              {/* Live Price Breakdown Preview */}
              {nights > 0 && (
                <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-2 text-xs">
                  <div className="font-semibold text-forest-900 uppercase tracking-wider text-[11px] pb-1 border-b border-sand-200 flex items-center justify-between">
                    <span>Price Breakdown Preview</span>
                    <span className="text-charcoal-500 font-normal">
                      ₹{pricePerNight} × {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Base Accommodation Rate</span>
                    <span className="font-medium">₹{baseAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-clay-600" />
                      Village Community Fund (5%)
                    </span>
                    <span className="font-medium">₹{communityFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Sustainable Tourism Tax / GST (5%)</span>
                    <span className="font-medium">₹{taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-sand-200 text-sm font-bold text-forest-950">
                    <span>Estimated Total</span>
                    <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[11px] text-charcoal-500 pt-1 italic">
                    * No online payment collected. Direct payment to host upon arrival in cash or UPI.
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || nights < 1}
                  className="flex-1 py-3 px-4 rounded-lg bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <span>Request Homestay Reservation</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-3 rounded-lg border border-sand-300 hover:bg-sand-100 text-charcoal-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
