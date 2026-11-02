import React from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Navigation,
  Clock,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { LocalTreasureRecord } from '../../types';

interface VisitArtisanModalProps {
  treasure: LocalTreasureRecord;
  onClose: () => void;
}

export const VisitArtisanModal: React.FC<VisitArtisanModalProps> = ({
  treasure,
  onClose,
}) => {
  const mapUrl = treasure.locationLink || (
    treasure.coordinates
      ? `https://www.google.com/maps/search/?api=1&query=${treasure.coordinates.latitude},${treasure.coordinates.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${treasure.artisanOrShopName}, ${treasure.village ? treasure.village + ', ' : ''}${treasure.locality}, ${treasure.district}, Uttarakhand`
        )}`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-sand-300 overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-300" />
            <span>Discover Local Treasures · Offline Visit Guide</span>
          </div>

          <h3 className="font-serif text-2xl font-bold text-sand-50">
            {treasure.artisanOrShopName}
          </h3>
          <p className="text-xs text-sand-200 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>
              {treasure.village ? `${treasure.village}, ` : ''}
              {treasure.locality}, {treasure.district}
            </span>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Offline Discovery Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
              <ShoppingBag className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Offline-First Community Purchase</span>
            </div>
            <p className="text-xs text-amber-950/80 leading-relaxed">
              StayLocal connects you directly with village craftspeople without middlemen or online cart markups. Visit the workshop in person to meet the artisans, witness the craft being made, and purchase authentic pieces directly.
            </p>
          </div>

          {/* Location & Directions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-forest-700" />
              <span>Village & Workshop Location</span>
            </h4>
            <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200 space-y-2">
              <div className="text-sm font-semibold text-charcoal-900">
                {treasure.address || `${treasure.artisanOrShopName}, ${treasure.village || treasure.locality}, ${treasure.district}`}
              </div>
              <div className="text-xs text-charcoal-600">
                District: <span className="font-medium text-charcoal-800">{treasure.district}</span> · Locality: <span className="font-medium text-charcoal-800">{treasure.locality}</span>
                {treasure.village && (
                  <> · Village: <span className="font-medium text-charcoal-800">{treasure.village}</span></>
                )}
              </div>

              {treasure.nearbyClusters.length > 0 && (
                <div className="pt-1 text-[11px] text-charcoal-500">
                  <span className="font-semibold text-charcoal-700">Nearby Craft Clusters: </span>
                  {treasure.nearbyClusters.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Visiting Guidelines & Hours */}
          {treasure.visitingInfo && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-forest-700" />
                <span>Visiting Hours & Experience</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-950/90 leading-relaxed">
                {treasure.visitingInfo}
              </div>
            </div>
          )}

          {/* Responsible Craft Etiquette */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Visiting Etiquette</span>
            </h4>
            <ul className="text-xs text-charcoal-600 space-y-1.5 pl-4 list-disc marker:text-forest-600">
              <li>Always seek permission before photographing or recording weavers at their looms.</li>
              <li>Respect traditional workshop spaces and the hours required to produce handwoven or hand-carved goods.</li>
              <li>Carry cash or UPI: Most rural artisans accept UPI (Google Pay, PhonePe) or direct cash payments.</li>
            </ul>
          </div>

          {/* Contact (if publicly verified) */}
          {treasure.contact && treasure.contact.isPubliclyVerified && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-forest-700" />
                <span>Verified Workshop Contact</span>
              </h4>
              <div className="p-3 rounded-2xl bg-sand-50 border border-sand-200 text-xs flex flex-wrap gap-4 text-charcoal-800">
                {treasure.contact.contactPerson && (
                  <div>
                    <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Contact Person</span>
                    <span className="font-medium">{treasure.contact.contactPerson}</span>
                  </div>
                )}
                {treasure.contact.phone && (
                  <div>
                    <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Phone</span>
                    <a href={`tel:${treasure.contact.phone}`} className="font-semibold text-forest-800 hover:underline">
                      {treasure.contact.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation Action */}
        <div className="p-4 sm:p-6 bg-sand-50 border-t border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-sand-300 text-charcoal-700 hover:bg-sand-100 font-semibold text-xs transition-colors"
          >
            Close Guide
          </button>

          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs shadow-md transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
