import React, { useState } from 'react';
import { X, Home, IndianRupee, Users, ShieldCheck, AlertCircle } from 'lucide-react';
import { AccommodationRecord, AccommodationCategory, CreateListingPayload } from '../../types';
import { apiService } from '../../services/api';

interface ListingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (listing: AccommodationRecord) => void;
  initialData?: AccommodationRecord | null;
}

const CATEGORIES: { label: string; value: AccommodationCategory }[] = [
  { label: 'Village Homestay', value: 'village_homestay' },
  { label: 'Heritage Farmstay', value: 'heritage_farmstay' },
  { label: 'Eco Mountain Lodge', value: 'eco_lodge' },
  { label: 'Mountain Cottage', value: 'mountain_cottage' },
  { label: 'Bed & Breakfast', value: 'bed_and_breakfast' },
];

const COMMON_AMENITIES = [
  'Solar Water Heating',
  'Traditional Fireplace / Bukhari',
  'Organic Home-Cooked Meals',
  'High-Speed Wi-Fi',
  'Guided Village Walks',
  'Mountain Panorama Views',
  'Kitchen Garden Access',
  'Attached Bathroom',
  'Hot Drinking Water',
];

const UTTARAKHAND_DISTRICTS = [
  'Pithoragarh',
  'Nainital',
  'Bageshwar',
  'Almora',
  'Chamoli',
  'Rudraprayag',
  'Uttarkashi',
  'Tehri Garhwal',
  'Pauri Garhwal',
  'Dehradun',
];

export const ListingFormModal: React.FC<ListingFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<CreateListingPayload>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'village_homestay',
    district: initialData?.district || 'Pithoragarh',
    locality: initialData?.locality || '',
    address: initialData?.address || '',
    pricePerNight: initialData?.pricePerNight || 2200,
    guestCapacity: {
      maxGuests: initialData?.guestCapacity?.maxGuests || 4,
      roomCount: initialData?.guestCapacity?.roomCount || 2,
    },
    amenities: initialData?.amenities || ['Solar Water Heating', 'Organic Home-Cooked Meals'],
    localSpecialties: initialData?.localSpecialties || [],
    accessibilityNotes: initialData?.accessibilityNotes || '',
    travelTip: initialData?.travelTip || '',
    submissionEvidence: initialData?.submissionEvidence || '',
    submitForVerification: false,
    images: initialData?.images || [],
  });

  const [imageInput, setImageInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAmenityToggle = (amenity: string) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      setFormData({ ...formData, amenities: current.filter((a) => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...current, amenity] });
    }
  };

  const handleAddImage = () => {
    if (!imageInput.trim()) return;
    const currentImages = formData.images || [];
    setFormData({ ...formData, images: [...currentImages, imageInput.trim()] });
    setImageInput('');
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = formData.images || [];
    setFormData({
      ...formData,
      images: currentImages.filter((_, idx) => idx !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.name.trim().length < 3) {
      setError('Property name must be at least 3 characters.');
      return;
    }
    if (formData.description.trim().length < 20) {
      setError('Description must be at least 20 characters.');
      return;
    }
    if (!formData.locality.trim()) {
      setError('Village/locality is required.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Address is required.');
      return;
    }
    if (formData.pricePerNight < 200) {
      setError('Nightly price must be at least ₹200.');
      return;
    }

    try {
      setSubmitting(true);
      let savedListing: AccommodationRecord;

      if (isEditing && initialData) {
        savedListing = await apiService.updateHostListing(initialData.id, formData);
      } else {
        savedListing = await apiService.createHostListing(formData);
      }

      onSaved(savedListing);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save homestay listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-sand-300 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-forest-900 text-sand-50 px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center text-clay-300">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">
                {isEditing ? 'Edit Homestay Listing' : 'List Your Uttarakhand Homestay'}
              </h2>
              <p className="text-xs text-sand-200">
                Provide accurate village property details for conscious travelers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sand-300 hover:text-white hover:bg-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-bold text-forest-900 border-b border-sand-200 pb-1">
              1. Property Overview
            </h3>

            <div>
              <label htmlFor="listing-name" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Property / Homestay Name *
              </label>
              <input
                id="listing-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Nanda Devi Orchard Cottage"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="listing-category" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Accommodation Category *
                </label>
                <select
                  id="listing-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as AccommodationCategory,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="listing-district" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  District *
                </label>
                <select
                  id="listing-district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  {UTTARAKHAND_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="listing-locality" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Village / Locality *
                </label>
                <input
                  id="listing-locality"
                  type="text"
                  required
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  placeholder="e.g. Sarmoli or Darkot"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label htmlFor="listing-address" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Full Address *
                </label>
                <input
                  id="listing-address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Upper Sarmoli, Near Community School"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="listing-description" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Property Description *
              </label>
              <textarea
                id="listing-description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your homestay, architectural style, mountain views, host family background..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Capacity */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-bold text-forest-900 border-b border-sand-200 pb-1 flex items-center justify-between">
              <span>2. Pricing & Capacity</span>
              <span className="text-[11px] font-normal text-charcoal-500">
                Authoritative server-calculated rates
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="listing-price" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Nightly Rate (₹ INR) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-charcoal-400" />
                  <input
                    id="listing-price"
                    type="number"
                    required
                    min={200}
                    max={50000}
                    value={formData.pricePerNight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerNight: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="listing-max-guests" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Max Guests *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-2.5 text-charcoal-400" />
                  <input
                    id="listing-max-guests"
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={formData.guestCapacity.maxGuests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guestCapacity: {
                          ...formData.guestCapacity,
                          maxGuests: parseInt(e.target.value, 10) || 1,
                        },
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Guest Rooms *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 absolute left-3 top-2.5 text-charcoal-400" />
                  <input
                    type="number"
                    required
                    min={1}
                    max={25}
                    value={formData.guestCapacity.roomCount || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guestCapacity: {
                          ...formData.guestCapacity,
                          roomCount: parseInt(e.target.value, 10) || 1,
                        },
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Amenities */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-forest-900 border-b border-sand-200 pb-1">
              3. Village Amenities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_AMENITIES.map((amenity) => {
                const checked = formData.amenities?.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border transition-all ${
                      checked
                        ? 'bg-forest-50 border-forest-600 text-forest-900 font-semibold'
                        : 'bg-sand-50/60 border-sand-300 text-charcoal-700 hover:bg-sand-100'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Photographs & Evidence */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-forest-900 border-b border-sand-200 pb-1">
              4. Photographs & Evidence
            </h3>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Add Photo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-2 bg-sand-200 hover:bg-sand-300 text-charcoal-800 text-xs font-medium rounded-lg transition-colors"
                >
                  Add Image
                </button>
              </div>

              {formData.images && formData.images.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {formData.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-sand-300 group"
                    >
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1 flex items-center justify-between">
                <span>Verification Documentation / Evidence</span>
                <span className="text-[11px] text-charcoal-500 font-normal">
                  Panchayati certificate, Homestay Scheme ID, or owner note
                </span>
              </label>
              <textarea
                rows={2}
                value={formData.submissionEvidence}
                onChange={(e) =>
                  setFormData({ ...formData, submissionEvidence: e.target.value })
                }
                placeholder="e.g. Uttarakhand Tourism Homestay Registration #UK-PITH-2026-4412, Panchayati Pradhan NOC issued April 2026."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            {!isEditing && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-forest-50 border border-forest-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.submitForVerification}
                  onChange={(e) =>
                    setFormData({ ...formData, submitForVerification: e.target.checked })
                  }
                  className="mt-0.5 rounded text-forest-700 focus:ring-forest-600"
                />
                <div className="text-xs text-forest-950">
                  <div className="font-semibold">Submit directly for administrator verification</div>
                  <p className="text-forest-800 text-[11px] mt-0.5">
                    Your listing will be entered into the admin audit queue for field verification and community approval.
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-sand-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-sand-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create Listing'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
