import React from 'react';
import { Filter, Users } from 'lucide-react';
import { Select } from '../ui/Select';

interface StayFilterBarProps {
  destination: string;
  onDestinationChange: (dest: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  verificationStatus: string;
  onVerificationStatusChange: (status: string) => void;
  minGuests: number;
  onMinGuestsChange: (count: number) => void;
  destinationsList: { id: string; name: string }[];
}

export const StayFilterBar: React.FC<StayFilterBarProps> = ({
  destination,
  onDestinationChange,
  category,
  onCategoryChange,
  verificationStatus,
  onVerificationStatusChange,
  minGuests,
  onMinGuestsChange,
  destinationsList,
}) => {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-sand-100">
        <Filter className="w-4 h-4 text-forest-700" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
          Filter Homestays & Leads
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Destination Filter */}
        <Select
          label="Destination / Valley"
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          options={[
            { value: '', label: 'All Destinations' },
            ...destinationsList.map((d) => ({ value: d.name, label: d.name })),
          ]}
        />

        {/* Accommodation Category Filter */}
        <Select
          label="Accommodation Type"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            { value: 'village_homestay', label: 'Village Homestay' },
            { value: 'heritage_farmstay', label: 'Heritage Farmstay' },
            { value: 'eco_lodge', label: 'Mountain Eco-Lodge' },
            { value: 'mountain_cottage', label: 'Mountain Cottage' },
          ]}
        />

        {/* Verification Status Filter */}
        <Select
          label="Verification Status"
          value={verificationStatus}
          onChange={(e) => onVerificationStatusChange(e.target.value)}
          options={[
            { value: '', label: 'All Statuses (Leads + Verified)' },
            { value: 'verified', label: 'Verified Homestays Only' },
            { value: 'verification_pending', label: 'Verification Pending' },
            { value: 'unverified_lead', label: 'Unverified Research Leads' },
          ]}
        />

        {/* Guest Capacity Filter */}
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
            Guest Capacity
          </label>
          <div className="relative">
            <select
              value={minGuests}
              onChange={(e) => onMinGuestsChange(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-charcoal-800 transition-colors focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600 font-medium"
              aria-label="Filter by guest capacity"
            >
              <option value="0">Any Group Size</option>
              <option value="2">2+ Guests</option>
              <option value="4">4+ Guests</option>
              <option value="6">6+ Guests</option>
            </select>
            <Users className="w-4 h-4 text-charcoal-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
