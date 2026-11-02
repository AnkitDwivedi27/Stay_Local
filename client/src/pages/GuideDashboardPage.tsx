import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Upload,
  Eye,
  EyeOff,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  GuideProfileRecord,
  GuideExperienceRecord,
  GuideBookingRecord,
  CreateGuideExperiencePayload,
  UpdateGuideProfilePayload,
} from '../types';
import { apiService } from '../services/api';

export const GuideDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'experiences' | 'bookings' | 'profile'>('experiences');
  const [profile, setProfile] = useState<GuideProfileRecord | null>(null);
  const [experiences, setExperiences] = useState<GuideExperienceRecord[]>([]);
  const [bookings, setBookings] = useState<GuideBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Experience modal state
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<GuideExperienceRecord | null>(null);
  const [expForm, setExpForm] = useState<CreateGuideExperiencePayload>({
    title: '',
    description: '',
    category: 'Trekking & Hiking',
    district: 'Pithoragarh',
    locality: 'Munsiari',
    meetingPoint: 'Nanda Devi Temple gate, Sarmoli',
    duration: 'Half Day (4 Hours)',
    price: 1500,
    pricingType: 'per_person',
    maxGroupSize: 8,
    requirements: 'Sturdy trekking shoes, 1L water bottle, windbreaker jacket.',
    availableSlots: [
      {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0] || '',
        timeSlots: ['08:00 AM - 12:00 PM', '01:00 PM - 05:00 PM'],
      },
    ],
  });

  // Profile edit state
  const [profileForm, setProfileForm] = useState<UpdateGuideProfilePayload>({
    bio: '',
    experienceYears: 3,
    phone: '',
    languages: ['Hindi', 'English'],
    serviceLocations: [{ district: 'Pithoragarh', locality: 'Munsiari' }],
    specialties: ['Trekking', 'Village Walks', 'Birdwatching'],
    qualifications: '',
  });

  // Supporting evidence upload
  const [verificationDocs, setVerificationDocs] = useState<
    Array<{ fileName: string; fileType: string; fileSize: number; dataUrl: string }>
  >([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profData, expData, bookData] = await Promise.all([
        apiService.getMyGuideProfile(),
        apiService.getMyGuideExperiences(),
        apiService.getMyGuideIncomingBookings(),
      ]);

      setProfile(profData);
      setExperiences(expData);
      setBookings(bookData);

      setProfileForm({
        bio: profData.bio || '',
        experienceYears: profData.experienceYears || 0,
        phone: profData.phone || '',
        languages: profData.languages || ['Hindi'],
        serviceLocations: profData.serviceLocations || [{ district: 'Pithoragarh', locality: 'Munsiari' }],
        specialties: profData.specialties || ['Trekking'],
        qualifications: profData.qualifications || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guide dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Experience Create / Update
  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingExp) {
        await apiService.updateGuideExperience(editingExp.id, expForm);
        setActionSuccess('Experience updated successfully.');
      } else {
        await apiService.createGuideExperience(expForm);
        setActionSuccess('Experience created as draft.');
      }
      setIsExpModalOpen(false);
      setEditingExp(null);
      const updated = await apiService.getMyGuideExperiences();
      setExperiences(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save experience.');
    }
  };

  // Publish / Unpublish
  const handleTogglePublish = async (exp: GuideExperienceRecord) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      if (exp.status === 'published') {
        await apiService.unpublishGuideExperience(exp.id);
        setActionSuccess(`Experience '${exp.title}' reverted to draft.`);
      } else {
        await apiService.publishGuideExperience(exp.id);
        setActionSuccess(`Experience '${exp.title}' published successfully.`);
      }
      const updated = await apiService.getMyGuideExperiences();
      setExperiences(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update publication status.');
    }
  };

  // Delete Experience
  const handleDeleteExperience = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) return;
    try {
      await apiService.deleteGuideExperience(id);
      setActionSuccess('Experience deleted.');
      setExperiences((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete experience.');
    }
  };

  // Respond to Booking
  const handleRespondBooking = async (id: string, action: 'confirm' | 'reject') => {
    let reason: string | undefined = undefined;
    if (action === 'reject') {
      const promptReason = window.prompt('Please enter a brief decline reason for the traveler:');
      if (!promptReason) return;
      reason = promptReason;
    }

    try {
      setActionError(null);
      await apiService.respondToGuideBooking(id, action, reason);
      setActionSuccess(action === 'confirm' ? 'Booking confirmed.' : 'Booking declined.');
      const updated = await apiService.getMyGuideIncomingBookings();
      setBookings(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to respond to booking.');
    }
  };

  // Complete Booking
  const handleCompleteBooking = async (id: string) => {
    try {
      setActionError(null);
      await apiService.completeGuideBooking(id);
      setActionSuccess('Booking marked as completed.');
      const updated = await apiService.getMyGuideIncomingBookings();
      setBookings(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete booking.');
    }
  };

  // Update Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await apiService.updateMyGuideProfile(profileForm);
      setProfile(updated);
      setActionSuccess('Guide profile saved successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  // Handle Document Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setVerificationDocs((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileType: file.type || 'application/pdf',
            fileSize: file.size,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit for Verification
  const handleSubmitVerification = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await apiService.submitGuideVerification({
        ...profileForm,
        documents: verificationDocs,
      });
      setProfile(updated);
      setVerificationDocs([]);
      setActionSuccess('Credentials submitted for administrator verification.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit verification.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 max-w-5xl mx-auto space-y-4">
        <div className="h-28 bg-sand-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-sand-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isVerified = profile?.verificationStatus === 'verified';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-sand-300 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-forest-700 text-white flex items-center justify-center font-bold text-2xl shadow-inner overflow-hidden">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-2xl font-bold text-forest-950">
                    {profile?.fullName}
                  </h1>
                  {profile?.verificationStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Verified Guide
                    </span>
                  )}
                  {profile?.verificationStatus === 'verification_pending' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Verification Under Review
                    </span>
                  )}
                  {profile?.verificationStatus === 'unverified' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sand-200 text-charcoal-700 border border-sand-300">
                      Unverified Account
                    </span>
                  )}
                  {profile?.verificationStatus === 'rejected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-700" />
                      Verification Declined
                    </span>
                  )}
                </div>
                <p className="text-xs text-charcoal-500 mt-1">
                  Local Mountain Guide • {profile?.serviceLocations.map((l) => l.locality).join(', ')},{' '}
                  {profile?.serviceLocations.map((l) => l.district).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingExp(null);
                  setIsExpModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Experience</span>
              </button>
            </div>
          </div>

          {/* Verification Callout if not verified */}
          {!isVerified && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">
                  Profile Verification Required to Publish Experiences
                </span>
                <p className="text-amber-800/90 leading-relaxed">
                  You can design draft experiences anytime, but they will become discoverable and bookable to tourists only after an administrator reviews your qualifications or certification evidence.
                </p>
                {profile?.verificationNotes && (
                  <p className="font-semibold text-amber-950 mt-1">
                    Feedback: {profile.verificationNotes}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="font-bold underline text-amber-950 mt-1 block"
                >
                  Go to Profile & Credentials →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action feedback */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{actionError}</div>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{actionSuccess}</div>
          </div>
        )}

        {/* Tabs Switcher */}
        <div className="flex items-center gap-2 border-b border-sand-300">
          <button
            type="button"
            onClick={() => setActiveTab('experiences')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'experiences'
                ? 'border-forest-700 text-forest-900 bg-forest-50/50 rounded-t-lg'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Compass className="w-4 h-4 text-forest-700" />
            <span>My Experiences</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sand-200 font-bold">
              {experiences.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-forest-700 text-forest-900 bg-forest-50/50 rounded-t-lg'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-forest-700" />
            <span>Booking Requests</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sand-200 font-bold">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-forest-700 text-forest-900 bg-forest-50/50 rounded-t-lg'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Award className="w-4 h-4 text-forest-700" />
            <span>Profile & Credentials</span>
          </button>
        </div>

        {/* Tab 1: Experiences */}
        {activeTab === 'experiences' && (
          <div className="space-y-4">
            {experiences.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-sand-300 p-8 space-y-3">
                <Compass className="w-10 h-10 text-forest-700 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-forest-950">
                  No Experiences Created
                </h3>
                <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
                  Create your first guided trek, cultural walk, or village storytelling session.
                </p>
                <button
                  onClick={() => {
                    setEditingExp(null);
                    setIsExpModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-forest-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Experience</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-white rounded-2xl p-5 border border-sand-300 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-clay-600 tracking-wider">
                            {exp.category}
                          </span>
                          <h4 className="font-serif text-lg font-bold text-forest-950">
                            {exp.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-clay-500 shrink-0" />
                            <span>
                              {exp.locality}, {exp.district}
                            </span>
                          </div>
                        </div>

                        <div>
                          {exp.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Eye className="w-3 h-3 text-emerald-700" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sand-200 text-charcoal-700 border border-sand-300">
                              <EyeOff className="w-3 h-3" />
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-charcoal-600 line-clamp-2">
                        {exp.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-semibold text-charcoal-800 pt-1">
                        <span>Duration: {exp.duration}</span>
                        <span>•</span>
                        <span className="text-forest-900">
                          ₹{exp.price.toLocaleString()} ({exp.pricingType === 'per_group' ? 'group' : 'person'})
                        </span>
                        <span>•</span>
                        <span>Max {exp.maxGroupSize} spots</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-sand-200 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(exp)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          exp.status === 'published'
                            ? 'bg-sand-100 hover:bg-sand-200 text-charcoal-800 border-sand-300'
                            : 'bg-forest-50 hover:bg-forest-100 text-forest-800 border-forest-300'
                        }`}
                      >
                        {exp.status === 'published' ? 'Unpublish' : 'Publish Experience'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExp(exp);
                            setExpForm({
                              title: exp.title,
                              description: exp.description,
                              category: exp.category,
                              district: exp.district,
                              locality: exp.locality,
                              meetingPoint: exp.meetingPoint,
                              duration: exp.duration,
                              price: exp.price,
                              pricingType: exp.pricingType,
                              maxGroupSize: exp.maxGroupSize,
                              requirements: exp.requirements || '',
                              availableSlots: exp.availableSlots || [],
                            });
                            setIsExpModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-charcoal-500 hover:bg-sand-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-sand-300 p-8 space-y-3">
                <Calendar className="w-10 h-10 text-forest-700 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-forest-950">
                  No Incoming Booking Requests
                </h3>
                <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
                  When tourists explore your destination and book experiences, their requests will appear here.
                </p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-sand-300 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-sand-200">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif text-lg font-bold text-forest-950">
                          {booking.experienceTitle}
                        </h4>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-sand-100 font-semibold text-charcoal-700">
                          {booking.bookingReference}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-500 mt-0.5">
                        Traveler: <span className="font-semibold text-charcoal-800">{booking.touristName}</span> ({booking.touristEmail})
                      </p>
                    </div>

                    <div>
                      {booking.status === 'confirmed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed
                        </span>
                      )}
                      {booking.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Awaiting Your Decision
                        </span>
                      )}
                      {booking.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Declined
                        </span>
                      )}
                      {booking.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                      <span className="text-charcoal-500 block mb-0.5">Date & Time:</span>
                      <span className="font-semibold text-charcoal-900 block truncate">
                        {booking.bookingDate}
                      </span>
                      <span className="text-[10px] text-charcoal-500">{booking.timeSlot}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                      <span className="text-charcoal-500 block mb-0.5">Participants:</span>
                      <span className="font-semibold text-charcoal-900 block">
                        {booking.participantCount} Person(s)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                      <span className="text-charcoal-500 block mb-0.5">Total Amount:</span>
                      <span className="font-bold text-forest-900 block text-sm">
                        ₹{booking.pricing.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200">
                      <span className="text-charcoal-500 block mb-0.5">Location:</span>
                      <span className="font-semibold text-charcoal-900 block truncate">
                        {booking.location.locality}
                      </span>
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <div className="p-2.5 rounded-xl bg-sand-50 border border-sand-200 text-xs text-charcoal-700">
                      <span className="font-bold">Traveler Request: </span>
                      {booking.specialRequests}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-sand-200 flex items-center justify-between text-xs">
                    <span className="text-charcoal-400">
                      Received {new Date(booking.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRespondBooking(booking.id, 'reject')}
                            className="px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondBooking(booking.id, 'confirm')}
                            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors"
                          >
                            Accept Booking
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleCompleteBooking(booking.id)}
                          className="px-4 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white font-semibold transition-colors"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Profile & Credentials */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 border border-sand-300 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-forest-950">
                Guide Profile & Regional Qualifications
              </h3>
              <p className="text-xs text-charcoal-600 mt-1">
                Your profile information establishes trust with travelers visiting Uttarakhand destinations.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Years of Mountain Guiding Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={profileForm.experienceYears}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        experienceYears: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Direct Contact Phone (Kept Private)
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Introduction / Bio (Experience Highlights)
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs focus:ring-2 focus:ring-forest-600"
                  placeholder="Share your regional background, favorite trails, and local lore..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Qualifications, Certifications & Forest Permits
                </label>
                <textarea
                  rows={2}
                  value={profileForm.qualifications}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, qualifications: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs focus:ring-2 focus:ring-forest-600"
                  placeholder="e.g. Nehru Institute of Mountaineering BMC/AMC certification, Uttarakhand Tourism guide registration, Red Cross Wilderness First Aid..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>

            {/* Document Verification Section */}
            <div className="pt-6 border-t border-sand-200 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-forest-700" />
                <h4 className="font-serif text-lg font-bold text-forest-950">
                  Admin Verification & Supporting Evidence
                </h4>
              </div>
              <p className="text-xs text-charcoal-600">
                Upload your guide certification, government ID, or regional tourism permits (PDF, JPG, PNG up to 5MB). These are stored securely and reviewed exclusively by StayLocal administrators.
              </p>

              {/* Upload input */}
              <div className="p-4 rounded-xl border-2 border-dashed border-sand-300 bg-sand-50/70 text-center space-y-2">
                <Upload className="w-6 h-6 text-charcoal-500 mx-auto" />
                <div className="text-xs font-medium text-charcoal-700">
                  Select evidence documents
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="text-xs text-charcoal-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-forest-700 file:text-white hover:file:bg-forest-800"
                />
              </div>

              {/* Pending uploaded files */}
              {verificationDocs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-charcoal-800">
                    Ready to submit ({verificationDocs.length} file(s)):
                  </span>
                  <div className="space-y-1">
                    {verificationDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs"
                      >
                        <span className="font-medium text-emerald-900">{doc.fileName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setVerificationDocs((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previously uploaded files */}
              {profile?.documents && profile.documents.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-charcoal-800">
                    Documents on File:
                  </span>
                  <div className="space-y-1">
                    {profile.documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-sand-100 text-xs text-charcoal-700"
                      >
                        <span>{d.fileName}</span>
                        <span className="text-[10px] text-charcoal-500">
                          {new Date(d.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitVerification}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Submit Credentials for Admin Verification
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Experience Modal */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-sand-300 my-8 space-y-4">
            <h3 className="font-serif text-xl font-bold text-forest-950">
              {editingExp ? 'Edit Experience' : 'Create New Guide Experience'}
            </h3>

            <form onSubmit={handleSaveExperience} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Experience Title
                </label>
                <input
                  type="text"
                  required
                  value={expForm.title}
                  onChange={(e) => setExpForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Khaliya Top Alpine Ridge Trek"
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Category</label>
                <select
                  value={expForm.category}
                  onChange={(e) => setExpForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                >
                  <option value="Trekking & Hiking">Trekking & Hiking</option>
                  <option value="Village Culture & Walks">Village Culture & Walks</option>
                  <option value="Birdwatching & Nature">Birdwatching & Nature</option>
                  <option value="Mountain Photography">Mountain Photography</option>
                  <option value="Kumaoni Culinary Workshop">Kumaoni Culinary Workshop</option>
                  <option value="Traditional Craft & Weaving">Traditional Craft & Weaving</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={expForm.district}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, district: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Locality</label>
                  <input
                    type="text"
                    required
                    value={expForm.locality}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, locality: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Meeting Point Details
                </label>
                <input
                  type="text"
                  required
                  value={expForm.meetingPoint}
                  onChange={(e) =>
                    setExpForm((prev) => ({ ...prev, meetingPoint: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={expForm.price}
                    onChange={(e) =>
                      setExpForm((prev) => ({
                        ...prev,
                        price: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Pricing Type</label>
                  <select
                    value={expForm.pricingType}
                    onChange={(e) =>
                      setExpForm((prev) => ({
                        ...prev,
                        pricingType: e.target.value as 'per_person' | 'per_group',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  >
                    <option value="per_person">Per Person</option>
                    <option value="per_group">Per Group</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Max Group</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={expForm.maxGroupSize}
                    onChange={(e) =>
                      setExpForm((prev) => ({
                        ...prev,
                        maxGroupSize: parseInt(e.target.value, 10) || 8,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Duration</label>
                <input
                  type="text"
                  required
                  value={expForm.duration}
                  onChange={(e) => setExpForm((prev) => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  placeholder="e.g. 4 Hours, Full Day, 2 Days"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={expForm.description}
                  onChange={(e) =>
                    setExpForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  placeholder="Detailed trail overview, scenic stops, cultural interactions..."
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Participant Instructions / Requirements
                </label>
                <textarea
                  rows={2}
                  value={expForm.requirements}
                  onChange={(e) =>
                    setExpForm((prev) => ({ ...prev, requirements: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs"
                  placeholder="What travelers should bring, clothing requirements, fitness level..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-charcoal-600 hover:bg-sand-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-forest-700 text-white font-semibold"
                >
                  {editingExp ? 'Save Changes' : 'Create Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
