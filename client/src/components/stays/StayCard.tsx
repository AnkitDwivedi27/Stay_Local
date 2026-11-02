import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Phone,
  Mail,
  Home,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { AccommodationRecord } from '../../types';
import { Card } from '../ui/Card';
import { VerificationBadge } from '../ui/Badge';

interface StayCardProps {
  stay: AccommodationRecord;
  onOpenExplainer?: () => void;
  onBookStay?: (stay: AccommodationRecord) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  village_homestay: 'Village Homestay',
  heritage_farmstay: 'Heritage Farmstay',
  eco_lodge: 'Mountain Eco-Lodge',
  mountain_cottage: 'Mountain Cottage',
  bed_and_breakfast: 'Local Bed & Breakfast',
};

export const StayCard: React.FC<StayCardProps> = ({ stay, onOpenExplainer, onBookStay }) => {
  const [showDetails, setShowDetails] = useState(false);

  const isVerified = stay.verificationStatus === 'verified';
  const isPending = stay.verificationStatus === 'verification_pending';

  const coverImage =
    stay.images && stay.images.length > 0
      ? stay.images[0]
      : stay.imagePlaceholder ||
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80';

  return (
    <Card hoverable className="flex flex-col h-full bg-white group border-sand-200">
      {/* Cover Image Header */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-sand-200">
        <img
          src={coverImage}
          alt={`Exterior of ${stay.name} in ${stay.locality}, Uttarakhand`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/75 via-charcoal-950/20 to-black/20" />

        {/* Floating Category & Verification Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-forest-900 bg-white/95 px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
            <Home className="w-3 h-3 text-forest-700" />
            {CATEGORY_LABELS[stay.category] || stay.category}
          </span>
          <div className="cursor-pointer" onClick={onOpenExplainer}>
            <VerificationBadge status={stay.verificationStatus} className="shadow-sm backdrop-blur-sm" />
          </div>
        </div>

        {/* Bottom Location Indicator */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
          <div className="flex items-center gap-1 text-xs text-sand-200 font-medium">
            <MapPin className="w-3.5 h-3.5 text-clay-400 shrink-0" />
            <span className="truncate">{stay.locality}, {stay.district} District</span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-bold text-charcoal-900 tracking-tight leading-snug">
            <Link to={`/stays/${stay.id}`} className="hover:text-forest-700 transition-colors">
              {stay.name}
            </Link>
          </h3>

          <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
            {stay.description}
          </p>
        </div>

        {/* Local Specialties & Experiences */}
        {stay.localSpecialties && stay.localSpecialties.length > 0 && (
          <div className="bg-sand-50/80 p-3 rounded-xl border border-sand-200/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-forest-800 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-clay-500" />
              <span>Village Specialties & Host Experiences</span>
            </div>
            <ul className="text-xs text-charcoal-700 space-y-1">
              {stay.localSpecialties.slice(0, 2).map((spec) => (
                <li key={spec} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 mt-1 shrink-0" />
                  <span className="truncate">{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Capacity & Honest Status Notice */}
        <div className="space-y-2.5 pt-2 border-t border-sand-200">
          {stay.guestCapacity && (
            <div className="flex items-center gap-2 text-xs text-charcoal-600">
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-forest-700" />
                Up to {stay.guestCapacity.maxGuests || 4} guests
              </span>
              {stay.guestCapacity.roomCount && (
                <span className="text-charcoal-400">· {stay.guestCapacity.roomCount} guest rooms</span>
              )}
            </div>
          )}

          {/* Pricing & Booking Ethics notice */}
          {isVerified ? (
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800">
              <span className="font-semibold block mb-0.5">Verified Direct Host Contact:</span>
              <div className="space-y-1 text-emerald-900 font-sans">
                {stay.contactDetails?.contactPerson && (
                  <p className="text-xs font-medium">Host: {stay.contactDetails.contactPerson}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  {stay.contactDetails?.phone && (
                    <a
                      href={`tel:${stay.contactDetails.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1 font-medium hover:underline text-xs"
                    >
                      <Phone className="w-3 h-3" /> {stay.contactDetails.phone}
                    </a>
                  )}
                  {stay.contactDetails?.email && (
                    <a
                      href={`mailto:${stay.contactDetails.email}`}
                      className="inline-flex items-center gap-1 font-medium hover:underline text-xs"
                    >
                      <Mail className="w-3 h-3" /> Email Host
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : isPending ? (
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Listing Verification in Progress:</span>
                <p className="text-[11px] text-amber-900/90 mt-0.5 leading-snug">
                  Telephone outreach initiated. Rates and direct reservation will be unlocked once registration is cross-checked with the district tourism office.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-stone-100/80 border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Unverified Research Lead:</span>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                  Identified in public listings. Not verified by StayLocal and not currently open for bookings.
                </p>
              </div>
            </div>
          )}

          {/* Nightly Rate & Booking Action */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-charcoal-500 uppercase font-semibold tracking-wider block">Direct Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-lg font-bold text-forest-900">
                  ₹{(stay.pricePerNight || 1800).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-charcoal-500">/ night</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/stays/${stay.id}`}
                className="px-3 py-2 rounded-xl border border-sand-300 hover:border-forest-600 bg-sand-50/60 hover:bg-sand-100 text-charcoal-700 text-xs font-semibold transition-colors"
              >
                Details
              </Link>
              {isVerified ? (
                <button
                  type="button"
                  onClick={() => onBookStay && onBookStay(stay)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <span>Request Booking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Only verified homestays can accept direct bookings"
                  className="px-3 py-2 rounded-xl bg-sand-200 text-charcoal-500 text-xs font-medium cursor-not-allowed opacity-75"
                >
                  Booking Unavailable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Transparency Metadata */}
        <div className="pt-2 border-t border-sand-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] font-medium text-charcoal-500 hover:text-forest-800 transition-colors py-1"
          >
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {showDetails ? 'Hide Research & Verification Audit' : 'View Research Source & Audit Status'}
            </span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2.5 p-3 rounded-xl bg-sand-100/70 border border-sand-200 text-[11px] text-charcoal-600 space-y-2">
              <div>
                <span className="font-semibold text-charcoal-700 block">Data Source:</span>
                <span>{stay.dataSource}</span>
              </div>
              {stay.sourceReference && (
                <div>
                  <span className="font-semibold text-charcoal-700 block">Research Reference:</span>
                  <span className="font-mono text-[10px] text-charcoal-500">{stay.sourceReference}</span>
                </div>
              )}
              {stay.verificationNotes && (
                <div>
                  <span className="font-semibold text-charcoal-700 block">Auditor Notes:</span>
                  <span>{stay.verificationNotes}</span>
                </div>
              )}
              {stay.nextVerificationStep && (
                <div>
                  <span className="font-semibold text-charcoal-700 block">Next Action:</span>
                  <span className="text-clay-700 font-medium">{stay.nextVerificationStep}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
