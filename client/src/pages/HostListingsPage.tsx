import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Plus,
  ShieldCheck,
  Clock,
  AlertCircle,
  Edit3,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  EyeOff,
  Tag,
} from 'lucide-react';
import { AccommodationRecord } from '../types';
import { apiService } from '../services/api';
import { ListingFormModal } from '../components/host/ListingFormModal';
import { HostVerificationModal } from '../components/host/HostVerificationModal';

export const HostListingsPage: React.FC = () => {
  const [listings, setListings] = useState<AccommodationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<AccommodationRecord | null>(null);
  const [verificationModalStay, setVerificationModalStay] = useState<AccommodationRecord | null>(
    null
  );

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getHostListings();
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your homestay listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleOpenCreate = () => {
    setEditingListing(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (listing: AccommodationRecord) => {
    setEditingListing(listing);
    setIsModalOpen(true);
  };

  const handleListingSaved = (saved: AccommodationRecord) => {
    setListings((prev) => {
      const idx = prev.findIndex((l) => l.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleOpenVerification = (stay: AccommodationRecord) => {
    setVerificationModalStay(stay);
  };

  const handleDeactivate = async (stay: AccommodationRecord) => {
    const isCurrentlyDraft = stay.publicationStatus === 'draft';
    const confirmMsg = isCurrentlyDraft
      ? `Archive '${stay.name}'? It will no longer accept bookings.`
      : `Delist '${stay.name}' from public search? Confirmed bookings will remain active.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const result = await apiService.deactivateHostListing(
        stay.id,
        'Host toggled listing status from portal.'
      );
      handleListingSaved(result.listing);
      alert(result.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update listing status.');
    }
  };

  // Metrics
  const total = listings.length;
  const verifiedCount = listings.filter((l) => l.verificationStatus === 'verified').length;
  const pendingCount = listings.filter(
    (l) => l.verificationStatus === 'verification_pending'
  ).length;
  const draftCount = listings.filter(
    (l) =>
      l.publicationStatus === 'draft' ||
      l.verificationStatus === 'unverified_lead' ||
      l.verificationStatus === 'rejected_or_inactive'
  ).length;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-sand-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-950">
                My Homestay Listings
              </h1>
              <p className="text-sm text-charcoal-600 mt-0.5">
                Manage your authentic Uttarakhand accommodations and track verification status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/host/bookings"
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-sand-300 text-charcoal-700 hover:bg-sand-100 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Manage Bookings</span>
            </Link>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-forest-700 hover:bg-forest-800 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Homestay</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Total Listings
            </div>
            <div className="text-2xl font-serif font-bold text-forest-950 mt-1">{total}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Verified & Bookable
            </div>
            <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
              {verifiedCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              In Verification Queue
            </div>
            <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Drafts & Needs Attention
            </div>
            <div className="text-2xl font-serif font-bold text-charcoal-800 mt-1">
              {draftCount}
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-sand-300">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-forest-700 border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium text-charcoal-600">Loading your homestays...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button
              onClick={fetchListings}
              className="mt-3 px-4 py-1.5 text-xs font-semibold bg-forest-700 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-sand-300 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
              <Home className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h2 className="font-serif text-lg font-bold text-forest-950">
                No Homestays Listed Yet
              </h2>
              <p className="text-xs text-charcoal-600">
                Share your heritage Kumaoni or Garhwali village home with conscious travelers.
                Create your first listing and submit it for field verification.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Create First Listing
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {listings.map((stay) => {
              const isVerified = stay.verificationStatus === 'verified';
              const isPending = stay.verificationStatus === 'verification_pending';
              const isRejected = stay.verificationStatus === 'rejected_or_inactive';
              const isDraft = stay.publicationStatus === 'draft';

              return (
                <div
                  key={stay.id}
                  className="bg-white rounded-2xl border border-sand-300 overflow-hidden shadow-sm hover:border-sand-400 transition-all flex flex-col md:flex-row"
                >
                  {/* Property Image Banner */}
                  <div className="md:w-64 h-48 md:h-auto bg-sand-200 relative flex-shrink-0">
                    <img
                      src={
                        stay.imagePlaceholder ||
                        (stay.images && stay.images[0]) ||
                        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={stay.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700 text-white shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified Listing
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-600 text-white shadow-sm">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-600 text-white shadow-sm">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected / Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sand-700 text-white shadow-sm">
                          Draft Listing
                        </span>
                      )}

                      {isDraft && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-900/80 text-sand-100">
                          <EyeOff className="w-3 h-3" />
                          Unlisted
                        </span>
                      )}

                      {stay.assignmentStatus === 'assigned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-700 text-white shadow-sm">
                          <Tag className="w-3 h-3" />
                          Admin-Assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details & Controls */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-clay-700 uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {stay.locality}, {stay.district}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-serif text-lg font-bold text-forest-950">
                            ₹{stay.pricePerNight?.toLocaleString('en-IN') || 1800}
                          </span>
                          <span className="text-xs text-charcoal-500 font-normal"> / night</span>
                        </div>
                      </div>

                      <h2 className="font-serif text-xl font-bold text-forest-950">{stay.name}</h2>
                      <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
                        {stay.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-charcoal-600">
                        <span className="inline-flex items-center gap-1 bg-sand-100 px-2.5 py-1 rounded-md">
                          <Users className="w-3.5 h-3.5 text-forest-700" />
                          Max {stay.guestCapacity?.maxGuests || 4} Guests
                        </span>
                        <span className="inline-flex items-center gap-1 bg-sand-100 px-2.5 py-1 rounded-md">
                          <Home className="w-3.5 h-3.5 text-forest-700" />
                          {stay.guestCapacity?.roomCount || 1} Rooms
                        </span>
                        <span className="capitalize bg-sand-100 px-2.5 py-1 rounded-md">
                          {stay.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Admin Assigned Property Notice */}
                    {stay.assignmentStatus === 'assigned' && (
                      <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-700 shrink-0" />
                          <span>
                            <strong>Preloaded Homestay:</strong> Assigned to your host account by StayLocal Administrator
                            {stay.assignedByName ? ` (${stay.assignedByName})` : ''}
                          </span>
                        </div>
                        {!isVerified && (
                          <button
                            type="button"
                            onClick={() => handleOpenVerification(stay)}
                            className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-md self-start sm:self-auto transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>
                              {isPending ? 'Review Authorization Submission' : 'Submit Authorization Proof'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Admin Feedback Box if applicable */}
                    {stay.verificationNotes && (
                      <div
                        className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                          isRejected
                            ? 'bg-red-50/80 border-red-200 text-red-900'
                            : isVerified
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50/80 border-amber-200 text-amber-900'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold">
                            {isVerified
                              ? 'Admin Verification Note'
                              : isRejected
                              ? 'Admin Review Feedback (Action Required)'
                              : 'Review Status'}
                          </div>
                          <p className="leading-relaxed">{stay.verificationNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-3 border-t border-sand-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* If not verified, allow submitting for verification */}
                        {!isVerified && (
                          <button
                            onClick={() => handleOpenVerification(stay)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {stay.assignmentStatus === 'assigned'
                                ? isPending
                                  ? 'Update Authorization'
                                  : 'Verify Property'
                                : isPending
                                ? 'Update Verification'
                                : 'Submit for Verification'}
                            </span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(stay)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-sand-300 hover:bg-sand-100 text-charcoal-700 transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>

                        <button
                          onClick={() => handleDeactivate(stay)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-sand-300 hover:bg-sand-100 text-charcoal-600 transition-colors"
                        >
                          {isDraft ? 'Re-publish Listing' : 'Unlist / Pause'}
                        </button>
                      </div>

                      {isVerified && (
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Eligible for Public Bookings</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create / Edit Listing */}
        <ListingFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleListingSaved}
          initialData={editingListing}
        />

        {/* Modal: Host Authorization & Property Verification */}
        {verificationModalStay && (
          <HostVerificationModal
            isOpen={Boolean(verificationModalStay)}
            onClose={() => setVerificationModalStay(null)}
            onSaved={handleListingSaved}
            stay={verificationModalStay}
            onOpenEditDetails={() => {
              const stayToEdit = verificationModalStay;
              setVerificationModalStay(null);
              handleOpenEdit(stayToEdit);
            }}
          />
        )}
      </div>
    </div>
  );
};
