import React from 'react';
import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';
import { VerificationStatus, ExperienceVerificationStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'forest' | 'clay' | 'mountain' | 'outline' | 'sand';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-sand-200 text-charcoal-700 border-sand-300',
    forest: 'bg-forest-50 text-forest-800 border-forest-200',
    clay: 'bg-clay-50 text-clay-700 border-clay-200',
    mountain: 'bg-mountain-50 text-mountain-800 border-mountain-200',
    sand: 'bg-sand-100 text-charcoal-700 border-sand-300',
    outline: 'bg-transparent text-charcoal-700 border-sand-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

interface VerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
  showIcon?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  switch (status) {
    case 'verified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
          title="Independently verified by StayLocal: valid license cross-checked with district tourism office, host identity and sanitation confirmed."
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          Verified Homestay
        </span>
      );
    case 'verification_pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
          title="Verification Pending: Host listed in official directory; field verification and registration check in progress."
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
          Verification Pending
        </span>
      );
    case 'unverified_lead':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-300 ${className}`}
          title="Unverified Research Lead: Discovered in regional directories. Not verified and not direct-bookable."
        >
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-stone-500" />}
          Research Lead (Unverified)
        </span>
      );
    case 'rejected_or_inactive':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-red-500" />}
          Inactive / Closed
        </span>
      );
  }
};

interface ExperienceVerificationBadgeProps {
  status: ExperienceVerificationStatus;
  className?: string;
}

export const ExperienceVerificationBadge: React.FC<ExperienceVerificationBadgeProps> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'grounded_regional_heritage':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest-50 text-forest-800 border border-forest-200 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-forest-600" />
          Documented Regional Heritage
        </span>
      );
    case 'verified_host_experience':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Verified Community Experience
        </span>
      );
    case 'lead_under_verification':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-600" />
          Craft Lead Under Verification
        </span>
      );
  }
};
