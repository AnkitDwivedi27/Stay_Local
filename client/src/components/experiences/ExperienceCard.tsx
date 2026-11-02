import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Scissors,
  Users,
  Compass,
  Utensils,
  ArrowRight,
} from 'lucide-react';
import { ExperienceRecord } from '../../types';
import { Card } from '../ui/Card';
import { ExperienceVerificationBadge } from '../ui/Badge';

interface ExperienceCardProps {
  experience: ExperienceRecord;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; image: string }
> = {
  craft_and_weaving: {
    label: 'Craft & Handloom',
    icon: Scissors,
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
  },
  village_culture: {
    label: 'Village Heritage',
    icon: Users,
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
  },
  nature_and_trekking: {
    label: 'Nature & Trails',
    icon: Compass,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  },
  culinary_and_farming: {
    label: 'Culinary & Farming',
    icon: Utensils,
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
  },
};

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience }) => {
  const [showResearchInfo, setShowResearchInfo] = useState(false);
  const cat = CATEGORY_CONFIG[experience.category] || {
    label: experience.category,
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
  };
  const CategoryIcon = cat.icon;

  return (
    <Card hoverable className="flex flex-col h-full bg-white group border-sand-200">
      {/* Visual Header */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-sand-200">
        <img
          src={cat.image}
          alt={experience.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/75 via-charcoal-950/20 to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-forest-900 bg-white/95 px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
            <CategoryIcon className="w-3 h-3 text-forest-700" />
            {cat.label}
          </span>
          <ExperienceVerificationBadge status={experience.verificationStatus} className="shadow-sm backdrop-blur-sm" />
        </div>

        {/* Bottom Locality */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
          <div className="flex items-center gap-1 text-xs text-sand-200 font-medium">
            <MapPin className="w-3.5 h-3.5 text-clay-400 shrink-0" />
            <span className="truncate">{experience.locality}</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <h3 className="font-serif text-xl font-bold text-charcoal-900 tracking-tight leading-snug">
            <Link to={`/experiences/${experience.id}`} className="hover:text-forest-700 transition-colors">
              {experience.title}
            </Link>
          </h3>

          <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
            {experience.description}
          </p>
        </div>

        {/* Highlights */}
        <div className="bg-sand-50/80 p-3.5 rounded-xl border border-sand-200/80 space-y-2">
          <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider block">
            Experience Elements
          </span>
          <ul className="text-xs text-charcoal-700 space-y-1.5">
            {experience.highlights.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-clay-500 mt-1 shrink-0" />
                <span className="truncate">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Seasonality & Responsible Travel Rule */}
        <div className="space-y-2.5 text-xs pt-2 border-t border-sand-200">
          <div className="flex items-center gap-2 text-charcoal-600">
            <Calendar className="w-3.5 h-3.5 text-forest-700 shrink-0" />
            <span className="font-semibold text-charcoal-700">Recommended Season:</span>
            <span>{experience.seasonality}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-sand-100/60 border border-sand-200 text-[11px] text-charcoal-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-charcoal-800">Responsible Travel Charter:</span>
              <p className="mt-0.5 text-charcoal-600 leading-snug line-clamp-2">
                {experience.responsibleTravelGuideline}
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <Link
              to={`/experiences/${experience.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-900 group-hover:translate-x-0.5 transition-all"
            >
              <span>View Experience Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Research source drawer */}
        <div className="pt-2 border-t border-sand-100">
          <button
            onClick={() => setShowResearchInfo(!showResearchInfo)}
            className="flex items-center justify-between w-full text-[11px] font-medium text-charcoal-500 hover:text-forest-800 transition-colors py-1"
          >
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              {showResearchInfo ? 'Hide Grounded Research Context' : 'View Grounded Research Source'}
            </span>
            {showResearchInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showResearchInfo && (
            <div className="mt-2.5 p-3 rounded-xl bg-sand-100/70 border border-sand-200 text-[11px] text-charcoal-600 space-y-1.5">
              <div>
                <span className="font-semibold text-charcoal-700 block">Research & Evidence Source:</span>
                <span>{experience.evidenceSource}</span>
              </div>
              {experience.potentialStakeholders && (
                <div>
                  <span className="font-semibold text-charcoal-700 block">Identified Community Stakeholders:</span>
                  <span>{experience.potentialStakeholders}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
