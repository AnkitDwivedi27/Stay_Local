import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccommodationRecord, BookingRecord, AvailabilityCheckResponse } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bed,
  Info,
  RefreshCw,
} from 'lucide-react';

interface BookingModalProps {
  stay: AccommodationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: BookingRecord) => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialBeds?: number;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  stay,
  isOpen,
  onClose,
  onBookingSuccess,
  initialCheckIn,
  initialCheckOut,
  initialBeds,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Default dates
  const defaultCheckInDate = useMemo(() => {
    if (initialCheckIn) {
      return initialCheckIn.split('T')[0];
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [initialCheckIn]);

  const defaultCheckOutDate = useMemo(() => {
    if (initialCheckOut) {
      return initialCheckOut.split('T')[0];
    }
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, [initialCheckOut]);

  // Form State
  const [checkInDate, setCheckInDate] = useState<string>(defaultCheckInDate);
  const [checkInTime, setCheckInTime] = useState<string>('12:00');
  const [checkOutDate, setCheckOutDate] = useState<string>(defaultCheckOutDate);
  const [checkOutTime, setCheckOutTime] = useState<string>('10:00');

  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [maleGuests, setMaleGuests] = useState<number>(0);
  const [femaleGuests, setFemaleGuests] = useState<number>(0);
  const [bedsRequired, setBedsRequired] = useState<number>(initialBeds || 1);
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Availability & Submission State
  const [availability, setAvailability] = useState<AvailabilityCheckResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null);

  // Synchronize initial dates if provided
  useEffect(() => {
    if (initialCheckIn) {
      const parts = initialCheckIn.split('T');
      if (parts[0]) setCheckInDate(parts[0]);
      if (parts[1]) setCheckInTime(parts[1].substring(0, 5));
    }
    if (initialCheckOut) {
      const parts = initialCheckOut.split('T');
      if (parts[0]) setCheckOutDate(parts[0]);
      if (parts[1]) setCheckOutTime(parts[1].substring(0, 5));
    }
    if (initialBeds) {
      setBedsRequired(initialBeds);
    }
  }, [initialCheckIn, initialCheckOut, initialBeds]);

  // Calculate full ISO timestamps in UTC
  const fullCheckInIso = useMemo(() => {
    try {
      const d = new Date(`${checkInDate}T${checkInTime}:00`);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    } catch {
      return '';
    }
  }, [checkInDate, checkInTime]);

  const fullCheckOutIso = useMemo(() => {
    try {
      const d = new Date(`${checkOutDate}T${checkOutTime}:00`);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    } catch {
      return '';
    }
  }, [checkOutDate, checkOutTime]);

  const totalGuests = adults + children;
  const totalBeds = stay?.totalBeds || (stay?.guestCapacity?.roomCount ? stay.guestCapacity.roomCount * 2 : (stay?.guestCapacity?.maxGuests || 4));
  const maxGuests = stay?.guestCapacity?.maxGuests || 4;
  const pricePerNight = stay?.pricePerNight || 1800;
  const isVerified = stay?.verificationStatus === 'verified';

  // Duration in hours & nights
  const { diffHours, nights } = useMemo(() => {
    if (!fullCheckInIso || !fullCheckOutIso) return { diffHours: 0, nights: 0 };
    const tIn = new Date(fullCheckInIso).getTime();
    const tOut = new Date(fullCheckOutIso).getTime();
    if (tOut <= tIn) return { diffHours: 0, nights: 0 };

    const hours = Math.round((tOut - tIn) / (1000 * 60 * 60));
    const calcNights = Math.max(1, Math.round((tOut - tIn) / (1000 * 60 * 60 * 24)));
    return { diffHours: hours, nights: calcNights };
  }, [fullCheckInIso, fullCheckOutIso]);

  // Live price calculation
  const baseAmount = pricePerNight * nights;
  const communityFee = Math.round(baseAmount * 0.05);
  const taxAmount = Math.round(baseAmount * 0.05);
  const totalAmount = baseAmount + communityFee + taxAmount;

  // Real-time authoritative availability check
  const checkLiveAvailability = useCallback(async () => {
    if (!stay || !fullCheckInIso || !fullCheckOutIso || nights < 1) return;

    try {
      setCheckingAvailability(true);
      const data = await apiService.checkStayAvailability(stay.id, {
        checkIn: fullCheckInIso,
        checkOut: fullCheckOutIso,
        beds: bedsRequired,
      });
      setAvailability(data);
    } catch (err) {
      console.warn('Availability check fallback', err);
    } finally {
      setCheckingAvailability(false);
    }
  }, [stay, fullCheckInIso, fullCheckOutIso, bedsRequired, nights]);

  // Trigger availability check when time/beds change
  useEffect(() => {
    if (isOpen && stay) {
      checkLiveAvailability();
    }
  }, [isOpen, stay, checkLiveAvailability]);

  // Subscribe to real-time SSE stream while modal is open
  useEffect(() => {
    if (!isOpen || !stay) return;

    const unsubscribe = apiService.subscribeStayAvailability(stay.id, () => {
      checkLiveAvailability();
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, stay, checkLiveAvailability]);

  if (!isOpen || !stay) return null;

  // Gender composition validation
  const hasGenderSpecified = maleGuests > 0 || femaleGuests > 0;
  const isGenderCountMatching = !hasGenderSpecified || (maleGuests + femaleGuests === totalGuests);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/stays' } } });
      return;
    }

    if (nights < 1 || new Date(fullCheckOutIso) <= new Date(fullCheckInIso)) {
      setErrorMessage('Check-out date/time must be strictly after check-in date/time.');
      return;
    }

    if (totalGuests > maxGuests) {
      setErrorMessage(`This homestay can accommodate a maximum of ${maxGuests} guests.`);
      return;
    }

    if (hasGenderSpecified && !isGenderCountMatching) {
      setErrorMessage(`Total male (${maleGuests}) and female (${femaleGuests}) guests must equal the total number of guests (${totalGuests}).`);
      return;
    }

    if (availability && !availability.isAvailable) {
      setErrorMessage(`Cannot reserve ${bedsRequired} bed(s). Only ${availability.availableBeds} bed(s) are available during your selected time window.`);
      return;
    }

    try {
      setSubmitting(true);
      const booking = await apiService.createBooking({
        stayId: stay.id,
        checkIn: fullCheckInIso,
        checkOut: fullCheckOutIso,
        guestCount: totalGuests,
        adults,
        children,
        maleGuests: maleGuests > 0 ? maleGuests : undefined,
        femaleGuests: femaleGuests > 0 ? femaleGuests : undefined,
        bedsRequired,
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
          : 'Unable to create booking reservation. Please adjust dates or bed count.'
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

  // Helper format for IST display
  const formatDateTimeDisplay = (isoStr: string) => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-sand-300 overflow-hidden animate-scale-up my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-forest-800 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-forest-700/60 hover:bg-forest-700 text-sand-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest-700 text-sand-200 text-xs font-medium uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-clay-300" />
            <span>Time-Based Direct Homestay Reservation</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-sand-50">
            {stay.name}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-sand-200 mt-1">
            <span>{stay.locality}, {stay.district}</span>
            <span>•</span>
            <span>₹{pricePerNight.toLocaleString('en-IN')} / night</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-sand-300" />
              {totalBeds} total beds
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-5">
          {createdBooking ? (
            /* Success confirmation screen */
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-forest-950">
                  Booking Request Submitted
                </h3>
                <p className="text-sm text-charcoal-600 mt-1 max-w-sm mx-auto">
                  Your bed reservation request has been transmitted directly to the host family.
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
                  <span className="text-charcoal-500">Check-in Date & Time</span>
                  <span className="font-semibold text-charcoal-800">
                    {formatDateTimeDisplay(createdBooking.checkIn)} IST
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500">Check-out Date & Time</span>
                  <span className="font-semibold text-charcoal-800">
                    {formatDateTimeDisplay(createdBooking.checkOut)} IST
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500">Beds Reserved</span>
                  <span className="font-semibold text-charcoal-800">
                    🛏️ {createdBooking.bedsRequired || createdBooking.guestCount} bed(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500">Guests</span>
                  <span className="font-semibold text-charcoal-800">
                    {createdBooking.guestDetails?.adults || createdBooking.guestCount} Adults
                    {createdBooking.guestDetails?.children ? `, ${createdBooking.guestDetails.children} Children` : ''}
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
                    Status: <strong className="uppercase">Pending Host Review</strong>. Held for 30 minutes until host confirmation.
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
                This listing is currently an <strong className="text-amber-900">{stay.verificationStatus}</strong>. StayLocal strictly prohibits booking reservations for properties that have not completed physical audit.
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

              {/* Exact Check-in and Check-out Date-Time */}
              <div className="space-y-3 p-4 bg-sand-50/70 rounded-xl border border-sand-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-forest-700" />
                    Reservation Schedule (IST Timezone)
                  </span>
                  <span className="text-[11px] text-charcoal-500">
                    Host Buffer: {stay.cleaningBufferMinutes ?? 60}m prep time
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Check-in Date & Time *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        required
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="flex-grow px-2.5 py-2 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                      />
                      <input
                        type="time"
                        required
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-24 px-2 py-2 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Check-out Date & Time *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        required
                        value={checkOutDate}
                        min={checkInDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="flex-grow px-2.5 py-2 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                      />
                      <input
                        type="time"
                        required
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="w-24 px-2 py-2 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Bed Availability Live Banner */}
              <div className="transition-all">
                {checkingAvailability ? (
                  <div className="p-3 bg-sand-100 rounded-xl flex items-center gap-2 text-xs text-charcoal-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-forest-700" />
                    <span>Verifying real-time bed inventory with cleaning buffer...</span>
                  </div>
                ) : availability ? (
                  availability.isAvailable ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          <strong>{availability.availableBeds} of {availability.totalBeds} beds available</strong> for your chosen hours.
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        Inventory Locked
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Bed Capacity Limit Reached:</strong> Only {availability.availableBeds} of {availability.totalBeds} bed(s) available during these hours. Please adjust your required beds or select alternative times.
                      </div>
                    </div>
                  )
                ) : null}
              </div>

              {/* Guest Composition & Beds Required */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-sand-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
                    Guest Composition & Bed Allocation
                  </span>
                  <span className="text-xs text-charcoal-500">
                    Total: {totalGuests} / {maxGuests} Max
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-charcoal-700 mb-1">
                      Adults (12+ yrs) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={maxGuests}
                      value={adults}
                      onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-700 mb-1">
                      Children (0-11 yrs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={maxGuests - 1}
                      value={children}
                      onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-2 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-forest-900 mb-1">
                      Beds Required *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={totalBeds}
                      value={bedsRequired}
                      onChange={(e) => setBedsRequired(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 border-2 border-forest-600 rounded-lg text-xs font-bold text-forest-950 focus:ring-2 focus:ring-forest-600 bg-forest-50/50"
                    />
                  </div>
                </div>

                {/* Informational Gender Composition */}
                <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-700">
                      Informational Gender Breakdown (Optional)
                    </span>
                    <span className="text-[10px] text-charcoal-500 italic">For host room preparation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-charcoal-600 mb-1">Male Guests</label>
                      <input
                        type="number"
                        min={0}
                        max={totalGuests}
                        value={maleGuests}
                        onChange={(e) => setMaleGuests(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full px-2.5 py-1.5 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-charcoal-600 mb-1">Female Guests</label>
                      <input
                        type="number"
                        min={0}
                        max={totalGuests}
                        value={femaleGuests}
                        onChange={(e) => setFemaleGuests(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full px-2.5 py-1.5 border border-sand-300 rounded-lg text-xs text-charcoal-900 focus:ring-2 focus:ring-forest-600"
                      />
                    </div>
                  </div>
                  {hasGenderSpecified && !isGenderCountMatching && (
                    <div className="text-[11px] text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Male ({maleGuests}) + Female ({femaleGuests}) ≠ Total Guests ({totalGuests}).</span>
                    </div>
                  )}
                </div>

                {/* Host Policy Note */}
                <div className="text-[11px] text-charcoal-500 bg-sand-100/60 p-2.5 rounded-lg flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                  <span>
                    Child Policy: <strong>{stay.childOccupancyPolicy === 'requires_bed' ? 'Separate bed required for each child' : stay.childOccupancyPolicy === 'free_without_bed' ? 'Infants stay free without bed' : 'Children may share beds with adults'}</strong>.
                  </span>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Special Requests / Arrival Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Arriving by Almora shared taxi around 2:00 PM, vegetarian dinner request..."
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
                      ₹{pricePerNight} × {nights} {nights === 1 ? 'night' : 'nights'} ({diffHours}h duration)
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

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || (availability !== null && !availability.isAvailable) || (hasGenderSpecified && !isGenderCountMatching)}
                  className="flex-1 py-3 px-4 rounded-lg bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Reservation...</span>
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
