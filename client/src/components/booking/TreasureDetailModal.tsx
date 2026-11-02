import React from 'react';
import {
  X,
  MapPin,
  Sparkles,
  BookOpen,
  Hammer,
  Navigation,
  Clock,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { LocalTreasureRecord, TreasureCategory } from '../../types';

interface TreasureDetailModalProps {
  treasure: LocalTreasureRecord;
  onClose: () => void;
  onOpenVisitModal: (treasure: LocalTreasureRecord) => void;
}

const CATEGORY_LABELS: Record<TreasureCategory, string> = {
  woollens_textiles: 'Woollens & Handloom Textiles',
  traditional_art: 'Traditional Himalayan Folk Art',
  handicrafts_carvings: 'Handicrafts & Carvings',
  local_food_produce: 'Indigenous Mountain Food & Produce',
  cultural_heritage: 'Living Cultural Heritage',
};

export const TreasureDetailModal: React.FC<TreasureDetailModalProps> = ({
  treasure,
  onClose,
  onOpenVisitModal,
}) => {
  const categoryLabel = CATEGORY_LABELS[treasure.category] || treasure.category;
  const primaryImage =
    treasure.images?.[0] ||
    'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-sand-300 overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Hero Image & Header */}
        <div className="relative h-64 sm:h-72 w-full bg-forest-950 overflow-hidden">
          <img
            src={primaryImage}
            alt={treasure.title}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Content */}
          <div className="absolute bottom-5 left-5 right-5 space-y-1.5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/90 text-white shadow-sm">
                <Tag className="w-3 h-3" />
                {categoryLabel}
              </span>

              {treasure.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-md text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Local Master
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm">
              {treasure.title}
            </h2>

            <div className="flex items-center gap-2 text-xs text-sand-200">
              <span className="font-medium text-sand-100">{treasure.artisanOrShopName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {treasure.village ? `${treasure.village}, ` : ''}{treasure.locality}, {treasure.district}
              </span>
            </div>
          </div>
        </div>

        {/* Story & Process Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Origin Story & Cultural Significance */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-forest-900 font-bold text-sm tracking-wide">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Origin Story & Cultural Significance</span>
            </div>
            <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100/80 text-xs sm:text-sm text-forest-950/90 leading-relaxed font-serif italic">
              "{treasure.culturalSignificance}"
            </div>
          </section>

          {/* Traditional Production Process */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-forest-900 font-bold text-sm tracking-wide">
              <Hammer className="w-4 h-4 text-forest-700" />
              <span>Traditional Production Process</span>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed">
              {treasure.productionProcess}
            </p>
          </section>

          {/* About the Artisan / Workshop */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-forest-900 font-bold text-sm tracking-wide">
              <BookOpen className="w-4 h-4 text-forest-700" />
              <span>About the Artisan & Community</span>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed">
              {treasure.description}
            </p>
          </section>

          {/* Visiting Guidelines */}
          {treasure.visitingInfo && (
            <section className="p-4 rounded-2xl bg-sand-50 border border-sand-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-charcoal-700">
                <Clock className="w-3.5 h-3.5 text-forest-700" />
                <span>Visiting Experience</span>
              </div>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                {treasure.visitingInfo}
              </p>
            </section>
          )}

          {/* Additional Photos if available */}
          {treasure.images && treasure.images.length > 1 && (
            <section className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Workshop & Craft Gallery
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {treasure.images.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${treasure.craftName} showcase ${idx + 1}`}
                    className="w-full h-24 sm:h-28 object-cover rounded-xl border border-sand-200 shadow-sm"
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-sand-50 border-t border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-sand-300 text-charcoal-700 hover:bg-sand-100 font-semibold text-xs transition-colors"
          >
            Back to Bookings
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVisitModal(treasure);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs shadow-md transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Visit Artisan / Explore Shop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
