import React from 'react';
import { Filter, Users, Calendar, Bed } from 'lucide-react';
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
  checkInDate?: string;
  onCheckInDateChange?: (date: string) => void;
  checkOutDate?: string;
  onCheckOutDateChange?: (date: string) => void;
  bedsRequired?: number;
  onBedsRequiredChange?: (beds: number) => void;
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
  checkInDate = '',
  onCheckInDateChange,
  checkOutDate = '',
  onCheckOutDateChange,
  bedsRequired = 1,
  onBedsRequiredChange,
}) => {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-sand-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-forest-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
            Filter Stays & Check Real-Time Availability
          </h3>
        </div>
        <span className="text-[11px] text-forest-800 font-semibold bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
          Time-Based Bed Search
        </span>
      </div>

      {/* Row 1: Location, Category, Verification, Capacity */}
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

      {/* Row 2: Precision Date-Time & Beds Required */}
      {onCheckInDateChange && onCheckOutDateChange && (
        <div className="pt-2 border-t border-sand-100 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-sand-50/50 p-3 rounded-xl border border-sand-200">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-forest-700" />
              Check-in Date
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => onCheckInDateChange(e.target.value)}
              className="w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-charcoal-800 focus:border-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-forest-700" />
              Check-out Date
            </label>
            <input
              type="date"
              min={checkInDate}
              value={checkOutDate}
              onChange={(e) => onCheckOutDateChange(e.target.value)}
              className="w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-charcoal-800 focus:border-forest-600 focus:outline-none"
            />
          </div>

          {onBedsRequiredChange && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-forest-700" />
                Beds Required
              </label>
              <select
                value={bedsRequired}
                onChange={(e) => onBedsRequiredChange(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-charcoal-800 focus:border-forest-600 focus:outline-none"
              >
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4">4 Beds</option>
                <option value="6">6+ Beds</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
