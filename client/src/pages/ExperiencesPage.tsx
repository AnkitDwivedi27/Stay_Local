import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ShieldCheck, Compass, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { ExperienceRecord, GuideExperienceRecord } from '../types';
import { apiService } from '../services/api';
import { ExperienceCard } from '../components/experiences/ExperienceCard';
import { ExperienceFilterBar } from '../components/experiences/ExperienceFilterBar';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { GuideBookingModal } from '../components/booking/GuideBookingModal';

export const ExperiencesPage: React.FC = () => {
  const [activeCatalog, setActiveCatalog] = useState<'guides' | 'heritage'>('guides');
  const [guideExperiences, setGuideExperiences] = useState<GuideExperienceRecord[]>([]);
  const [heritageExperiences, setHeritageExperiences] = useState<ExperienceRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking modal
  const [bookingExp, setBookingExp] = useState<GuideExperienceRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [guideExpData, heritageData] = await Promise.all([
        apiService.getPublicGuideExperiences({
          district: selectedDistrict,
          category: selectedCategory,
        }),
        apiService.getExperiences({
          category: selectedCategory,
          district: selectedDistrict,
        }),
      ]);

      setGuideExperiences(guideExpData);
      setHeritageExperiences(heritageData);
    } catch (err) {
      console.error('Failed to load experiences', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve experience catalog.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedDistrict]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allDistricts = ['Pithoragarh', 'Nainital', 'Bageshwar'];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-semibold tracking-wider uppercase border border-forest-200">
          <Compass className="w-3.5 h-3.5 text-forest-700" />
          <span>Local Guided Treks & Living Himalayan Traditions</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 tracking-tight">
          Explore Uttarakhand with Local Guides
        </h1>
        <p className="text-sm sm:text-base text-charcoal-600 leading-relaxed">
          Book verified local community guides for mountain treks, sacred forest walks, and artisanal craft experiences. Every guide is vetted and directly native to their mountain village.
        </p>
      </div>

      {/* Catalog Switcher */}
      <div className="flex items-center gap-3 border-b border-sand-300 pb-2">
        <button
          type="button"
          onClick={() => setActiveCatalog('guides')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeCatalog === 'guides'
              ? 'bg-forest-700 text-white shadow-sm'
              : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Bookable Guide Experiences ({guideExperiences.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCatalog('heritage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeCatalog === 'heritage'
              ? 'bg-forest-700 text-white shadow-sm'
              : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Living Heritage Archives ({heritageExperiences.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <ExperienceFilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        districts={allDistricts}
      />

      {/* Trust Notice */}
      <div className="flex items-center gap-2 text-xs text-charcoal-600 bg-sand-100/70 p-3.5 rounded-xl border border-sand-200">
        <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
        <span>
          Every guide experience is led by active, verified Uttarakhand locals. Direct payments on arrival with zero markups.
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-sand-200 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          title="Could Not Load Experiences"
          message={error}
          onRetry={loadData}
        />
      ) : activeCatalog === 'guides' ? (
        guideExperiences.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 p-8 space-y-3">
            <p className="font-serif text-lg text-charcoal-800 font-semibold">
              No bookable guide experiences found in this district.
            </p>
            <p className="text-xs text-charcoal-500">
              Try resetting filters or explore our regional heritage archive.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedDistrict('');
              }}
              className="text-xs font-semibold text-forest-700 hover:underline pt-2"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guideExperiences.map((exp) => (
              <div
                key={exp.id}
                className="editorial-card rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 bg-sand-200 relative overflow-hidden">
                    <img
                      src={
                        exp.images && exp.images.length > 0
                          ? exp.images[0]
                          : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={exp.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-forest-900 border border-sand-200/80 shadow-xs">
                      {exp.category}
                    </div>
                    <div className="absolute bottom-2.5 left-3 text-sand-100 flex items-center gap-1.5 text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5 text-clay-400 shrink-0" />
                      <span>{exp.locality}, {exp.district}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-serif text-xl font-bold text-forest-950 line-clamp-1 tracking-tight">
                      {exp.title}
                    </h3>

                    <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-charcoal-600 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-forest-700" />
                        {exp.duration}
                      </span>
                      <span className="text-sand-400">•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-forest-700" />
                        Max {exp.maxGroupSize} guests
                      </span>
                    </div>

                    <div className="pt-2.5 text-xs text-charcoal-500 border-t border-sand-200/80 flex items-center justify-between">
                      <span>Native Mountain Guide:</span>
                      <span className="font-semibold text-charcoal-900">
                        {exp.guideName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-3 flex items-center justify-between border-t border-sand-200/80 bg-sand-50/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-charcoal-400 block tracking-wider">From</span>
                    <span className="font-serif text-xl font-bold text-forest-950">
                      ₹{exp.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-charcoal-500 font-normal">
                      {' '}/ {exp.pricingType === 'per_group' ? 'group' : 'person'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBookingExp(exp)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Book Experience</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Heritage Archive */
        heritageExperiences.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 p-8 space-y-3">
            <p className="font-serif text-lg text-charcoal-800 font-semibold">
              No regional heritage records match your current filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heritageExperiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        )
      )}

      {/* Booking Modal */}
      {bookingExp && (
        <GuideBookingModal
          experience={bookingExp}
          isOpen={Boolean(bookingExp)}
          onClose={() => setBookingExp(null)}
          onSuccess={() => {
            alert('Booking request received! Check My Guide Bookings under your profile.');
          }}
        />
      )}
    </div>
  );
};
