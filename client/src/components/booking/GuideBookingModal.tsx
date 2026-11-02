import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Home,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { GuideExperienceRecord, BookingRecord } from '../../types';
import { apiService } from '../../services/api';

interface GuideBookingModalProps {
  experience: GuideExperienceRecord;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  linkedHomestayBooking?: BookingRecord;
  allUserStays?: BookingRecord[];
}

export const GuideBookingModal: React.FC<GuideBookingModalProps> = ({
  experience,
  isOpen,
  onClose,
  onSuccess,
  linkedHomestayBooking,
  allUserStays = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [selectedHomestayId, setSelectedHomestayId] = useState<string>(
    linkedHomestayBooking ? linkedHomestayBooking.id : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Default date to first available slot or today
  useEffect(() => {
    if (experience.availableSlots && experience.availableSlots.length > 0) {
      const firstAvailable = experience.availableSlots[0];
      if (firstAvailable) {
        setSelectedDate(firstAvailable.date);
        if (firstAvailable.timeSlots.length > 0) {
          setSelectedSlot(firstAvailable.timeSlots[0] || '');
        }
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0] || '';
      setSelectedDate(dateStr);
      setSelectedSlot('09:00 AM - 12:00 PM');
    }
    if (linkedHomestayBooking) {
      setSelectedHomestayId(linkedHomestayBooking.id);
    }
  }, [experience, linkedHomestayBooking]);

  if (!isOpen) return null;

  // Available slots for selected date
  const dateSlots =
    experience.availableSlots?.find((s) => s.date === selectedDate)?.timeSlots || [
      '09:00 AM - 12:00 PM',
      '02:00 PM - 05:00 PM',
    ];

  // Price calculation
  const calculatedTotal =
    experience.pricingType === 'per_group'
      ? experience.price
      : experience.price * participantCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!selectedDate) {
      setError('Please select an experience date.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }
    if (participantCount < 1 || participantCount > experience.maxGroupSize) {
      setError(`Participants must be between 1 and ${experience.maxGroupSize}.`);
      return;
    }

    try {
      setSubmitting(true);
      await apiService.createGuideBooking({
        experienceId: experience.id,
        bookingDate: selectedDate,
        timeSlot: selectedSlot,
        participantCount,
        specialRequests: specialRequests.trim() || undefined,
        linkedHomestayBookingId: selectedHomestayId || undefined,
      });

      setSuccessMsg('Booking request successfully sent to the local guide!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit guide booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-sand-300 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-sand-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-50 text-forest-800 border border-forest-200 mb-1">
              <Compass className="w-3.5 h-3.5 text-forest-700" />
              <span>Book Local Guide Experience</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-forest-950">
              {experience.title}
            </h2>
            <p className="text-xs text-charcoal-600 mt-0.5">
              Guided by <span className="font-semibold text-charcoal-800">{experience.guideName}</span> •{' '}
              {experience.locality}, {experience.district}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sand-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linked Homestay Trip Selector */}
          {allUserStays.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
              <label className="flex items-center gap-1.5 font-semibold text-amber-950">
                <Home className="w-3.5 h-3.5 text-amber-700" />
                <span>Link to a Homestay Trip (Optional)</span>
              </label>
              <select
                value={selectedHomestayId}
                onChange={(e) => setSelectedHomestayId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-xs text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">No homestay linked (Independent experience)</option>
                {allUserStays.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stayName} ({s.stayLocality}, {s.stayDistrict}) • Ref: {s.bookingReference}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-amber-800/80">
                Linking helps your local guide coordinate meeting points with your village host.
              </p>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Select Experience Date
            </label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Select Time Slot
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dateSlots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors text-left ${
                    selectedSlot === slot
                      ? 'border-forest-700 bg-forest-50 text-forest-900 font-semibold'
                      : 'border-sand-300 hover:border-forest-500 text-charcoal-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Participants (Max {experience.maxGroupSize})
              </label>
              <div className="flex items-center border border-sand-300 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setParticipantCount((prev) => Math.max(1, prev - 1))}
                  className="px-3.5 py-2.5 bg-sand-100 hover:bg-sand-200 text-charcoal-700 font-bold transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center font-semibold text-sm text-charcoal-900">
                  {participantCount}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setParticipantCount((prev) =>
                      Math.min(experience.maxGroupSize, prev + 1)
                    )
                  }
                  className="px-3.5 py-2.5 bg-sand-100 hover:bg-sand-200 text-charcoal-700 font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Pricing Breakdown
              </label>
              <div className="p-2.5 rounded-xl bg-sand-50 border border-sand-200 text-xs space-y-1">
                <div className="flex justify-between text-charcoal-600">
                  <span>
                    Rate ({experience.pricingType === 'per_group' ? 'per group' : 'per person'}):
                  </span>
                  <span className="font-medium">₹{experience.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-forest-900 border-t border-sand-200 pt-1">
                  <span>Total Payable:</span>
                  <span>₹{calculatedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Special Requests or Dietary / Fitness Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g. Bringing trekking poles; vegetarian food preferences; beginner hiker..."
              className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Trust Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sand-100/70 border border-sand-200 text-[11px] text-charcoal-600">
            <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
            <span>
              Your request goes directly to the certified guide. You pay locally upon meeting; no prepayment required.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-charcoal-600 hover:bg-sand-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              <span>{submitting ? 'Submitting Request...' : `Send Request • ₹${calculatedTotal.toLocaleString()}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
