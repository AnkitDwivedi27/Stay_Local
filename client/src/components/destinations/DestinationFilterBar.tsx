import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';

interface DestinationFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  districts: string[];
}

export const DestinationFilterBar: React.FC<DestinationFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedDistrict,
  onDistrictChange,
  districts,
}) => {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-sand-200 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search Input */}
        <div className="md:col-span-2">
          <Input
            placeholder="Search by destination name, valley, craft, or landmark..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* District Filter */}
        <div>
          <select
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full rounded-lg border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-charcoal-800 transition-colors focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
            aria-label="Filter by district"
          >
            <option value="">All Uttarakhand Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d} District
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick district buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sand-100 text-xs text-charcoal-500">
        <span className="font-semibold text-charcoal-700">Quick Filters:</span>
        <button
          onClick={() => onDistrictChange('')}
          className={`px-3 py-1 rounded-full border transition-colors ${
            selectedDistrict === ''
              ? 'bg-forest-700 text-white border-forest-700'
              : 'bg-sand-100 hover:bg-sand-200 border-sand-200 text-charcoal-700'
          }`}
        >
          All Regions
        </button>
        {districts.map((d) => (
          <button
            key={d}
            onClick={() => onDistrictChange(selectedDistrict === d ? '' : d)}
            className={`px-3 py-1 rounded-full border transition-colors ${
              selectedDistrict === d
                ? 'bg-forest-700 text-white border-forest-700'
                : 'bg-sand-100 hover:bg-sand-200 border-sand-200 text-charcoal-700'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};
