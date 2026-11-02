import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Languages,
  Award,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { BookingRecord, GuideProfileRecord, GuideExperienceRecord } from '../../types';
import { apiService } from '../../services/api';
import { GuideBookingModal } from './GuideBookingModal';

interface DestinationGuidesSectionProps {
  booking: BookingRecord;
  allUserStays?: BookingRecord[];
  onBookingCreated?: () => void;
}

export const DestinationGuidesSection: React.FC<DestinationGuidesSectionProps> = ({
  booking,
  allUserStays = [],
  onBookingCreated,
}) => {
  const [guides, setGuides] = useState<GuideProfileRecord[]>([]);
  const [experiences, setExperiences] = useState<GuideExperienceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<GuideExperienceRecord | null>(null);
  const [selectedGuideForBio, setSelectedGuideForBio] = useState<GuideProfileRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchGuides = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getGuidesForDestination({
          district: booking.stayDistrict,
          locality: booking.stayLocality,
          bookingId: booking.id,
        });

        if (isMounted) {
          setGuides(data.guides || []);
          setExperiences(data.experiences || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load destination guides.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGuides();
    return () => {
      isMounted = false;
    };
  }, [booking.stayDistrict, booking.stayLocality, booking.id]);

  if (loading) {
    return (
      <div className="mt-4 p-5 rounded-2xl bg-forest-50/50 border border-forest-100 animate-pulse space-y-3">
        <div className="h-4 bg-forest-200/60 rounded w-1/3" />
        <div className="h-24 bg-forest-200/40 rounded-xl" />
      </div>
    );
  }

  if (error || guides.length === 0) {
    return null; // Gracefully omit if no guides registered for this location yet
  }

  return (
    <div className="mt-5 pt-5 border-t border-sand-200 space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Compass className="w-3 h-3 text-emerald-700" />
            <span>Explore Guides at Your Destination</span>
          </div>
          <h4 className="font-serif text-lg font-bold text-forest-950">
            Verified Mountain Guides in {booking.stayLocality}, {booking.stayDistrict}
          </h4>
          <p className="text-xs text-charcoal-600">
            Hand-picked local experts to lead treks, village walks, and cultural heritage during your stay.
          </p>
        </div>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((guide) => {
          const guideExperiences = experiences.filter((e) => e.guideId === guide.userId);

          return (
            <div
              key={guide.id}
              className="bg-white rounded-xl p-4 border border-sand-300 shadow-sm hover:border-forest-600 transition-colors space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Guide Bio Bar */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold text-base overflow-hidden shrink-0 shadow-inner">
                    {guide.avatarUrl ? (
                      <img
                        src={guide.avatarUrl}
                        alt={guide.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      guide.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="font-serif text-base font-bold text-forest-950 truncate">
                        {guide.fullName}
                      </h5>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        Verified Guide
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-charcoal-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-clay-500 shrink-0" />
                      <span className="truncate">
                        {guide.serviceLocations.map((l) => l.locality).join(', ')} •{' '}
                        {guide.experienceYears}y experience
                      </span>
                    </div>

                    {guide.languages && guide.languages.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-charcoal-600 mt-0.5">
                        <Languages className="w-3 h-3 text-forest-600 shrink-0" />
                        <span>{guide.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialties tags */}
                {guide.specialties && guide.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {guide.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sand-100 text-charcoal-700 border border-sand-200"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Short Bio */}
                {guide.bio && (
                  <p className="text-xs text-charcoal-600 line-clamp-2 italic">
                    "{guide.bio}"
                  </p>
                )}

                {/* Guide's Experiences */}
                {guideExperiences.length > 0 ? (
                  <div className="space-y-2 pt-1 border-t border-sand-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
                      Bookable Experiences:
                    </span>
                    <div className="space-y-1.5">
                      {guideExperiences.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-sand-50/70 border border-sand-200 text-xs hover:bg-forest-50/60 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-charcoal-900 block truncate">
                              {exp.title}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-charcoal-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-forest-600" />
                                {exp.duration}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-semibold text-forest-800">
                                ₹{exp.price.toLocaleString()} {exp.pricingType === 'per_group' ? 'group' : 'p/p'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedExperience(exp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-[11px] font-semibold transition-colors shrink-0 shadow-sm"
                          >
                            <span>Book</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-charcoal-400 italic">
                    No custom packages listed. Contact through StayLocal helpdesk for custom trekking itineraries.
                  </p>
                )}
              </div>

              {/* View Profile Action */}
              <div className="pt-2 border-t border-sand-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedGuideForBio(guide)}
                  className="text-forest-700 hover:text-forest-900 font-semibold underline text-[11px]"
                >
                  View Guide Qualifications
                </button>
                <span className="text-[11px] text-charcoal-400">
                  Linked to {booking.bookingReference}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide Profile & Credentials Quick Modal */}
      {selectedGuideForBio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-sand-300 space-y-4">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-forest-700" />
                <h4 className="font-serif text-lg font-bold text-forest-950">
                  {selectedGuideForBio.fullName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedGuideForBio(null)}
                className="text-charcoal-400 hover:text-charcoal-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-xs text-charcoal-700">
              <div>
                <span className="font-bold block text-charcoal-900 mb-0.5">Experience & Background:</span>
                <p className="text-charcoal-600 leading-relaxed">{selectedGuideForBio.bio || 'Verified mountain guide.'}</p>
              </div>
              <div>
                <span className="font-bold block text-charcoal-900 mb-0.5">Qualifications & Evidence:</span>
                <p className="text-charcoal-600 leading-relaxed">{selectedGuideForBio.qualifications || 'Verified community guide certification on file.'}</p>
              </div>
              <div>
                <span className="font-bold block text-charcoal-900 mb-0.5">Languages Spoken:</span>
                <p className="text-charcoal-600">{selectedGuideForBio.languages.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedExperience && (
        <GuideBookingModal
          experience={selectedExperience}
          isOpen={Boolean(selectedExperience)}
          onClose={() => setSelectedExperience(null)}
          onSuccess={() => {
            if (onBookingCreated) onBookingCreated();
          }}
          linkedHomestayBooking={booking}
          allUserStays={allUserStays}
        />
      )}
    </div>
  );
};
