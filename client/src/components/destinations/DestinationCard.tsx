import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, MapPin, MountainSnow, Sparkles } from 'lucide-react';
import { DestinationRecord } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface DestinationCardProps {
  destination: DestinationRecord;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  return (
    <Card hoverable className="flex flex-col h-full bg-white group border-sand-200">
      {/* Hero Image Container */}
      <div className="relative h-60 sm:h-64 overflow-hidden bg-sand-200">
        <img
          src={destination.heroImage}
          alt={`Landscape of ${destination.name}, ${destination.district}, Uttarakhand`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/25 to-black/20" />

        {/* Altitude pill */}
        <div className="absolute top-3.5 right-3.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-charcoal-950/80 text-sand-100 backdrop-blur-md border border-white/20 shadow-sm">
            <MountainSnow className="w-3.5 h-3.5 text-clay-400" />
            {destination.altitudeMeters.toLocaleString()} m
          </span>
        </div>

        {/* District & Division */}
        <div className="absolute bottom-3.5 left-4 right-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sand-200 mb-1">
            <MapPin className="w-3.5 h-3.5 text-clay-400" />
            <span>
              {destination.district} District · {destination.division}
            </span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            <Link to={`/destinations/${destination.id}`} className="hover:text-sand-200 transition-colors">
              {destination.name}
            </Link>
          </h3>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-3">
          <p className="text-xs font-serif italic text-clay-700">
            "{destination.tagline}"
          </p>

          <p className="text-xs text-charcoal-600 line-clamp-3 leading-relaxed">
            {destination.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {destination.characterTags.map((tag) => (
              <Badge key={tag} variant="sand" className="text-[11px] py-0.5 px-2 font-medium">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Featured Specialties */}
          <div className="pt-2.5 border-t border-sand-200">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-forest-800 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-clay-500" />
              <span>Regional Specialties</span>
            </div>
            <ul className="text-xs text-charcoal-600 space-y-1">
              {destination.featuredSpecialties.slice(0, 3).map((spec) => (
                <li key={spec} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-clay-500 shrink-0" />
                  <span className="truncate">{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-sand-200 flex items-center justify-between text-xs">
          <Link
            to={`/destinations/${destination.id}`}
            className="text-xs font-semibold text-charcoal-600 hover:text-forest-800 transition-colors"
          >
            Regional Guide
          </Link>
          <Link
            to={`/stays?destination=${encodeURIComponent(destination.name)}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900 group-hover:translate-x-0.5 transition-all"
          >
            <span>Explore Stays</span>
            <Compass className="w-3.5 h-3.5 text-forest-700" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
