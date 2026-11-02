import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';
import { DestinationRecord } from '../types';
import { apiService } from '../services/api';
import { DestinationCard } from '../components/destinations/DestinationCard';
import { DestinationFilterBar } from '../components/destinations/DestinationFilterBar';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export const DestinationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDistrict = searchParams.get('district') || '';

  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync URL search params
  useEffect(() => {
    if (initialDistrict !== selectedDistrict) {
      setSelectedDistrict(initialDistrict);
    }
  }, [initialDistrict, selectedDistrict]);

  const loadDestinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getDestinations({
        search: searchQuery,
        district: selectedDistrict,
      });
      setDestinations(data);
    } catch (err) {
      console.error('Failed to load destinations', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve destination catalog.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDistrict]);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    if (district) {
      setSearchParams({ district });
    } else {
      setSearchParams({});
    }
  };

  const allDistricts = ['Pithoragarh', 'Nainital', 'Bageshwar'];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-semibold tracking-wider uppercase border border-forest-200">
          <Compass className="w-3.5 h-3.5 text-forest-700" />
          <span>Regional Focus Areas</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 tracking-tight">
          Uttarakhand Researched Destinations
        </h1>
        <p className="text-sm sm:text-base text-charcoal-600 leading-relaxed">
          Explore high-altitude valleys, historic temple enclaves, and quiet birding wetlands across Kumaon. Every region listed is backed by local research notes and field verification steps.
        </p>
      </div>

      {/* Filter Bar */}
      <DestinationFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDistrict={selectedDistrict}
        onDistrictChange={handleDistrictChange}
        districts={allDistricts}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-charcoal-500 border-b border-sand-200 pb-3">
        <span>
          Showing <strong className="text-charcoal-900">{destinations.length}</strong> researched regions
          {selectedDistrict && ` in ${selectedDistrict} District`}
        </span>
        <span className="flex items-center gap-1.5 text-clay-700 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Grounded Uttarakhand Data
        </span>
      </div>

      {/* Destination Content: Loading, Error, Empty, or Data Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-sand-200 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          title="Could Not Load Destinations"
          message={error}
          onRetry={loadDestinations}
        />
      ) : destinations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 p-8 space-y-3">
          <p className="font-serif text-lg text-charcoal-800 font-semibold">
            No destinations found matching your criteria.
          </p>
          <p className="text-xs text-charcoal-500">
            Try resetting your search query or selecting "All Regions".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDistrict('');
              setSearchParams({});
            }}
            className="text-xs font-semibold text-forest-700 hover:underline pt-2"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      )}
    </div>
  );
};
