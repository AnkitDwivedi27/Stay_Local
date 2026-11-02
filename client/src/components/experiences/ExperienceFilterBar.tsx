import React from 'react';
import { Sparkles } from 'lucide-react';
import { Select } from '../ui/Select';

interface ExperienceFilterBarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedDistrict: string;
  onDistrictChange: (dist: string) => void;
  districts: string[];
}

export const ExperienceFilterBar: React.FC<ExperienceFilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedDistrict,
  onDistrictChange,
  districts,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-sand-100">
        <Sparkles className="w-4 h-4 text-clay-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
          Filter Regional Living Heritage
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <Select
          label="Heritage Category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={[
            { value: '', label: 'All Heritage Experiences' },
            { value: 'craft_and_weaving', label: 'Craft & Traditional Handloom' },
            { value: 'village_culture', label: 'Village Heritage & Stewardship' },
            { value: 'nature_and_trekking', label: 'Ecology, Lakes & Birding' },
            { value: 'culinary_and_farming', label: 'Organic Farming & Cuisine' },
          ]}
        />

        {/* District */}
        <Select
          label="District"
          value={selectedDistrict}
          onChange={(e) => onDistrictChange(e.target.value)}
          options={[
            { value: '', label: 'All Uttarakhand Districts' },
            ...districts.map((d) => ({ value: d, label: `${d} District` })),
          ]}
        />
      </div>
    </div>
  );
};
