import React from 'react';
import { CheckCircle2, Clock, HelpCircle, ShieldCheck, X } from 'lucide-react';

interface VerificationExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerificationExplainerModal: React.FC<VerificationExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-sand-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200 bg-sand-50">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-forest-700" />
            <h3 className="font-serif text-lg font-semibold text-charcoal-900">
              StayLocal Verification Standards
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-charcoal-500 hover:text-charcoal-800 hover:bg-sand-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm text-charcoal-700 max-h-[75vh] overflow-y-auto">
          <p className="leading-relaxed">
            StayLocal is committed to <strong>authentic, grounded community tourism in Uttarakhand</strong>. We do not invent ratings, artificial reviews, or instant-booking promises. Every stay in our directory is categorized transparently:
          </p>

          <div className="space-y-4">
            {/* Verified */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold text-emerald-900">Verified Homestay</span>
              </div>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                Directly audited by the StayLocal field team or verified with Uttarakhand Tourism Development Board (UTDB) / District Tourism Development Office (DTDO) records. Host identity, clean sanitation standards, potable water, and community-led revenue retention confirmed.
              </p>
            </div>

            {/* Verification Pending */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="font-semibold text-amber-900">Verification Pending</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                Documented in regional registries (e.g. NIDHI+ national tourism portal or village cooperative records). Host telephone outreach completed; in-person or district registration cross-check actively in progress.
              </p>
            </div>

            {/* Unverified Research Lead */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2 mb-1.5">
                <HelpCircle className="w-4 h-4 text-stone-600" />
                <span className="font-semibold text-stone-900">Research Lead (Unverified)</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                Identified during our regional field research across Munsiyari, Bhimtal, Bageshwar, and Pithoragarh spreadsheets. Presence in a registry is <em>not treated as proof of active registration</em>. Not available for direct booking.
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs text-charcoal-500 border-t border-sand-200">
            Are you a registered homestay owner or village sarpanch in Uttarakhand? Contact us at{' '}
            <span className="font-mono text-forest-700 font-medium">verify@staylocal.org.in</span> to initiate free verification.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 bg-sand-50 border-t border-sand-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-forest-800 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
