import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  MountainSnow,
  Calendar,
  Sparkles,
  ArrowLeft,
  Compass,
  Home,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { DestinationRecord } from '../types';
import { apiService } from '../services/api';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const DestinationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [destination, setDestination] = useState<DestinationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDestination = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDestinationById(id);
      setDestination(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load destination details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDestination();
  }, [fetchDestination]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-sand-200 rounded" />
        <div className="h-96 bg-sand-200 rounded-3xl" />
        <div className="space-y-4">
          <div className="h-8 bg-sand-200 rounded w-1/2" />
          <div className="h-24 bg-sand-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-2xl text-center space-y-6">
        <ErrorMessage
          title="Destination Not Found"
          message={error || `We could not find a destination matching '${id}'.`}
          onRetry={fetchDestination}
        />
        <div>
          <Link to="/destinations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to All Destinations</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-charcoal-500">
        <Link to="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/destinations" className="hover:text-forest-700 transition-colors">Destinations</Link>
        <span>/</span>
        <span className="text-charcoal-800 font-semibold">{destination.name}</span>
      </div>

      {/* Hero Banner */}
      <div className="relative h-80 sm:h-96 md:h-[460px] rounded-3xl overflow-hidden shadow-lg bg-sand-200 border border-sand-200">
        <img
          src={destination.heroImage}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/90 via-charcoal-900/40 to-transparent" />

        {/* Altitude Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-charcoal-900/80 text-sand-100 backdrop-blur-md border border-white/20">
            <MountainSnow className="w-4 h-4 text-clay-400" />
            <span>{destination.altitudeMeters.toLocaleString()} m</span>
          </span>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-sand-200">
            <MapPin className="w-4 h-4 text-clay-400 shrink-0" />
            <span>{destination.district} District · {destination.division} Division, Uttarakhand</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
            {destination.name}
          </h1>
          <p className="text-sm sm:text-base text-clay-300 italic font-medium">
            "{destination.tagline}"
          </p>
        </div>
      </div>

      {/* Overview & Key Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Descriptive Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-charcoal-900">Regional Overview</h2>
            <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-line">
              {destination.description}
            </p>
          </div>

          {/* Character Tags */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-charcoal-900">Regional Character & Landscape</h3>
            <div className="flex flex-wrap gap-2">
              {destination.characterTags.map((tag) => (
                <Badge key={tag} variant="sand" className="text-xs px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Featured Regional Specialties */}
          <div className="p-6 rounded-2xl bg-forest-50 border border-forest-100 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-800">
              <Sparkles className="w-4 h-4 text-clay-500" />
              <span>Indigenous Crops, Heritage & Local Specialties</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-charcoal-800">
              {destination.featuredSpecialties.map((spec) => (
                <li key={spec} className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-forest-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-clay-500 shrink-0" />
                  <span className="font-medium">{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Best Time & Responsible Mountain Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-charcoal-700">
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
              <div className="flex items-center gap-1.5 text-forest-800 font-semibold">
                <Calendar className="w-4 h-4 text-forest-700" />
                <span>Optimal Travel Seasons</span>
              </div>
              <p className="leading-relaxed">{destination.bestTimeToVisit}</p>
            </div>
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
              <div className="flex items-center gap-1.5 text-forest-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-forest-700" />
                <span>Responsible Travel Protocol</span>
              </div>
              <p className="leading-relaxed">
                Respect village sacred groves (Van Panchayats), prioritize homestay stays, avoid single-use plastics, and carry all non-biodegradable waste down the mountain.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Discovery Action Cards */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-forest-900 text-sand-100 border border-forest-800 shadow-xl space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold text-white">
                Explore Village Stays
              </h3>
              <p className="text-xs text-sand-300 leading-relaxed">
                Browse verified homestays and regional accommodation leads located in and around {destination.name}.
              </p>
            </div>

            <Link
              to={`/stays?destination=${encodeURIComponent(destination.name)}`}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Browse Homestays in {destination.name}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>

            <Link
              to={`/experiences?district=${encodeURIComponent(destination.district)}`}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-200 text-xs font-medium border border-forest-700 transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Crafts & Trails in {destination.district}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>

          <div>
            <Link to="/destinations">
              <Button variant="outline" size="sm" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>View All Uttarakhand Regions</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
