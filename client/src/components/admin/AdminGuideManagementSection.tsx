import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  Award,
  Users,
  Compass,
  FileText,
  AlertTriangle,
  Trash2,
  MapPin,
} from 'lucide-react';
import { GuideProfileRecord, GuideExperienceRecord } from '../../types';
import { apiService } from '../../services/api';

export const AdminGuideManagementSection: React.FC = () => {
  const [subTab, setSubTab] = useState<'guides' | 'experiences'>('guides');
  const [guides, setGuides] = useState<GuideProfileRecord[]>([]);
  const [experiences, setExperiences] = useState<GuideExperienceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [guidesData, expData] = await Promise.all([
        apiService.adminGetAllGuides(),
        apiService.adminGetAllGuideExperiences(),
      ]);
      setGuides(guidesData);
      setExperiences(expData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guide administration data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReviewGuide = async (
    guideId: string,
    action: 'approve' | 'reject' | 'suspend' | 'reactivate'
  ) => {
    let notes: string | undefined = undefined;
    if (action === 'reject' || action === 'suspend') {
      const promptNotes = window.prompt(`Please enter the reason for ${action}:`);
      if (!promptNotes) return;
      notes = promptNotes;
    }

    try {
      setActionError(null);
      setActionSuccess(null);
      const updated = await apiService.adminReviewGuide(guideId, action, notes);
      setGuides((prev) => prev.map((g) => (g.id === guideId ? updated : g)));
      setActionSuccess(`Guide verification status updated to ${updated.verificationStatus}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to review guide.');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this guide experience?')) return;
    try {
      setActionError(null);
      setActionSuccess(null);
      await apiService.adminDeleteGuideExperience(id, 'Removed by administrator moderation');
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      setActionSuccess('Experience removed successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove experience.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-sand-200 rounded-xl" />
        <div className="h-64 bg-sand-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-sand-300 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('guides')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            subTab === 'guides'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Registered Guides ({guides.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('experiences')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            subTab === 'experiences'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Guide Experiences ({experiences.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>{actionError}</div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>{actionSuccess}</div>
        </div>
      )}

      {subTab === 'guides' ? (
        guides.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-sand-300 p-8 space-y-2">
            <Users className="w-8 h-8 text-charcoal-400 mx-auto" />
            <p className="text-sm font-semibold text-charcoal-800">
              No registered guide profiles found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="bg-white rounded-2xl p-5 border border-sand-300 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {guide.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif text-lg font-bold text-charcoal-900">
                          {guide.fullName}
                        </h4>
                        <span className="text-xs text-charcoal-500 font-mono">
                          ({guide.email})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-clay-500 shrink-0" />
                        <span>
                          {guide.serviceLocations.map((l) => `${l.locality}, ${l.district}`).join(' • ')}
                        </span>
                        <span>•</span>
                        <span>{guide.experienceYears}y experience</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {guide.verificationStatus === 'verified' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Verified
                      </span>
                    )}
                    {guide.verificationStatus === 'verification_pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        Verification Pending
                      </span>
                    )}
                    {guide.verificationStatus === 'unverified' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sand-200 text-charcoal-700 border border-sand-300">
                        Unverified
                      </span>
                    )}
                    {guide.verificationStatus === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" />
                        Rejected
                      </span>
                    )}
                    {guide.verificationStatus === 'suspended' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800 border border-gray-300">
                        <Ban className="w-3.5 h-3.5 text-gray-700" />
                        Suspended
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-charcoal-700">
                  <div className="p-3 rounded-xl bg-sand-50/70 border border-sand-200 space-y-1">
                    <span className="font-bold text-charcoal-900 block">Languages & Specialties:</span>
                    <div>Languages: {guide.languages.join(', ')}</div>
                    <div>Specialties: {guide.specialties.join(', ') || 'General Guiding'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-sand-50/70 border border-sand-200 space-y-1">
                    <span className="font-bold text-charcoal-900 block">Qualifications:</span>
                    <p className="line-clamp-2">{guide.qualifications || 'No qualifications entered yet.'}</p>
                  </div>
                </div>

                {/* Supporting Documents */}
                {guide.documents && guide.documents.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-charcoal-900">
                      Uploaded Evidence Documents ({guide.documents.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {guide.documents.map((d) => (
                        <a
                          key={d.id}
                          href={d.downloadUrl || `/api/guide/documents/${guide.id}/${d.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-xs font-semibold text-charcoal-800 border border-sand-300 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-forest-700" />
                          <span>{d.fileName}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-sand-200 flex items-center justify-end gap-2 text-xs">
                  {guide.verificationStatus !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => handleReviewGuide(guide.id, 'approve')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors"
                    >
                      Approve Guide
                    </button>
                  )}

                  {guide.verificationStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleReviewGuide(guide.id, 'reject')}
                      className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  )}

                  {guide.isActive ? (
                    <button
                      type="button"
                      onClick={() => handleReviewGuide(guide.id, 'suspend')}
                      className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-colors"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReviewGuide(guide.id, 'reactivate')}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Experiences Moderation */
        experiences.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-sand-300 p-8 space-y-2">
            <Compass className="w-8 h-8 text-charcoal-400 mx-auto" />
            <p className="text-sm font-semibold text-charcoal-800">
              No guide experiences created across the platform.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-2xl p-5 border border-sand-300 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-clay-600">
                        {exp.category}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-charcoal-900">
                        {exp.title}
                      </h4>
                      <p className="text-xs text-charcoal-500">
                        By <span className="font-semibold">{exp.guideName}</span> • {exp.locality},{' '}
                        {exp.district}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        exp.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sand-200 text-charcoal-700'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-600 line-clamp-2">{exp.description}</p>

                  <div className="text-xs font-semibold text-forest-900 pt-1">
                    ₹{exp.price.toLocaleString()} ({exp.pricingType}) • {exp.duration}
                  </div>
                </div>

                <div className="pt-2 border-t border-sand-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Moderate / Remove Experience</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
