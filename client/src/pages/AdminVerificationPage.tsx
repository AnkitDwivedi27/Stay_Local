import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Users,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Check,
  Ban,
  History,
  Download,
  HelpCircle,
  Home,
  Compass,
  Sparkles,
} from 'lucide-react';
import { AccommodationRecord, AuthUser } from '../types';
import { apiService } from '../services/api';
import { AdminGuideManagementSection } from '../components/admin/AdminGuideManagementSection';
import { AdminTreasureManagementSection } from '../components/admin/AdminTreasureManagementSection';

export const AdminVerificationPage: React.FC = () => {
  const [adminTab, setAdminTab] = useState<'homestays' | 'guides' | 'treasures'>('homestays');
  const [queue, setQueue] = useState<AccommodationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('verification_pending');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Review Modal State
  const [selectedStay, setSelectedStay] = useState<
    (AccommodationRecord & { hostUser?: Partial<AuthUser>; bookings?: unknown[] }) | null
  >(null);
  const [loadingListingId, setLoadingListingId] = useState<string | null>(null);
  const [decisionAction, setDecisionAction] = useState<
    'approve' | 'reject' | 'request_info' | 'suspend' | null
  >(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { status?: string; district?: string } = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (districtFilter) {
        params.district = districtFilter;
      }
      const data = await apiService.getAdminVerificationQueue(params);
      setQueue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verification queue.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, districtFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleOpenReview = async (stay: AccommodationRecord) => {
    try {
      setLoadingListingId(stay.id);
      const detailed = await apiService.getAdminListingDetails(stay.id);
      setSelectedStay(detailed);
      setDecisionAction(null);
      setDecisionReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to fetch listing inspection details.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay || !decisionAction || !decisionReason.trim()) return;

    try {
      setActionSubmitting(true);
      let updated: AccommodationRecord;

      if (
        decisionAction === 'approve' ||
        decisionAction === 'reject' ||
        decisionAction === 'request_info'
      ) {
        updated = await apiService.adminVerifyListing(
          selectedStay.id,
          decisionAction,
          decisionReason.trim()
        );
      } else {
        updated = await apiService.adminSuspendListing(selectedStay.id, decisionReason.trim());
      }

      // Update in local queue
      setQueue((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedStay(null);
      setDecisionAction(null);
      setDecisionReason('');
      fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to execute administrator decision.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filtered queue based on client-side search query
  const filteredQueue = queue.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.locality.toLowerCase().includes(q) ||
      item.district.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-sand-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest-900 text-sand-100 flex items-center justify-center font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6 text-sand-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-950">
                  Administrator Verification Portal
                </h1>
                <span className="text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-forest-50 text-forest-800 border border-forest-200">
                  Admin Governance
                </span>
              </div>
              <p className="text-sm text-charcoal-600 mt-1">
                Audit Uttarakhand homestay evidence, verify Panchayati documents, and govern platform listings
              </p>
            </div>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAdminTab('homestays')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              adminTab === 'homestays'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'bg-white border border-sand-300 text-charcoal-700 hover:bg-sand-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Homestay Listings Queue ({queue.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('guides')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              adminTab === 'guides'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'bg-white border border-sand-300 text-charcoal-700 hover:bg-sand-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Guide Discovery & Moderation</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('treasures')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              adminTab === 'treasures'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'bg-white border border-sand-300 text-charcoal-700 hover:bg-sand-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Local Treasures & Artisans</span>
          </button>
        </div>

        {adminTab === 'guides' ? (
          <AdminGuideManagementSection />
        ) : adminTab === 'treasures' ? (
          <AdminTreasureManagementSection />
        ) : (
          <>
            {/* Filters and Search Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sand-300 space-y-4">
          {/* Tab Filter */}
          <div className="flex flex-wrap gap-2 border-b border-sand-200 pb-3">
            {[
              { id: 'verification_pending', label: 'Pending Review Queue', icon: Clock },
              { id: 'verified', label: 'Verified Listings', icon: CheckCircle2 },
              { id: 'rejected_or_inactive', label: 'Rejected / Suspended', icon: XCircle },
              { id: 'all', label: 'All Listings', icon: Filter },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-forest-800 text-white shadow-sm'
                      : 'bg-sand-50 text-charcoal-700 hover:bg-sand-100 border border-sand-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by listing name, village, district, or ID..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            >
              <option value="">All Uttarakhand Districts</option>
              <option value="Pithoragarh">Pithoragarh</option>
              <option value="Nainital">Nainital</option>
              <option value="Bageshwar">Bageshwar</option>
              <option value="Almora">Almora</option>
              <option value="Chamoli">Chamoli</option>
              <option value="Rudraprayag">Rudraprayag</option>
              <option value="Uttarkashi">Uttarkashi</option>
            </select>
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-sand-300">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-forest-700 border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium text-charcoal-600">Loading verification queue...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button
              onClick={fetchQueue}
              className="mt-3 px-4 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-sand-300 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-forest-950">Queue Empty</h3>
            <p className="text-xs text-charcoal-600 max-w-sm mx-auto">
              No homestay listings currently require review under the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-sand-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 border-b border-sand-200 text-charcoal-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Listing / Property</th>
                    <th className="px-5 py-3.5">District & Locality</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Nightly Rate</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Inspection Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {filteredQueue.map((item) => {
                    const isVerified = item.verificationStatus === 'verified';
                    const isPending = item.verificationStatus === 'verification_pending';
                    const isRejected = item.verificationStatus === 'rejected_or_inactive';

                    return (
                      <tr key={item.id} className="hover:bg-sand-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-forest-950 font-serif text-sm">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-charcoal-400 mt-0.5">ID: {item.id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-charcoal-800">{item.locality}</div>
                          <div className="text-[11px] text-charcoal-500">{item.district}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="capitalize px-2 py-0.5 rounded bg-sand-100 text-charcoal-700">
                            {item.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-charcoal-800">
                          ₹{item.pricePerNight?.toLocaleString('en-IN') || 1800}
                        </td>
                        <td className="px-5 py-4">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Pending Review
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-3 h-3" />
                              Rejected / Inactive
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sand-200 text-charcoal-800">
                              Unverified Lead
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleOpenReview(item)}
                            disabled={loadingListingId === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-forest-50 hover:bg-forest-100 text-forest-900 border border-forest-200 transition-colors disabled:opacity-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{loadingListingId === item.id ? 'Loading...' : 'Inspect & Audit'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}

        {/* Modal: Listing Inspection & Decision Dialog */}
        {selectedStay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-sand-300 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-forest-950 text-white px-6 py-4 flex items-center justify-between border-b border-forest-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-clay-400" />
                  <div>
                    <h3 className="font-serif text-lg font-bold">
                      Field Audit Inspection: {selectedStay.name}
                    </h3>
                    <p className="text-xs text-sand-300">Listing Reference: {selectedStay.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStay(null)}
                  className="text-sand-300 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Inspection Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* 1. Property Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sand-50 p-4 rounded-xl border border-sand-200 text-xs">
                  <div>
                    <div className="font-semibold text-charcoal-500 uppercase tracking-wider text-[10px]">
                      Location & Category
                    </div>
                    <div className="font-bold text-forest-950 text-sm mt-0.5">
                      {selectedStay.address}, {selectedStay.locality}
                    </div>
                    <div className="text-charcoal-600">
                      District: {selectedStay.district} • Category:{' '}
                      <span className="capitalize">{selectedStay.category.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-charcoal-500 uppercase tracking-wider text-[10px]">
                      Pricing & Capacity
                    </div>
                    <div className="font-bold text-forest-950 text-sm mt-0.5">
                      ₹{selectedStay.pricePerNight?.toLocaleString('en-IN') || 1800} / night
                    </div>
                    <div className="text-charcoal-600">
                      Capacity: {selectedStay.guestCapacity?.maxGuests || 4} guests •{' '}
                      {selectedStay.guestCapacity?.roomCount || 1} rooms
                    </div>
                  </div>
                </div>

                {/* 2. Host Identity Information */}
                {selectedStay.hostUser && (
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span>Host Operator Contact</span>
                    </div>
                    <div className="text-charcoal-800">
                      <span className="font-semibold">{selectedStay.hostUser.fullName}</span> (
                      {selectedStay.hostUser.role})
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-charcoal-600 text-[11px] pt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedStay.hostUser.email}
                      </span>
                      {selectedStay.hostUser.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {selectedStay.hostUser.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Submitted Evidence / Host Authorization & Documentation */}
                <div className="space-y-3 text-xs">
                  <div className="font-bold text-forest-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-forest-700" />
                    <span>Host Authorization & Submitted Verification Documents</span>
                  </div>

                  {selectedStay.hostAuthorization ? (
                    <div className="p-4 rounded-xl bg-sand-50/80 border border-sand-300 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-semibold text-charcoal-500 text-[10px] uppercase tracking-wider block">
                            Relationship with Property
                          </span>
                          <span className="font-bold text-forest-950 capitalize text-sm">
                            {selectedStay.hostAuthorization.relationship.replace(/_/g, ' ')}
                          </span>
                          {selectedStay.hostAuthorization.relationshipExplanation && (
                            <p className="text-[11px] text-charcoal-600 italic mt-0.5">
                              "{selectedStay.hostAuthorization.relationshipExplanation}"
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="font-semibold text-charcoal-500 text-[10px] uppercase tracking-wider block">
                            Host Declaration
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmed on{' '}
                            {new Date(
                              selectedStay.hostAuthorization.declaredAt ||
                                selectedStay.hostAuthorization.submittedAt
                            ).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Statements */}
                      {selectedStay.hostAuthorization.notes && (
                        <div className="pt-2 border-t border-sand-200 text-xs">
                          <span className="font-semibold text-charcoal-700">Host Statement: </span>
                          <span className="text-charcoal-800">
                            {selectedStay.hostAuthorization.notes}
                          </span>
                        </div>
                      )}

                      {/* Uploaded Documents List */}
                      {selectedStay.hostAuthorization.documents &&
                      selectedStay.hostAuthorization.documents.length > 0 ? (
                        <div className="space-y-2 pt-2 border-t border-sand-200">
                          <span className="font-semibold text-charcoal-700 text-[11px] uppercase tracking-wider block">
                            Supporting Evidence Files ({selectedStay.hostAuthorization.documents.length}):
                          </span>
                          <div className="space-y-1.5">
                            {selectedStay.hostAuthorization.documents.map((doc, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg bg-white border border-sand-300 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-forest-700 shrink-0" />
                                  <div className="truncate">
                                    <span className="font-semibold text-forest-950 truncate block">
                                      {doc.fileName}
                                    </span>
                                    <span className="text-[10px] text-charcoal-500">
                                      {(doc.fileSize / 1024).toFixed(0)} KB •{' '}
                                      <span className="capitalize font-medium text-amber-800">
                                        {doc.documentType.replace(/_/g, ' ')}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {doc.downloadUrl && (
                                  <a
                                    href={doc.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded bg-sand-100 hover:bg-sand-200 text-charcoal-800 border border-sand-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                                  >
                                    <Download className="w-3 h-3 text-forest-700" />
                                    <span>Download</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-charcoal-500 italic pt-1">
                          No document files uploaded in this submission.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-sand-300 text-charcoal-700 leading-relaxed font-mono text-[11px]">
                      {selectedStay.submissionEvidence ||
                        selectedStay.verificationNotes ||
                        'No documentation submitted by operator yet.'}
                    </div>
                  )}
                </div>

                {/* 4. Verification History Audit Trail */}
                {selectedStay.verificationHistory &&
                  selectedStay.verificationHistory.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-forest-950 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-forest-700" />
                        <span>Audit Trail & Historical Review Log</span>
                      </div>
                      <div className="space-y-2 border border-sand-200 rounded-xl p-3 bg-sand-50/50">
                        {selectedStay.verificationHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] p-2 bg-white rounded-lg border border-sand-200 flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span
                                className={`uppercase text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  item.decision === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.decision === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : item.decision === 'suspended'
                                    ? 'bg-charcoal-900 text-white'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.decision.replace(/_/g, ' ')}
                              </span>
                              <span className="text-charcoal-400 font-normal">
                                {new Date(item.timestamp).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-charcoal-700 mt-1">{item.reason}</div>
                            {item.reviewerName && (
                              <div className="text-charcoal-400 text-[10px]">
                                Action by: {item.reviewerName} ({item.reviewedBy})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 5. Administrative Decision Controls */}
                <div className="pt-4 border-t border-sand-200 space-y-4">
                  <div className="font-bold text-forest-950 text-xs">Take Administrative Action</div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDecisionAction('approve');
                        setDecisionReason('Verified: Homestay scheme certificate and residency validated.');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        decisionAction === 'approve'
                          ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Publish</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionAction('request_info');
                        setDecisionReason(
                          'Additional documentation required: Please provide owner written consent (NOC) or recent property utility bill.'
                        );
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        decisionAction === 'request_info'
                          ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500 ring-offset-1'
                          : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Request Information</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionAction('reject');
                        setDecisionReason('Rejected: Incomplete registration or safety standards not met.');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        decisionAction === 'reject'
                          ? 'bg-red-700 text-white shadow-sm ring-2 ring-red-600 ring-offset-1'
                          : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Listing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionAction('suspend');
                        setDecisionReason('Suspended: Violation of StayLocal community or environmental guidelines.');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        decisionAction === 'suspend'
                          ? 'bg-charcoal-900 text-white shadow-sm ring-2 ring-charcoal-800 ring-offset-1'
                          : 'bg-charcoal-100 text-charcoal-800 border border-charcoal-300 hover:bg-charcoal-200'
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      <span>Suspend Listing</span>
                    </button>
                  </div>

                  {decisionAction && (
                    <form onSubmit={handleExecuteDecision} className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                          Administrator Explanation / Decision Reason *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          placeholder="Provide clear rationale. This will be preserved in the audit log and shared with the host."
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDecisionAction(null)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-charcoal-600 hover:bg-sand-100 rounded-lg"
                        >
                          Cancel Action
                        </button>
                        <button
                          type="submit"
                          disabled={actionSubmitting || !decisionReason.trim()}
                          className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-colors ${
                            decisionAction === 'approve'
                              ? 'bg-emerald-700 hover:bg-emerald-800'
                              : decisionAction === 'reject'
                              ? 'bg-red-700 hover:bg-red-800'
                              : decisionAction === 'request_info'
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-charcoal-900 hover:bg-black'
                          }`}
                        >
                          {actionSubmitting
                            ? 'Executing...'
                            : decisionAction === 'approve'
                            ? 'Confirm Approval'
                            : decisionAction === 'reject'
                            ? 'Confirm Rejection'
                            : decisionAction === 'request_info'
                            ? 'Send Request to Host'
                            : 'Confirm Suspension'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-sand-50 border-t border-sand-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStay(null)}
                  className="px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-sand-200 rounded-lg"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
