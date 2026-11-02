import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Home,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Phone,
  Mail,
  ArrowLeft,
  FileText,
  HeartHandshake,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AccommodationRecord } from '../types';
import { apiService } from '../services/api';
import { VerificationBadge } from '../components/ui/Badge';
import { BookingModal } from '../components/booking/BookingModal';
import { VerificationExplainerModal } from '../components/ui/VerificationExplainerModal';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/ui/Button';

const CATEGORY_LABELS: Record<string, string> = {
  village_homestay: 'Village Homestay',
  heritage_farmstay: 'Heritage Farmstay',
  eco_lodge: 'Mountain Eco-Lodge',
  mountain_cottage: 'Mountain Cottage',
  bed_and_breakfast: 'Local Bed & Breakfast',
};

export const StayDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stay, setStay] = useState<AccommodationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);

  const fetchStay = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getStayById(id);
      setStay(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stay details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStay();
  }, [fetchStay]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-sand-200 rounded" />
        <div className="h-96 bg-sand-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 bg-sand-200 rounded w-3/4" />
            <div className="h-4 bg-sand-200 rounded w-1/2" />
            <div className="h-24 bg-sand-200 rounded" />
          </div>
          <div className="h-64 bg-sand-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !stay) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-2xl text-center space-y-6">
        <ErrorMessage
          title="Listing Not Found"
          message={error || `We could not locate an accommodation matching '${id}'. It may be unpublished or unlisted.`}
          onRetry={fetchStay}
        />
        <div>
          <Link to="/stays">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Accommodations Directory</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = stay.verificationStatus === 'verified';
  const isPending = stay.verificationStatus === 'verification_pending';
  const price = stay.pricePerNight || 1800;
  const maxGuests = stay.guestCapacity?.maxGuests || 4;
  const roomCount = stay.guestCapacity?.roomCount || 1;

  const images = stay.images && stay.images.length > 0
    ? stay.images
    : [stay.imagePlaceholder || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-charcoal-500">
        <Link to="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/stays" className="hover:text-forest-700 transition-colors">Stays</Link>
        <span>/</span>
        <span className="text-charcoal-800 font-semibold truncate max-w-xs">{stay.name}</span>
      </div>

      {/* Hero Gallery */}
      <div className="space-y-4">
        <div className="relative h-72 sm:h-96 md:h-[460px] rounded-3xl overflow-hidden shadow-md bg-sand-200 border border-sand-200">
          <img
            src={images[0]}
            alt={stay.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800 bg-white/95 px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
              <Home className="w-3.5 h-3.5 text-forest-700" />
              {CATEGORY_LABELS[stay.category] || stay.category}
            </span>
            <div className="cursor-pointer" onClick={() => setExplainerOpen(true)}>
              <VerificationBadge status={stay.verificationStatus} />
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-sand-200">
              <MapPin className="w-4 h-4 text-clay-400 shrink-0" />
              <span>{stay.locality}, {stay.district} District, Uttarakhand</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-sm">
              {stay.name}
            </h1>
          </div>
        </div>

        {/* Thumbnail gallery if multiple images */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.slice(0, 4).map((img, idx) => (
              <div key={idx} className="h-24 rounded-xl overflow-hidden border border-sand-200 bg-sand-100">
                <img src={img} alt={`${stay.name} view ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content & Booking Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Details & Philosophy */}
        <div className="lg:col-span-7 space-y-8">
          {/* Description */}
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-charcoal-900">About this Homestay</h2>
            <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-line">
              {stay.description}
            </p>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-sand-50 border border-sand-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-charcoal-400 block tracking-wider">Capacity</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-charcoal-800">
                <Users className="w-4 h-4 text-forest-700" />
                <span>Up to {maxGuests} guests</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-charcoal-400 block tracking-wider">Guest Rooms</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-charcoal-800">
                <Home className="w-4 h-4 text-forest-700" />
                <span>{roomCount} {roomCount === 1 ? 'room' : 'rooms'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-charcoal-400 block tracking-wider">District</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-charcoal-800">
                <MapPin className="w-4 h-4 text-forest-700" />
                <span>{stay.district}</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {stay.amenities && stay.amenities.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-bold text-charcoal-900">Amenities & Home Features</h3>
              <div className="flex flex-wrap gap-2">
                {stay.amenities.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-100 text-charcoal-800 border border-sand-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Local Specialties & Village Experiences */}
          {stay.localSpecialties && stay.localSpecialties.length > 0 && (
            <div className="p-5 rounded-2xl bg-forest-50 border border-forest-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-800">
                <Sparkles className="w-4 h-4 text-clay-500" />
                <span>Village Specialties & Host Experiences</span>
              </div>
              <ul className="text-xs text-charcoal-700 space-y-2">
                {stay.localSpecialties.map((spec) => (
                  <li key={spec} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accessibility & Mountain Travel Notes */}
          {(stay.accessibilityNotes || stay.travelTip) && (
            <div className="space-y-3 pt-2">
              <h3 className="font-serif text-xl font-bold text-charcoal-900">Travel & Mountain Considerations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-charcoal-700">
                {stay.accessibilityNotes && (
                  <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
                    <span className="font-semibold text-charcoal-900 block">Terrain & Accessibility:</span>
                    <p className="leading-relaxed">{stay.accessibilityNotes}</p>
                  </div>
                )}
                {stay.travelTip && (
                  <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
                    <span className="font-semibold text-charcoal-900 block">Host Travel Advice:</span>
                    <p className="leading-relaxed">{stay.travelTip}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transparency & Research Metadata */}
          <div className="p-5 rounded-2xl bg-sand-100/70 border border-sand-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-charcoal-700">
              <FileText className="w-4 h-4 text-forest-700" />
              <span>Research Source & Platform Audit Trail</span>
            </div>
            <div className="text-xs text-charcoal-600 space-y-1.5">
              <div>
                <span className="font-medium text-charcoal-800">Source: </span>
                <span>{stay.dataSource}</span>
                {stay.sourceReference && <span className="font-mono text-[11px] ml-1">({stay.sourceReference})</span>}
              </div>
              {stay.verificationNotes && (
                <div>
                  <span className="font-medium text-charcoal-800">Auditor Notes: </span>
                  <span>{stay.verificationNotes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Reservation & Host Contact Widget */}
        <div className="lg:col-span-5 sticky top-28 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-sand-300 shadow-xl space-y-6">
            <div className="flex items-baseline justify-between border-b border-sand-200 pb-4">
              <div>
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">Standard Direct Rate</span>
                <span className="font-serif text-3xl font-bold text-forest-900">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-charcoal-500"> / night</span>
              </div>
              <span className="text-xs font-medium text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md border border-forest-200">
                Direct Host Remuneration
              </span>
            </div>

            {/* Status-specific Action Box */}
            {isVerified ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Verified Homestay · Open for Direct Booking</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800/90">
                    Host identity and registration are validated by StayLocal administrators. 100% of your nightly tariff goes directly to the family.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-semibold shadow-md"
                  onClick={() => setBookingModalOpen(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Request Homestay Booking</span>
                </Button>

                {/* Direct Host Contact if Provided */}
                {stay.contactDetails && (
                  <div className="pt-4 border-t border-sand-200 space-y-2 text-xs">
                    <span className="font-semibold text-charcoal-800 block">Host Contact Information:</span>
                    {stay.contactDetails.contactPerson && (
                      <p className="text-charcoal-600">Host: {stay.contactDetails.contactPerson}</p>
                    )}
                    <div className="flex flex-col gap-1.5 pt-1">
                      {stay.contactDetails.phone && (
                        <a
                          href={`tel:${stay.contactDetails.phone.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1.5 text-forest-700 hover:underline font-medium"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{stay.contactDetails.phone}</span>
                        </a>
                      )}
                      {stay.contactDetails.email && (
                        <a
                          href={`mailto:${stay.contactDetails.email}`}
                          className="inline-flex items-center gap-1.5 text-forest-700 hover:underline font-medium"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email Host Family</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : isPending ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Verification Underway</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900/90">
                    This listing has been submitted for administrative inspection. Direct reservations will unlock once field credentials and registration details are verified.
                  </p>
                </div>
                <Button variant="secondary" size="lg" className="w-full text-xs" disabled>
                  Booking Currently Unavailable
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-sand-100 border border-sand-200 text-xs text-charcoal-700 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-charcoal-800">
                    <Info className="w-4 h-4 text-charcoal-500" />
                    <span>Unverified Field Lead</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-charcoal-600">
                    Identified during regional field research. StayLocal has not completed operator verification. Bookings are disabled to protect travelers.
                  </p>
                </div>
                <Button variant="secondary" size="lg" className="w-full text-xs" disabled>
                  Booking Not Supported
                </Button>
              </div>
            )}

            {/* Platform Guarantee */}
            <div className="pt-4 border-t border-sand-200 flex items-center gap-3 text-xs text-charcoal-500">
              <HeartHandshake className="w-4 h-4 text-forest-700 shrink-0" />
              <span>Zero traveler commissions · Community village forest fund</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        stay={stay}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />

      {/* Verification Explainer Modal */}
      <VerificationExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  );
};
