import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  Search,
  Filter,
  UserX,
  RefreshCw,
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  History,
  X,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { AccommodationRecord, EligibleHostRecord } from '../types';
import { apiService } from '../services/api';

export const AdminHostAssignmentsPage: React.FC = () => {
  const [stays, setStays] = useState<AccommodationRecord[]>([]);
  const [eligibleHosts, setEligibleHosts] = useState<EligibleHostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Assign Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStay, setSelectedStay] = useState<AccommodationRecord | null>(null);
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [hostSearchQuery, setHostSearchQuery] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [assignmentStep, setAssignmentStep] = useState<'select' | 'confirm'>('select');
  const [actionLoading, setActionLoading] = useState(false);

  // Reassign Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignReason, setReassignReason] = useState('');
  const [reassignConfirmStep, setReassignConfirmStep] = useState<'select' | 'confirm'>('select');

  // Unassign Modal State
  const [unassignModalOpen, setUnassignModalOpen] = useState(false);
  const [unassignReason, setUnassignReason] = useState('');

  // History Modal State
  const [historyModalStay, setHistoryModalStay] = useState<AccommodationRecord | null>(null);

  // Success Feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignmentsRes, hostsRes] = await Promise.all([
        apiService.getAdminHostAssignments({
          search: searchQuery || undefined,
          district: districtFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        apiService.getAdminEligibleHosts(),
      ]);

      setStays(assignmentsRes.stays);
      setEligibleHosts(hostsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load host assignment data.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, districtFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Initial Assignment
  const handleOpenAssign = (stay: AccommodationRecord) => {
    setSelectedStay(stay);
    setSelectedHostId('');
    setHostSearchQuery('');
    setAssignmentReason('');
    setAssignmentStep('select');
    setAssignModalOpen(true);
  };

  // Open Reassign
  const handleOpenReassign = (stay: AccommodationRecord) => {
    setSelectedStay(stay);
    setSelectedHostId('');
    setHostSearchQuery('');
    setReassignReason('');
    setReassignConfirmStep('select');
    setReassignModalOpen(true);
  };

  // Open Unassign
  const handleOpenUnassign = (stay: AccommodationRecord) => {
    setSelectedStay(stay);
    setUnassignReason('');
    setUnassignModalOpen(true);
  };

  // Submit Initial Assignment
  const handleExecuteAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay || !selectedHostId) return;

    try {
      setActionLoading(true);
      const updated = await apiService.adminAssignHost({
        stayId: selectedStay.id,
        hostId: selectedHostId,
        reason: assignmentReason.trim() || undefined,
      });

      setStays((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setAssignModalOpen(false);
      showToast(`Successfully assigned '${updated.name}' to host ${updated.assignedHostName || 'selected host'}.`);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign host.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Reassignment
  const handleExecuteReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay || !selectedHostId || !reassignReason.trim()) return;

    try {
      setActionLoading(true);
      const updated = await apiService.adminReassignHost(selectedStay.id, {
        hostId: selectedHostId,
        reason: reassignReason.trim(),
      });

      setStays((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setReassignModalOpen(false);
      showToast(`Successfully transferred '${updated.name}' to host ${updated.assignedHostName}.`);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reassign host.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Unassignment
  const handleExecuteUnassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay) return;

    try {
      setActionLoading(true);
      const res = await apiService.adminUnassignHost(
        selectedStay.id,
        unassignReason.trim() || undefined
      );

      setStays((prev) => prev.map((s) => (s.id === res.listing.id ? res.listing : s)));
      setUnassignModalOpen(false);
      showToast(res.message);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unassign host.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalCount = stays.length;
  const assignedCount = stays.filter((s) => s.hostId || s.assignmentStatus === 'assigned').length;
  const unassignedCount = stays.filter(
    (s) => !s.hostId || s.assignmentStatus === 'unassigned'
  ).length;
  const eligibleHostCount = eligibleHosts.length;

  const filteredHosts = eligibleHosts.filter((h) => {
    if (!hostSearchQuery.trim()) return true;
    const q = hostSearchQuery.toLowerCase();
    return (
      h.fullName.toLowerCase().includes(q) ||
      h.email.toLowerCase().includes(q) ||
      h.id.toLowerCase().includes(q)
    );
  });

  const selectedHostObj = eligibleHosts.find((h) => h.id === selectedHostId);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Toast Alert */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-forest-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-forest-700 animate-slide-up">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{successToast}</span>
          </div>
        )}

        {/* Top Header Card with Navigation Tabs */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-sand-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest-900 text-sand-100 flex items-center justify-center shadow-sm">
              <UserCheck className="w-6 h-6 text-sand-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded border border-forest-200">
                  Administrator Portal
                </span>
                <span className="text-xs text-charcoal-500">•</span>
                <span className="text-xs text-charcoal-600">Preloaded Homestays System</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-950 mt-1">
                Host Assignments
              </h1>
              <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
                Assign preloaded Uttarakhand research homestays to registered local hosts with strict authorization audit logs.
              </p>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center p-1 bg-sand-100 rounded-xl border border-sand-300">
            <Link
              to="/admin/verification"
              className="px-4 py-2 text-xs font-semibold text-charcoal-600 hover:text-forest-900 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Verification Queue</span>
            </Link>
            <div className="px-4 py-2 text-xs font-bold bg-white text-forest-900 rounded-lg shadow-sm border border-sand-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-forest-700" />
              <span>Host Assignments</span>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Total Homestays
            </div>
            <div className="text-2xl font-serif font-bold text-forest-950 mt-1">{totalCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Assigned to Hosts
            </div>
            <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
              {assignedCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Unassigned Leads
            </div>
            <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
              {unassignedCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand-300 shadow-sm">
            <div className="text-xs font-semibold text-clay-700 uppercase tracking-wider">
              Eligible Host Accounts
            </div>
            <div className="text-2xl font-serif font-bold text-clay-800 mt-1">
              {eligibleHostCount}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-sand-300 flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by homestay name, locality, or stay ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-sand-300 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-colors"
              />
            </div>

            {/* District Filter */}
            <div className="relative min-w-[160px]">
              <Filter className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-sand-300 text-charcoal-800 bg-white focus:outline-none focus:ring-2 focus:ring-forest-600 transition-colors"
              >
                <option value="">All Districts</option>
                <option value="Pithoragarh">Pithoragarh</option>
                <option value="Nainital">Nainital</option>
                <option value="Bageshwar">Bageshwar</option>
                <option value="Chamoli">Chamoli</option>
                <option value="Uttarkashi">Uttarkashi</option>
              </select>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-sand-100 rounded-xl border border-sand-200">
            {(['all', 'unassigned', 'assigned'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-forest-950 shadow-xs'
                    : 'text-charcoal-600 hover:text-forest-900'
                }`}
              >
                {st === 'all' ? 'All Stays' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table / Cards */}
        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-sand-300">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-forest-700 border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium text-charcoal-600">Loading homestays and assignment records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-1.5 text-xs font-semibold bg-forest-700 text-white rounded-lg hover:bg-forest-800"
            >
              Retry
            </button>
          </div>
        ) : stays.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-sand-300 space-y-3">
            <Home className="w-10 h-10 text-charcoal-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-forest-950">No Matching Homestays Found</h3>
            <p className="text-xs text-charcoal-600 max-w-md mx-auto">
              No homestay records matched your search query or filter selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stays.map((stay) => {
              const isAssigned = Boolean(stay.hostId || stay.assignmentStatus === 'assigned');
              const isVerified = stay.verificationStatus === 'verified';
              const isPending = stay.verificationStatus === 'verification_pending';

              return (
                <div
                  key={stay.id}
                  className="bg-white rounded-2xl border border-sand-300 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Top status badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Unassigned
                          </span>
                        )}

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sand-100 text-charcoal-700 border border-sand-200">
                          Preloaded
                        </span>
                      </div>

                      {/* Verification Status Tag */}
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-sand-100 text-charcoal-700 border-sand-200'
                        }`}
                      >
                        {stay.verificationStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Homestay Title & Locality */}
                    <div>
                      <h3 className="font-serif text-lg font-bold text-forest-950 line-clamp-1">
                        {stay.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-charcoal-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-clay-600 shrink-0" />
                        <span className="truncate">
                          {stay.locality}, {stay.district}
                        </span>
                      </div>
                    </div>

                    {/* Price and Details */}
                    <div className="flex items-center justify-between py-2 border-y border-sand-200 text-xs text-charcoal-700">
                      <div>
                        <span className="font-bold text-forest-900 text-sm">₹{stay.pricePerNight || 1800}</span>
                        <span className="text-charcoal-500"> / night</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">Up to {stay.guestCapacity?.maxGuests || 4} guests</span>
                      </div>
                    </div>

                    {/* Assigned Host Card or Unassigned Callout */}
                    {isAssigned ? (
                      <div className="bg-sand-50/80 rounded-xl p-3 border border-sand-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                            Assigned Host
                          </span>
                          {stay.assignmentHistory && stay.assignmentHistory.length > 0 && (
                            <button
                              onClick={() => setHistoryModalStay(stay)}
                              className="text-[10px] font-semibold text-forest-700 hover:text-forest-900 hover:underline flex items-center gap-1"
                            >
                              <History className="w-3 h-3" />
                              Audit Log ({stay.assignmentHistory.length})
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(stay.assignedHostName || 'H').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs text-charcoal-900 truncate">
                              {stay.assignedHostName || 'Host ID: ' + stay.hostId}
                            </div>
                            <div className="text-[11px] text-charcoal-600 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 text-charcoal-400 shrink-0" />
                              <span className="truncate">{stay.assignedHostEmail || 'No email registered'}</span>
                            </div>
                          </div>
                        </div>

                        {stay.assignedAt && (
                          <div className="text-[10px] text-charcoal-500 pt-1 border-t border-sand-200 flex items-center justify-between">
                            <span>Assigned: {new Date(stay.assignedAt).toLocaleDateString()}</span>
                            {stay.assignedByName && <span>by {stay.assignedByName}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Ready for assignment to an eligible local host.</span>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="p-4 bg-sand-50 border-t border-sand-200 flex items-center justify-between gap-2">
                    {isAssigned ? (
                      <>
                        <button
                          onClick={() => handleOpenReassign(stay)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-sand-300 text-charcoal-800 hover:bg-sand-100 hover:text-forest-900 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                          <span>Reassign</span>
                        </button>

                        <button
                          onClick={() => handleOpenUnassign(stay)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-clay-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Unassign</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenAssign(stay)}
                        className="w-full py-2 text-xs font-bold rounded-xl bg-forest-700 hover:bg-forest-800 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Assign to Registered Host</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal 1: Assign to Registered Host */}
        {assignModalOpen && selectedStay && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-sand-300 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest-950">
                      Assign Host to Homestay
                    </h2>
                    <p className="text-xs text-charcoal-600">{selectedStay.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {assignmentStep === 'select' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                      1. Select Eligible Registered Host
                    </label>
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search eligible hosts by name or email..."
                        value={hostSearchQuery}
                        onChange={(e) => setHostSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-sand-300 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 border border-sand-200 rounded-xl p-2 bg-sand-50/50">
                      {filteredHosts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-charcoal-500">
                          No active registered hosts found.
                        </div>
                      ) : (
                        filteredHosts.map((h) => {
                          const isSelected = selectedHostId === h.id;
                          return (
                            <div
                              key={h.id}
                              onClick={() => setSelectedHostId(h.id)}
                              className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-forest-50/80 border-forest-600 shadow-xs'
                                  : 'bg-white border-sand-200 hover:border-sand-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                      ? 'bg-forest-700 text-white'
                                      : 'bg-sand-200 text-charcoal-700'
                                  }`}
                                >
                                  {h.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-xs text-charcoal-900">
                                    {h.fullName}
                                  </div>
                                  <div className="text-[11px] text-charcoal-600">{h.email}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  Host
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                      2. Optional Note / Administrative Context
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Assigned following local cooperative verification meeting..."
                      value={assignmentReason}
                      onChange={(e) => setAssignmentReason(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-sand-300 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-sand-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-sand-300 text-charcoal-700 hover:bg-sand-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedHostId}
                      onClick={() => setAssignmentStep('confirm')}
                      className="px-5 py-2 text-xs font-bold rounded-lg bg-forest-700 hover:bg-forest-800 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <span>Review Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Confirmation Screen */
                <form onSubmit={handleExecuteAssign} className="space-y-4">
                  <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-200 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-forest-900">
                      Summary of Proposed Assignment
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[11px] text-charcoal-500">Homestay:</div>
                        <div className="font-semibold text-charcoal-900">{selectedStay.name}</div>
                        <div className="text-[11px] text-charcoal-600">
                          {selectedStay.locality}, {selectedStay.district}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-charcoal-500">Selected Host:</div>
                        <div className="font-semibold text-charcoal-900">
                          {selectedHostObj?.fullName}
                        </div>
                        <div className="text-[11px] text-charcoal-600">{selectedHostObj?.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Important Policy Notice */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Important Notice:</strong> Assigning this property grants the host portal
                      management rights but does <em>not</em> automatically verify their legal ownership.
                      The host must submit verification documents or Panchayat proof before the property
                      can accept direct tourist reservations.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-sand-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAssignmentStep('select')}
                      className="px-3 py-1.5 text-xs font-medium text-charcoal-600 hover:underline"
                    >
                      ← Back to Selection
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-sand-300 text-charcoal-700 hover:bg-sand-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-5 py-2 text-xs font-bold rounded-lg bg-forest-700 hover:bg-forest-800 text-white disabled:opacity-50 shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        {actionLoading ? 'Assigning...' : 'Confirm & Assign Host'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal 2: Reassign Host */}
        {reassignModalOpen && selectedStay && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-sand-300 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest-950">
                      Reassign Homestay Host
                    </h2>
                    <p className="text-xs text-charcoal-600">{selectedStay.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReassignModalOpen(false)}
                  className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reassignConfirmStep === 'select' ? (
                <div className="space-y-4">
                  {/* Current Host Banner */}
                  <div className="p-3 bg-sand-100 rounded-xl border border-sand-200 text-xs text-charcoal-700">
                    <span className="font-bold text-charcoal-900">Current Assigned Host: </span>
                    <span>{selectedStay.assignedHostName || selectedStay.hostId}</span> ({selectedStay.assignedHostEmail || 'No email'})
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                      Select New Eligible Host
                    </label>
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search eligible hosts..."
                        value={hostSearchQuery}
                        onChange={(e) => setHostSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-sand-300 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 border border-sand-200 rounded-xl p-2 bg-sand-50/50">
                      {filteredHosts
                        .filter((h) => h.id !== selectedStay.hostId)
                        .map((h) => {
                          const isSelected = selectedHostId === h.id;
                          return (
                            <div
                              key={h.id}
                              onClick={() => setSelectedHostId(h.id)}
                              className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-600 shadow-xs'
                                  : 'bg-white border-sand-200 hover:border-sand-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                      ? 'bg-blue-700 text-white'
                                      : 'bg-sand-200 text-charcoal-700'
                                  }`}
                                >
                                  {h.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-xs text-charcoal-900">
                                    {h.fullName}
                                  </div>
                                  <div className="text-[11px] text-charcoal-600">{h.email}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                      Reason for Reassignment * (Required for Audit Trail)
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Previous host transferred operational lease to family member..."
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-sand-300 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-sand-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReassignModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-sand-300 text-charcoal-700 hover:bg-sand-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedHostId || reassignReason.trim().length < 5}
                      onClick={() => setReassignConfirmStep('confirm')}
                      className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <span>Review Reassignment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleExecuteReassign} className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Confirm Host Reassignment
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[11px] text-charcoal-500">Current Host:</div>
                        <div className="font-semibold text-charcoal-900">
                          {selectedStay.assignedHostName || selectedStay.hostId}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-charcoal-500">New Host:</div>
                        <div className="font-semibold text-charcoal-900">
                          {selectedHostObj?.fullName}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-charcoal-700 pt-2 border-t border-blue-200">
                      <strong>Audit Reason:</strong> {reassignReason}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    ⚠️ <strong>Audit Notice:</strong> Reassigning a property transitions its verification status to <code>verification_pending</code>, ensuring the new host must re-verify authorization.
                  </div>

                  <div className="pt-3 border-t border-sand-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setReassignConfirmStep('select')}
                      className="px-3 py-1.5 text-xs font-medium text-charcoal-600 hover:underline"
                    >
                      ← Back
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReassignModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-sand-300 text-charcoal-700 hover:bg-sand-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50 transition-colors"
                      >
                        {actionLoading ? 'Reassigning...' : 'Confirm Reassignment'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal 3: Unassign Host */}
        {unassignModalOpen && selectedStay && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-sand-300 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest-950">
                      Remove Host Assignment
                    </h2>
                    <p className="text-xs text-charcoal-600">{selectedStay.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setUnassignModalOpen(false)}
                  className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteUnassign} className="space-y-4">
                <p className="text-xs text-charcoal-700 leading-relaxed">
                  Are you sure you want to remove the host assignment for{' '}
                  <strong>{selectedStay.assignedHostName || selectedStay.hostId}</strong>?
                  The homestay will be returned to <strong>Unassigned Draft</strong> status and will no longer accept bookings.
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Reason for Unassigning (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Host requested property release..."
                    value={unassignReason}
                    onChange={(e) => setUnassignReason(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-sand-300 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUnassignModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-sand-300 text-charcoal-700 hover:bg-sand-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-red-700 hover:bg-red-800 text-white disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? 'Removing...' : 'Confirm Unassign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Assignment History / Audit Log */}
        {historyModalStay && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-sand-300 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest-950">
                      Assignment Audit History
                    </h2>
                    <p className="text-xs text-charcoal-600">{historyModalStay.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryModalStay(null)}
                  className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3">
                {(!historyModalStay.assignmentHistory || historyModalStay.assignmentHistory.length === 0) ? (
                  <p className="text-center text-xs text-charcoal-500 py-6">
                    No historical assignment events recorded for this property.
                  </p>
                ) : (
                  historyModalStay.assignmentHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-sand-200 bg-sand-50/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                            item.action === 'assigned'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.action === 'reassigned'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.action}
                        </span>
                        <span className="text-[11px] text-charcoal-500">
                          {new Date(item.assignedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-charcoal-900 font-medium">
                        Host: <strong>{item.hostName}</strong> ({item.hostEmail})
                      </div>
                      <div className="text-[11px] text-charcoal-600">
                        Admin: {item.assignedByName} ({item.assignedBy})
                      </div>
                      {item.reason && (
                        <div className="text-[11px] text-charcoal-700 italic pt-1 border-t border-sand-200">
                          &ldquo;{item.reason}&rdquo;
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-sand-200 flex justify-end">
                <button
                  onClick={() => setHistoryModalStay(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-forest-700 text-white hover:bg-forest-800"
                >
                  Close Audit Log
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
