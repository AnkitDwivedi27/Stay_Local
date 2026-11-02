import React, { useState } from 'react';
import {
  Compass,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
  Home,
} from 'lucide-react';
import { GuideBookingRecord, GuideBookingStatus } from '../../types';
import { apiService } from '../../services/api';

interface MyGuideBookingsSectionProps {
  bookings: GuideBookingRecord[];
  onRefresh: () => void;
}

export const MyGuideBookingsSection: React.FC<MyGuideBookingsSectionProps> = ({
  bookings,
  onRefresh,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this guide booking request?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setActionError(null);
      await apiService.cancelGuideBooking(bookingId, 'Cancelled by traveler');
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to cancel guide booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: GuideBookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed by Guide
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Guide Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Declined by Guide
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
            Experience Completed
          </span>
        );
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-sand-300 p-8 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-lg font-bold text-forest-950">
          No Guide Experiences Booked Yet
        </h3>
        <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
          When you book guided mountain treks or village craft walks, your reservations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>{actionError}</div>
        </div>
      )}

      {bookings.map((booking) => {
        const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

        return (
          <div
            key={booking.id}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-sand-300 space-y-4"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-200">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-forest-950">
                    {booking.experienceTitle}
                  </h3>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sand-100 text-charcoal-600 border border-sand-200">
                    {booking.bookingReference}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-clay-500 shrink-0" />
                  <span>
                    {booking.location.locality}, {booking.location.district} District
                  </span>
                </div>
              </div>
              <div>{getStatusBadge(booking.status)}</div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1 text-xs">
              <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                <span className="text-[11px] text-charcoal-500 block mb-0.5">Assigned Guide:</span>
                <span className="font-bold text-charcoal-900 block truncate">{booking.guideName}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                <span className="text-[11px] text-charcoal-500 block mb-0.5">Date & Time:</span>
                <span className="font-semibold text-charcoal-900 block truncate">
                  {booking.bookingDate}
                </span>
                <span className="text-[10px] text-charcoal-500">{booking.timeSlot}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                <span className="text-[11px] text-charcoal-500 block mb-0.5">Participants:</span>
                <span className="font-semibold text-charcoal-900 flex items-center gap-1">
                  <Users className="w-3 h-3 text-forest-700" />
                  {booking.participantCount} Person(s)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                <span className="text-[11px] text-charcoal-500 block mb-0.5">Total Payable:</span>
                <span className="font-bold text-forest-900 block text-sm">
                  ₹{booking.pricing.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Linked Homestay Trip Badge */}
            {booking.linkedHomestayBookingId && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-forest-50/70 border border-forest-200 text-xs text-forest-900">
                <Home className="w-4 h-4 text-forest-700 shrink-0" />
                <span>
                  Linked to your confirmed StayLocal homestay reservation ({booking.linkedHomestayBookingId}).
                </span>
              </div>
            )}

            {/* Meeting Point / Special requests */}
            {booking.location.meetingPoint && (
              <div className="text-xs text-charcoal-600 bg-sand-50 p-2.5 rounded-xl border border-sand-200">
                <span className="font-semibold text-charcoal-800">Meeting Point: </span>
                {booking.location.meetingPoint}
              </div>
            )}

            {/* Rejection / Cancellation Notes */}
            {booking.rejectionReason && (
              <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span className="font-semibold">Guide Decline Reason: </span>
                {booking.rejectionReason}
              </div>
            )}

            {booking.cancellationReason && (
              <div className="text-xs text-charcoal-600 bg-sand-100 p-2.5 rounded-xl border border-sand-200">
                <span className="font-semibold">Cancellation Note: </span>
                {booking.cancellationReason}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-sand-200 text-xs">
              <span className="text-charcoal-400">
                Booked on {new Date(booking.createdAt).toLocaleDateString()}
              </span>
              {canCancel && (
                <button
                  type="button"
                  disabled={cancellingId === booking.id}
                  onClick={() => handleCancel(booking.id)}
                  className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold transition-colors disabled:opacity-50"
                >
                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Guide Booking'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
