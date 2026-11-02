import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Scissors,
  Users,
  Compass,
  Utensils,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { ExperienceRecord } from '../types';
import { apiService } from '../services/api';
import { ExperienceVerificationBadge } from '../components/ui/Badge';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/ui/Button';

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  craft_and_weaving: { label: 'Craft & Handloom', icon: Scissors },
  village_culture: { label: 'Village Heritage', icon: Users },
  nature_and_trekking: { label: 'Nature & Trails', icon: Compass },
  culinary_and_farming: { label: 'Culinary & Farming', icon: Utensils },
};

export const ExperienceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [experience, setExperience] = useState<ExperienceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExperience = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getExperienceById(id);
      setExperience(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experience details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExperience();
  }, [fetchExperience]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-sand-200 rounded" />
        <div className="h-48 bg-sand-200 rounded-3xl" />
        <div className="space-y-4">
          <div className="h-8 bg-sand-200 rounded w-1/2" />
          <div className="h-24 bg-sand-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-2xl text-center space-y-6">
        <ErrorMessage
          title="Experience Not Found"
          message={error || `We could not locate an experience matching '${id}'.`}
          onRetry={fetchExperience}
        />
        <div>
          <Link to="/experiences">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to All Experiences</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_CONFIG[experience.category] || {
    label: experience.category,
    icon: Sparkles,
  };
  const CategoryIcon = cat.icon;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-charcoal-500">
        <Link to="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/experiences" className="hover:text-forest-700 transition-colors">Experiences</Link>
        <span>/</span>
        <span className="text-charcoal-800 font-semibold truncate max-w-xs">{experience.title}</span>
      </div>

      {/* Main Experience Header */}
      <div className="p-8 rounded-3xl bg-white border border-sand-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
            <CategoryIcon className="w-3.5 h-3.5" />
            {cat.label}
          </span>
          <ExperienceVerificationBadge status={experience.verificationStatus} />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-charcoal-900">
            {experience.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-charcoal-500">
            <MapPin className="w-4 h-4 text-clay-500 shrink-0" />
            <span>{experience.locality}, {experience.district} District</span>
          </div>
        </div>

        <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-line border-t border-sand-200 pt-4">
          {experience.description}
        </p>

        {/* Experience Elements / Highlights */}
        {experience.highlights && experience.highlights.length > 0 && (
          <div className="p-5 rounded-2xl bg-sand-50 border border-sand-200 space-y-3">
            <span className="text-xs font-bold text-forest-800 uppercase tracking-wider block">
              Experience Elements & Cultural Highlights
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal-700">
              {experience.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-700 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Seasonality & Responsible Charter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-forest-50 border border-forest-100 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-forest-800">
              <Calendar className="w-4 h-4 text-forest-700" />
              <span>Recommended Season</span>
            </div>
            <p className="text-charcoal-700 leading-relaxed">{experience.seasonality}</p>
          </div>

          <div className="p-4 rounded-xl bg-sand-100/70 border border-sand-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-charcoal-800">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Responsible Travel Charter</span>
            </div>
            <p className="text-charcoal-600 leading-relaxed">
              {experience.responsibleTravelGuideline}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-sand-200 flex flex-wrap items-center justify-between gap-4">
          <Link to="/experiences">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to All Experiences</span>
            </Button>
          </Link>

          <Link to={`/stays?destination=${encodeURIComponent(experience.locality)}`}>
            <Button variant="primary" size="sm">
              <Home className="w-4 h-4 mr-1.5" />
              <span>Find Nearby Homestays in {experience.locality}</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
