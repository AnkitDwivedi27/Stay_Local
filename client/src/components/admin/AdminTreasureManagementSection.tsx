import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Eye,
  Edit3,
  Plus,
  X,
  MapPin,
  Tag,
  FileSpreadsheet,
  Ban,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  LocalTreasureRecord,
  CreateTreasurePayload,
  UpdateTreasurePayload,
  TreasureCategory,
  TreasureVerificationStatus,
  TreasureArtisanType,
} from '../../types';
import { apiService } from '../../services/api';

const CATEGORY_OPTIONS: Array<{ value: TreasureCategory; label: string }> = [
  { value: 'woollens_textiles', label: 'Woollens & Handlooms' },
  { value: 'traditional_art', label: 'Folk & Sacred Art' },
  { value: 'handicrafts_carvings', label: 'Handicrafts & Carvings' },
  { value: 'local_food_produce', label: 'Indigenous Mountain Produce' },
  { value: 'cultural_heritage', label: 'Cultural Heritage' },
];

const ARTISAN_TYPES: Array<{ value: TreasureArtisanType; label: string }> = [
  { value: 'individual_artisan', label: 'Individual Master Artisan' },
  { value: 'artisan_collective', label: 'Artisan Self-Help Collective / SHG' },
  { value: 'village_cluster', label: 'Village Craft Cluster' },
  { value: 'heritage_workshop', label: 'Heritage Workshop / Museum' },
  { value: 'local_shop', label: 'Local Village Shop / Directory Lead' },
];

export const AdminTreasureManagementSection: React.FC = () => {
  const [treasures, setTreasures] = useState<LocalTreasureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [inspectModalTreasure, setInspectModalTreasure] = useState<LocalTreasureRecord | null>(null);
  const [editingTreasure, setEditingTreasure] = useState<LocalTreasureRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit / Create Form State
  const [formData, setFormData] = useState<Partial<CreateTreasurePayload>>({
    title: '',
    craftName: '',
    category: 'woollens_textiles',
    artisanOrShopName: '',
    artisanType: 'individual_artisan',
    district: 'Pithoragarh',
    locality: '',
    village: '',
    address: '',
    description: '',
    culturalSignificance: '',
    productionProcess: '',
    visitingInfo: '',
    sourceReference: '',
    researchNotes: '',
    nearbyClusters: [],
    images: [],
    contact: {
      contactPerson: '',
      phone: '',
      email: '',
      isPubliclyVerified: false,
    },
    verificationStatus: 'unverified_lead',
    isActive: true,
  });

  const loadTreasures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.adminGetAllTreasures();
      setTreasures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local treasures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTreasures();
  }, [loadTreasures]);

  const handleReviewStatus = async (
    id: string,
    action: 'approve' | 'reject' | 'deactivate' | 'activate',
    defaultNotes?: string
  ) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const notes = defaultNotes || window.prompt(`Enter audit notes for ${action}:`) || undefined;
      const updated = await apiService.adminReviewTreasure(id, action, notes);
      setTreasures((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (inspectModalTreasure?.id === id) {
        setInspectModalTreasure(updated);
      }
      setActionSuccess(`Listing updated to ${updated.verificationStatus}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionError(null);
      setActionSuccess(null);

      if (isCreating) {
        const created = await apiService.adminCreateTreasure(formData as CreateTreasurePayload);
        setTreasures((prev) => [created, ...prev]);
        setActionSuccess('Local treasure created successfully.');
      } else if (editingTreasure) {
        const updated = await apiService.adminUpdateTreasure(
          editingTreasure.id,
          formData as UpdateTreasurePayload
        );
        setTreasures((prev) => prev.map((t) => (t.id === editingTreasure.id ? updated : t)));
        setActionSuccess('Local treasure listing updated successfully.');
      }

      setIsCreating(false);
      setEditingTreasure(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save treasure.');
    }
  };

  const openEditModal = (treasure: LocalTreasureRecord) => {
    setEditingTreasure(treasure);
    setIsCreating(false);
    setFormData({
      title: treasure.title,
      craftName: treasure.craftName,
      category: treasure.category,
      artisanOrShopName: treasure.artisanOrShopName,
      artisanType: treasure.artisanType,
      district: treasure.district,
      locality: treasure.locality,
      village: treasure.village || '',
      address: treasure.address || '',
      description: treasure.description,
      culturalSignificance: treasure.culturalSignificance,
      productionProcess: treasure.productionProcess,
      visitingInfo: treasure.visitingInfo || '',
      sourceReference: treasure.sourceReference,
      researchNotes: treasure.researchNotes || '',
      nearbyClusters: [...treasure.nearbyClusters],
      images: [...treasure.images],
      contact: {
        contactPerson: treasure.contact?.contactPerson || '',
        phone: treasure.contact?.phone || '',
        email: treasure.contact?.email || '',
        isPubliclyVerified: Boolean(treasure.contact?.isPubliclyVerified),
      },
      verificationStatus: treasure.verificationStatus,
      isActive: treasure.isActive,
    });
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingTreasure(null);
    setFormData({
      title: '',
      craftName: '',
      category: 'woollens_textiles',
      artisanOrShopName: '',
      artisanType: 'individual_artisan',
      district: 'Pithoragarh',
      locality: '',
      village: '',
      address: '',
      description: '',
      culturalSignificance: '',
      productionProcess: '',
      visitingInfo: '',
      sourceReference: 'StayLocal Excel Field Research',
      researchNotes: '',
      nearbyClusters: [],
      images: ['https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80'],
      contact: {
        contactPerson: '',
        phone: '',
        email: '',
        isPubliclyVerified: false,
      },
      verificationStatus: 'unverified_lead',
      isActive: true,
    });
  };

  // Filter list
  const filteredTreasures = treasures.filter((t) => {
    if (statusFilter !== 'all' && t.verificationStatus !== statusFilter) return false;
    if (districtFilter && t.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.craftName.toLowerCase().includes(q) ||
        t.artisanOrShopName.toLowerCase().includes(q) ||
        t.locality.toLowerCase().includes(q) ||
        t.sourceReference.toLowerCase().includes(q) ||
        (t.researchNotes && t.researchNotes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar & Filter Tabs */}
      <div className="bg-white rounded-2xl p-5 border border-sand-300 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 mb-1">
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>Offline Discovery Governance</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-forest-950">
              Local Treasures & Artisan Moderation
            </h3>
            <p className="text-xs text-charcoal-600">
              Audit Excel research leads, manage verified Himalayan artisans, and protect visitor privacy.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Local Treasure / Lead</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-sand-200 pb-3">
          {[
            { id: 'all', label: `All Entries (${treasures.length})`, icon: Filter },
            {
              id: 'unverified_lead',
              label: `Unverified Research Leads (${treasures.filter((t) => t.verificationStatus === 'unverified_lead').length})`,
              icon: Clock,
            },
            {
              id: 'verified',
              label: `Verified Public Artisans (${treasures.filter((t) => t.verificationStatus === 'verified').length})`,
              icon: CheckCircle2,
            },
            {
              id: 'draft',
              label: `Draft / Audit Needed (${treasures.filter((t) => t.verificationStatus === 'draft').length})`,
              icon: AlertTriangle,
            },
            {
              id: 'inactive',
              label: `Inactive (${treasures.filter((t) => t.verificationStatus === 'inactive' || !t.isActive).length})`,
              icon: Ban,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-sand-50 text-charcoal-700 hover:bg-sand-100 border border-sand-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & District / Category Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-charcoal-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search craft, artisan, village, or Excel source..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
          >
            <option value="">All Uttarakhand Districts</option>
            <option value="Pithoragarh">Pithoragarh (Munsiyari & Johar)</option>
            <option value="Nainital">Nainital (Bhimtal & Sattal)</option>
            <option value="Bageshwar">Bageshwar (Kausani & Tamta)</option>
            <option value="Almora">Almora</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
          >
            <option value="">All Craft Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-sand-300">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-700 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium text-charcoal-600">Loading local treasures...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      ) : filteredTreasures.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-sand-300 space-y-2">
          <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
          <h4 className="font-serif text-lg font-bold text-forest-950">No Listings Match Filter</h4>
          <p className="text-xs text-charcoal-600">Try modifying your search or status filter options.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-sand-200 text-charcoal-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Craft & Title</th>
                  <th className="px-5 py-3.5">Artisan / Workshop</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Excel Research Source</th>
                  <th className="px-5 py-3.5">Status & Privacy</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {filteredTreasures.map((treasure) => {
                  return (
                    <tr key={treasure.id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-charcoal-900 text-sm">{treasure.title}</div>
                        <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3 text-purple-600" />
                          <span className="capitalize">{treasure.craftName}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-charcoal-800">{treasure.artisanOrShopName}</div>
                        <div className="text-[10px] text-charcoal-500 capitalize">
                          {treasure.artisanType.replace('_', ' ')}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-charcoal-800">
                          <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                          <span>
                            {treasure.village ? `${treasure.village}, ` : ''}
                            {treasure.locality}
                          </span>
                        </div>
                        <div className="text-[11px] text-charcoal-500 font-medium">
                          {treasure.district} District
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                          <span className="truncate">{treasure.sourceReference}</span>
                        </div>
                        {treasure.researchNotes && (
                          <div className="text-[11px] text-charcoal-500 line-clamp-1 mt-1 italic">
                            "{treasure.researchNotes}"
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {treasure.verificationStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified Master
                            </span>
                          ) : treasure.verificationStatus === 'unverified_lead' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Unverified Lead
                            </span>
                          ) : treasure.verificationStatus === 'draft' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sand-200 text-charcoal-700 border border-sand-300">
                              <AlertTriangle className="w-3 h-3" />
                              Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
                              <Ban className="w-3 h-3" />
                              Inactive
                            </span>
                          )}

                          {treasure.contact?.phone && (
                            <div className="text-[10px] text-charcoal-500 flex items-center gap-1">
                              {treasure.contact.isPubliclyVerified ? (
                                <span className="text-emerald-700 flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Public Contact
                                </span>
                              ) : (
                                <span className="text-amber-700 flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5" /> Private Lead (Hidden)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectModalTreasure(treasure)}
                            className="p-1.5 rounded-lg border border-sand-300 hover:bg-sand-100 text-charcoal-700 transition-colors"
                            title="Inspect & Review Lead"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(treasure)}
                            className="p-1.5 rounded-lg border border-sand-300 hover:bg-sand-100 text-purple-700 transition-colors"
                            title="Edit Listing Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {treasure.verificationStatus !== 'verified' ? (
                            <button
                              type="button"
                              onClick={() => handleReviewStatus(treasure.id, 'approve', 'Approved by administrator')}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                              title="Approve to make public"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReviewStatus(treasure.id, 'deactivate', 'Deactivated by administrator')}
                              className="px-2 py-1 rounded-lg bg-sand-200 hover:bg-sand-300 text-charcoal-800 font-semibold text-[11px] transition-colors"
                              title="Deactivate listing"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect / Review Modal */}
      {inspectModalTreasure && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-sand-300 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white p-6 relative">
              <button
                onClick={() => setInspectModalTreasure(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-purple-200 border border-white/30 mb-2">
                <FileSpreadsheet className="w-3 h-3" />
                <span>Source Research Audit</span>
              </div>
              <h3 className="font-serif text-2xl font-bold">{inspectModalTreasure.title}</h3>
              <p className="text-xs text-purple-200 mt-1">
                {inspectModalTreasure.artisanOrShopName} · {inspectModalTreasure.locality}, {inspectModalTreasure.district}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-charcoal-700">
              {/* Spreadsheet Citation */}
              <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                  Excel Spreadsheet Source Reference
                </span>
                <div className="font-semibold text-charcoal-900 text-xs">
                  {inspectModalTreasure.sourceReference}
                </div>
                {inspectModalTreasure.researchNotes && (
                  <p className="text-charcoal-600 text-[11px] italic mt-1">
                    "{inspectModalTreasure.researchNotes}"
                  </p>
                )}
              </div>

              {/* Status and Privacy */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Verification & Privacy Enforcement
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-charcoal-800">Status:</span>
                  <span className="capitalize font-bold text-amber-900">{inspectModalTreasure.verificationStatus}</span>
                </div>
                <p className="text-[11px] text-amber-950/80">
                  {inspectModalTreasure.contact?.isPubliclyVerified
                    ? '✓ Contact details are verified and visible to tourists.'
                    : '⚠ Unverified research lead: Contact phone and email are stripped from tourist responses to safeguard privacy.'}
                </p>
              </div>

              {/* Contact Lead Details */}
              {inspectModalTreasure.contact && (
                <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                    Contact / Lead Information
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-charcoal-500 block text-[10px]">Contact Person:</span>
                      <span className="font-medium">{inspectModalTreasure.contact.contactPerson || 'None specified'}</span>
                    </div>
                    <div>
                      <span className="text-charcoal-500 block text-[10px]">Phone Number:</span>
                      <span className="font-medium">{inspectModalTreasure.contact.phone || 'None specified'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description & Cultural Significance */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                  Cultural Significance & Story
                </span>
                <p className="leading-relaxed bg-sand-50 p-3 rounded-xl border border-sand-200">
                  {inspectModalTreasure.culturalSignificance}
                </p>
              </div>

              {/* Production Process */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                  Production Process
                </span>
                <p className="leading-relaxed bg-sand-50 p-3 rounded-xl border border-sand-200">
                  {inspectModalTreasure.productionProcess}
                </p>
              </div>

              {/* Audit Action Buttons */}
              <div className="pt-3 border-t border-sand-200 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleReviewStatus(inspectModalTreasure.id, 'approve', 'Audited and approved as verified')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Approve as Verified Master
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewStatus(inspectModalTreasure.id, 'reject', 'Needs further field verification')}
                  className="px-4 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-charcoal-800 font-semibold text-xs transition-colors"
                >
                  Move to Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewStatus(inspectModalTreasure.id, 'deactivate', 'Deactivated by audit')}
                  className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-xs transition-colors"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Form Modal */}
      {(isCreating || editingTreasure) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-sand-300 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-forest-900 to-forest-800 text-white p-6 relative">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingTreasure(null);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif text-2xl font-bold">
                {isCreating ? 'Add New Local Treasure' : `Edit: ${editingTreasure?.title}`}
              </h3>
              <p className="text-xs text-sand-200 mt-1">
                Maintain accurate research references and verified local artisan profiles.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Listing Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="e.g. Darkot Handwoven Sheep Wool & Pashmina Shawls"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Craft Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.craftName || ''}
                    onChange={(e) => setFormData({ ...formData, craftName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="e.g. Pashmina & Sheep Wool Handlooms"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TreasureCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Artisan / Workshop Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.artisanOrShopName || ''}
                    onChange={(e) => setFormData({ ...formData, artisanOrShopName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="e.g. Darkot Village Weavers Collective"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Artisan Type</label>
                  <select
                    value={formData.artisanType}
                    onChange={(e) => setFormData({ ...formData, artisanType: e.target.value as TreasureArtisanType })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    {ARTISAN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Locality *</label>
                  <input
                    type="text"
                    required
                    value={formData.locality || ''}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Village</label>
                  <input
                    type="text"
                    value={formData.village || ''}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Full Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Spreadsheet Audit Reference */}
              <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200 space-y-2">
                <span className="font-bold text-charcoal-800 block text-xs">Spreadsheet Audit Reference</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-charcoal-700">Source Reference *</label>
                    <input
                      type="text"
                      required
                      value={formData.sourceReference || ''}
                      onChange={(e) => setFormData({ ...formData, sourceReference: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                      placeholder="e.g. StayLocal_Munsiyari_Homestay_Research.xlsx - Sheet4"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-charcoal-700">Research Audit Notes</label>
                    <input
                      type="text"
                      value={formData.researchNotes || ''}
                      onChange={(e) => setFormData({ ...formData, researchNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                      placeholder="e.g. Documented in Uttarakhand Tourism master plan"
                    />
                  </div>
                </div>
              </div>

              {/* Description & Cultural Significance */}
              <div className="space-y-1">
                <label className="font-semibold text-charcoal-700">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-charcoal-700">Origin Story & Cultural Significance *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.culturalSignificance || ''}
                  onChange={(e) => setFormData({ ...formData, culturalSignificance: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-charcoal-700">Traditional Production Process *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.productionProcess || ''}
                  onChange={(e) => setFormData({ ...formData, productionProcess: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-charcoal-700">Visiting Information & Hours</label>
                <input
                  type="text"
                  value={formData.visitingInfo || ''}
                  onChange={(e) => setFormData({ ...formData, visitingInfo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="e.g. Open daily 9:00 AM - 5:00 PM. Visitors can watch pit looms."
                />
              </div>

              {/* Contact Lead & Privacy Toggle */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <span className="font-bold text-amber-900 block text-xs">Artisan Contact & Privacy Controls</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-charcoal-700">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact?.contactPerson || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact: { ...formData.contact!, contactPerson: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-charcoal-700">Phone</label>
                    <input
                      type="text"
                      value={formData.contact?.phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact: { ...formData.contact!, phone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-charcoal-700">Email</label>
                    <input
                      type="text"
                      value={formData.contact?.email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact: { ...formData.contact!, email: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.contact?.isPubliclyVerified)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: { ...formData.contact!, isPubliclyVerified: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-purple-700 focus:ring-purple-500"
                  />
                  <span className="font-medium text-charcoal-700 text-xs">
                    Mark contact as publicly verified (If unchecked, phone and email remain strictly private from tourists)
                  </span>
                </label>
              </div>

              {/* Status and Active Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700">Verification Status</label>
                  <select
                    value={formData.verificationStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationStatus: e.target.value as TreasureVerificationStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    <option value="unverified_lead">Unverified Research Lead (Hidden from tourists)</option>
                    <option value="verified">Verified (Live in destination discovery)</option>
                    <option value="draft">Draft / Audit Needed</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isActive)}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-700 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-charcoal-800 text-xs">Listing is Active</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-sand-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTreasure(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-sand-300 text-charcoal-700 hover:bg-sand-100 font-semibold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  {isCreating ? 'Create Treasure Listing' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
