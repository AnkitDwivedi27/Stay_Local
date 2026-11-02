import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Home, ShieldCheck, HelpCircle } from 'lucide-react';
import { AccommodationRecord } from '../types';
import { apiService } from '../services/api';
import { StayCard } from '../components/stays/StayCard';
import { StayFilterBar } from '../components/stays/StayFilterBar';
import { VerificationExplainerModal } from '../components/ui/VerificationExplainerModal';
import { BookingModal } from '../components/booking/BookingModal';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export const StaysPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlDestination = searchParams.get('destination') || '';
  const urlDistrict = searchParams.get('district') || '';

  const [stays, setStays] = useState<AccommodationRecord[]>([]);
  const [destinationFilter, setDestinationFilter] = useState(urlDestination);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [minGuests, setMinGuests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [selectedStayForBooking, setSelectedStayForBooking] = useState<AccommodationRecord | null>(null);

  const destinationsList = [
    { id: 'munsiyari', name: 'Munsiyari' },
    { id: 'bhimtal', name: 'Bhimtal' },
    { id: 'bageshwar-baijnath', name: 'Bageshwar' },
    { id: 'pithoragarh-valley', name: 'Pithoragarh' },
  ];

  const loadStays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getStays({
        destination: destinationFilter,
        district: urlDistrict,
        category: categoryFilter,
        verificationStatus: verificationFilter,
        minGuests: minGuests > 0 ? minGuests : undefined,
      });
      setStays(data);
    } catch (err) {
      console.error('Failed to load stays', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve accommodation listings.');
    } finally {
      setLoading(false);
    }
  }, [destinationFilter, urlDistrict, categoryFilter, verificationFilter, minGuests]);

  useEffect(() => {
    loadStays();
  }, [loadStays]);

  const verifiedCount = stays.filter((s) => s.verificationStatus === 'verified').length;
  const pendingCount = stays.filter((s) => s.verificationStatus === 'verification_pending').length;
  const leadCount = stays.filter((s) => s.verificationStatus === 'unverified_lead').length;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Integrity Notice */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sand-200 pb-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-semibold tracking-wider uppercase border border-forest-200">
            <Home className="w-3.5 h-3.5 text-forest-700" />
            <span>Accommodation Discovery</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 tracking-tight">
            Uttarakhand Village Stays & Leads
          </h1>
          <p className="text-sm sm:text-base text-charcoal-600 leading-relaxed">
            Discover community homestays and regional accommodation leads across Munsiyari, Bhimtal, and Bageshwar. To maintain absolute integrity, unverified research leads are clearly segregated from verified stays.
          </p>
        </div>

        {/* Verification Explainer Button */}
        <button
          onClick={() => setExplainerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-forest-300 bg-white hover:bg-forest-50 text-xs font-semibold text-forest-800 shadow-sm transition-colors shrink-0"
        >
          <ShieldCheck className="w-4 h-4 text-forest-700" />
          <span>Understanding Verification Badges</span>
          <HelpCircle className="w-3.5 h-3.5 text-charcoal-400" />
        </button>
      </div>

      {/* Filter Bar */}
      <StayFilterBar
        destination={destinationFilter}
        onDestinationChange={setDestinationFilter}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
        verificationStatus={verificationFilter}
        onVerificationStatusChange={setVerificationFilter}
        minGuests={minGuests}
        onMinGuestsChange={setMinGuests}
        destinationsList={destinationsList}
      />

      {/* Transparent Counts Counter */}
      <div className="flex flex-wrap items-center justify-between text-xs text-charcoal-600 bg-white/70 backdrop-blur-xs p-4 rounded-2xl border border-sand-200 shadow-xs gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-semibold text-charcoal-900 tracking-tight mr-1">
            Directory Breakdown ({stays.length} total entries):
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            {verifiedCount} Verified Homestays
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {pendingCount} Verification Pending
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sand-100 text-charcoal-700 border border-sand-200">
            <span className="w-2 h-2 rounded-full bg-charcoal-400" />
            {leadCount} Unverified Research Leads
          </span>
        </div>
        <span className="text-[11px] text-charcoal-500 font-medium">
          Zero automated markups · Direct community settlement
        </span>
      </div>

      {/* Stays Content: Loading, Error, Empty, or Data Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-sand-200 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          title="Could Not Load Accommodations"
          message={error}
          onRetry={loadStays}
        />
      ) : stays.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 p-8 space-y-3">
          <p className="font-serif text-lg text-charcoal-800 font-semibold">
            No accommodations match the selected filters.
          </p>
          <p className="text-xs text-charcoal-500">
            Try adjusting your accommodation category or clearing destination filters.
          </p>
          <button
            onClick={() => {
              setDestinationFilter('');
              setCategoryFilter('');
              setVerificationFilter('');
              setMinGuests(0);
            }}
            className="text-xs font-semibold text-forest-700 hover:underline pt-2"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stays.map((stay) => (
            <StayCard
              key={stay.id}
              stay={stay}
              onOpenExplainer={() => setExplainerOpen(true)}
              onBookStay={(selected) => setSelectedStayForBooking(selected)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        stay={selectedStayForBooking}
        isOpen={Boolean(selectedStayForBooking)}
        onClose={() => setSelectedStayForBooking(null)}
      />

      {/* Verification Explainer Modal */}
      <VerificationExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  );
};
