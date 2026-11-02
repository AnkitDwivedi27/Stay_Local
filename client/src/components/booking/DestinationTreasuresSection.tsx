import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Tag,
  BookOpen,
  Navigation,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { BookingRecord, LocalTreasureRecord, TreasureCategory } from '../../types';
import { apiService } from '../../services/api';
import { TreasureDetailModal } from './TreasureDetailModal';
import { VisitArtisanModal } from './VisitArtisanModal';

interface DestinationTreasuresSectionProps {
  booking: BookingRecord;
}

const CATEGORY_TABS: Array<{ id: TreasureCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Treasures' },
  { id: 'woollens_textiles', label: 'Woollens & Weaving' },
  { id: 'traditional_art', label: 'Folk & Sacred Art' },
  { id: 'handicrafts_carvings', label: 'Carvings & Crafts' },
  { id: 'local_food_produce', label: 'Mountain Produce' },
  { id: 'cultural_heritage', label: 'Heritage Living' },
];

export const DestinationTreasuresSection: React.FC<DestinationTreasuresSectionProps> = ({
  booking,
}) => {
  const [treasures, setTreasures] = useState<LocalTreasureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TreasureCategory | 'all'>('all');
  const [storyModalTreasure, setStoryModalTreasure] = useState<LocalTreasureRecord | null>(null);
  const [visitModalTreasure, setVisitModalTreasure] = useState<LocalTreasureRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTreasures = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getTreasuresForDestination({
          district: booking.stayDistrict,
          locality: booking.stayLocality,
          bookingId: booking.id,
        });

        if (isMounted) {
          setTreasures(data.treasures || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to discover local treasures.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTreasures();
    return () => {
      isMounted = false;
    };
  }, [booking.stayDistrict, booking.stayLocality, booking.id]);

  if (loading) {
    return (
      <div className="mt-5 p-5 rounded-2xl bg-amber-50/40 border border-amber-100 animate-pulse space-y-3">
        <div className="h-4 bg-amber-200/60 rounded w-1/3" />
        <div className="h-28 bg-amber-200/30 rounded-xl" />
      </div>
    );
  }

  if (error || treasures.length === 0) {
    return null; // Gracefully omit if no treasures found for this location yet
  }

  const filteredTreasures =
    selectedCategory === 'all'
      ? treasures
      : treasures.filter((t) => t.category === selectedCategory);

  return (
    <div className="mt-6 pt-6 border-t border-sand-200 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>Discover Local Treasures</span>
          </div>
          <h4 className="font-serif text-lg font-bold text-forest-950">
            Authentic Local Crafts & Artisans in {booking.stayLocality}, {booking.stayDistrict}
          </h4>
          <p className="text-xs text-charcoal-600">
            Handcrafted woollens, sacred folk art, and organic mountain produce directly from village masters near your homestay.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Filter:
        </span>
        {CATEGORY_TABS.map((tab) => {
          const count =
            tab.id === 'all'
              ? treasures.length
              : treasures.filter((t) => t.category === tab.id).length;

          if (count === 0 && tab.id !== 'all') return null;

          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200 border border-sand-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-amber-900/40 text-amber-100' : 'bg-sand-200 text-charcoal-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Treasures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTreasures.map((treasure) => {
          const primaryImage =
            treasure.images?.[0] ||
            'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80';

          return (
            <div
              key={treasure.id}
              className="group bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card Image Banner */}
              <div className="relative h-44 w-full bg-sand-200 overflow-hidden">
                <img
                  src={primaryImage}
                  alt={treasure.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 text-forest-900 backdrop-blur-sm shadow-sm">
                    <Tag className="w-2.5 h-2.5 text-forest-700" />
                    <span className="capitalize">{treasure.craftName}</span>
                  </span>

                  {treasure.verificationStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white shadow-sm">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <div className="text-xs text-sand-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                    <span className="truncate">
                      {treasure.village ? `${treasure.village}, ` : ''}
                      {treasure.locality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                    {treasure.artisanOrShopName}
                  </div>
                  <h5 className="font-serif text-base font-bold text-charcoal-900 line-clamp-1">
                    {treasure.title}
                  </h5>
                  <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
                    {treasure.description}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-sand-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStoryModalTreasure(treasure)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sand-300 text-charcoal-700 hover:bg-sand-100 text-xs font-semibold transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-forest-700" />
                    <span>Story & Process</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitModalTreasure(treasure)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Visit Artisan</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Story & Production Process Modal */}
      {storyModalTreasure && (
        <TreasureDetailModal
          treasure={storyModalTreasure}
          onClose={() => setStoryModalTreasure(null)}
          onOpenVisitModal={(t) => setVisitModalTreasure(t)}
        />
      )}

      {/* Offline Visit Guide Modal */}
      {visitModalTreasure && (
        <VisitArtisanModal
          treasure={visitModalTreasure}
          onClose={() => setVisitModalTreasure(null)}
        />
      )}
    </div>
  );
};
