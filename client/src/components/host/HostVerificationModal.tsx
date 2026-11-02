import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  MapPin,
  IndianRupee,
  Upload,
  FileText,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Tag,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  AccommodationRecord,
  PropertyRelationship,
  VerificationDocumentType,
  SubmitHostAuthorizationPayload,
} from '../../types';
import { apiService } from '../../services/api';

interface HostVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (stay: AccommodationRecord) => void;
  stay: AccommodationRecord;
  onOpenEditDetails?: () => void;
}

interface UploadedFileItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: VerificationDocumentType;
  dataUrl: string;
}

const RELATIONSHIP_OPTIONS: Array<{
  value: PropertyRelationship;
  label: string;
  description: string;
  recommendedDocs: string;
}> = [
  {
    value: 'owner',
    label: 'Property Owner',
    description: 'I am the registered legal owner or direct titleholder of this property.',
    recommendedDocs:
      'Recommended: Electricity/water bill in your name, property tax receipt, or land/house registry document.',
  },
  {
    value: 'family_member',
    label: 'Family Member of Property Owner',
    description:
      'I belong to the immediate family of the registered property owner (e.g., spouse, parent, child).',
    recommendedDocs:
      'Recommended: Signed owner consent/NOC, family ID/ration card, plus a utility bill in owner’s name.',
  },
  {
    value: 'authorized_manager',
    label: 'Authorized Property Manager',
    description:
      'I am professionally appointed or leased by the owner to manage hospitality operations.',
    recommendedDocs:
      'Recommended: Signed management agreement, operator contract, or formal power of attorney / NOC.',
  },
  {
    value: 'other',
    label: 'Other Management Arrangement',
    description:
      'Community cooperative, village panchayat caretaker, or custom regional stewardship.',
    recommendedDocs:
      'Recommended: Village Panchayat recommendation, cooperative resolution, or custom authorization agreement.',
  },
];

export const HostVerificationModal: React.FC<HostVerificationModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  stay,
  onOpenEditDetails,
}) => {
  const existingAuth = stay.hostAuthorization;

  // Form State
  const [relationship, setRelationship] = useState<PropertyRelationship>(
    existingAuth?.relationship || 'owner'
  );
  const [relationshipExplanation, setRelationshipExplanation] = useState<string>(
    existingAuth?.relationshipExplanation || ''
  );
  const [notes, setNotes] = useState<string>(existingAuth?.notes || '');
  const [declarationConfirmed, setDeclarationConfirmed] = useState<boolean>(false);

  // Document Uploads State
  const [pendingFiles, setPendingFiles] = useState<UploadedFileItem[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocumentType>(
    'ownership_document'
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file selection and convert to Base64 dataUrl
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError('Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG document.');
      return;
    }

    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of 5MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newItem: UploadedFileItem = {
        id: `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType: selectedDocType,
        dataUrl,
      };

      setPendingFiles((prev) => [...prev, newItem]);
      // reset file input
      e.target.value = '';
    };

    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const currentOption = RELATIONSHIP_OPTIONS.find((opt) => opt.value === relationship);

  // Check if admin requested additional info
  const hasInfoRequested =
    stay.verificationStatus === 'verification_pending' &&
    stay.verificationNotes?.toLowerCase().includes('additional');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (relationship === 'other' && relationshipExplanation.trim().length < 3) {
      setSubmissionError('Please provide a brief explanation for your relationship with the property.');
      return;
    }

    if (!declarationConfirmed) {
      setSubmissionError(
        'You must confirm the declaration checkbox to submit verification documents.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload: SubmitHostAuthorizationPayload = {
        relationship,
        relationshipExplanation:
          relationship === 'other' ? relationshipExplanation.trim() : undefined,
        notes: notes.trim() || undefined,
        declarationConfirmed: true,
        documents: pendingFiles.map((f) => ({
          fileName: f.fileName,
          fileType: f.fileType,
          fileSize: f.fileSize,
          documentType: f.documentType,
          dataUrl: f.dataUrl,
        })),
      };

      const updated = await apiService.submitListingForVerification(stay.id, payload);
      onSaved(updated);
      onClose();
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Unable to submit verification request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-6 shadow-2xl border border-sand-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-forest-900 to-forest-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-700/80 border border-forest-600 flex items-center justify-center text-sand-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight">
                Host Authorization & Property Verification
              </h2>
              <p className="text-xs text-sand-300">
                Establish your authorization to represent and operate this preloaded homestay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-forest-700/80 text-sand-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-8 flex-1 text-charcoal-800">
          {/* Admin Feedback Banner (if info requested or rejected) */}
          {stay.verificationNotes && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                hasInfoRequested
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : stay.verificationStatus === 'rejected_or_inactive'
                  ? 'bg-red-50/90 border-red-300 text-red-950'
                  : 'bg-sand-100 border-sand-300 text-charcoal-800'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {hasInfoRequested
                    ? 'Administrator Action Required: Additional Information Requested'
                    : 'Administrator Review Feedback'}
                </div>
                <p className="leading-relaxed">{stay.verificationNotes}</p>
                {hasInfoRequested && (
                  <p className="text-[11px] text-amber-800 font-medium pt-1">
                    Please upload the requested document or clarify below. Your existing property details
                    are preserved.
                  </p>
                )}
              </div>
            </div>
          )}

          {submissionError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: EXISTING PROPERTY INFORMATION (Preloaded / Read-Only Summary)   */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-sand-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-serif text-base font-bold text-forest-950">
                  Existing Property Information
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Pre-populated from Database
              </span>
            </div>

            <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      <Tag className="w-3 h-3" />
                      Admin-Assigned Preloaded Stay
                    </span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-charcoal-500 bg-sand-200/80 px-2 py-0.5 rounded-md">
                      {stay.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="font-serif text-xl font-bold text-forest-950 pt-1">
                    {stay.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-charcoal-600">
                    <MapPin className="w-3.5 h-3.5 text-clay-700 shrink-0" />
                    <span>
                      {stay.address}, {stay.locality}, {stay.district}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-sand-200">
                  <div className="text-[10px] uppercase font-semibold text-charcoal-500 tracking-wider">
                    Nightly Rate
                  </div>
                  <div className="font-serif text-xl font-bold text-forest-950 flex items-center sm:justify-end gap-0.5">
                    <IndianRupee className="w-4 h-4 text-forest-700" />
                    <span>{stay.pricePerNight?.toLocaleString('en-IN') || 1800}</span>
                    <span className="text-xs text-charcoal-500 font-normal"> / night</span>
                  </div>
                  <div className="text-[11px] text-charcoal-600 flex items-center sm:justify-end gap-2 mt-1">
                    <span>Max {stay.guestCapacity?.maxGuests || 4} Guests</span>
                    <span>•</span>
                    <span>{stay.guestCapacity?.roomCount || 2} Rooms</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-sand-200/80 text-xs text-charcoal-700 leading-relaxed">
                <span className="font-semibold text-charcoal-900">Description: </span>
                {stay.description}
              </div>

              {/* Amenities */}
              {stay.amenities && stay.amenities.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
                    Recorded Amenities:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stay.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2.5 py-1 bg-white border border-sand-300 rounded-lg text-charcoal-700 shadow-2xs"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Images Gallery */}
              {stay.images && stay.images.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
                    Existing Property Photographs ({stay.images.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stay.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${stay.name} preview ${idx + 1}`}
                        className="w-16 h-12 object-cover rounded-lg border border-sand-300 shadow-2xs"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Edit Details Link */}
              {onOpenEditDetails && (
                <div className="pt-2 border-t border-sand-200/80 flex items-center justify-between text-xs">
                  <span className="text-charcoal-500 italic">
                    Need to update description, rates, or amenities?
                  </span>
                  <button
                    type="button"
                    onClick={onOpenEditDetails}
                    className="text-forest-700 hover:text-forest-900 font-semibold underline flex items-center gap-1"
                  >
                    <span>Edit Property Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 2: HOST AUTHORIZATION & SUPPORTING EVIDENCE                       */}
          {/* ========================================================================= */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 border-b border-sand-200 pb-2">
              <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-serif text-base font-bold text-forest-950">
                Host Authorization & Evidence
              </h3>
            </div>

            {/* A. Relationship with the Property */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                A. Your Relationship with This Homestay <span className="text-red-600">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RELATIONSHIP_OPTIONS.map((opt) => {
                  const isSelected = relationship === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setRelationship(opt.value)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-forest-700 bg-forest-50/70 ring-2 ring-forest-700 shadow-sm'
                          : 'border-sand-300 hover:border-forest-400 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif text-sm font-bold text-forest-950">
                            {opt.label}
                          </span>
                          <input
                            type="radio"
                            name="relationship"
                            checked={isSelected}
                            onChange={() => setRelationship(opt.value)}
                            className="text-forest-700 focus:ring-forest-600 h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-charcoal-600 leading-normal">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* If "other" relationship selected, show explanation input */}
              {relationship === 'other' && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-semibold text-charcoal-700">
                    Please describe your arrangement / role <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={relationshipExplanation}
                    onChange={(e) => setRelationshipExplanation(e.target.value)}
                    placeholder="e.g. Appointed caretaker under Sarmoli Mahila Van Panchayat Committee"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-sand-300 focus:ring-2 focus:ring-forest-700 focus:outline-none bg-white"
                  />
                </div>
              )}

              {/* Dynamic Guidance Pill based on relationship */}
              {currentOption && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Guidance for {currentOption.label}:</strong> {currentOption.recommendedDocs}
                  </div>
                </div>
              )}
            </div>

            {/* B. Supporting Evidence Uploads */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                B. Upload Supporting Documents (PDF, JPG, JPEG, PNG)
              </label>

              {/* Document Type Selector & Dropzone */}
              <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Select Document Category:
                    </label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value as VerificationDocumentType)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-sand-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                    >
                      <option value="ownership_document">Property Ownership Document (Deed, Tax, Bill)</option>
                      <option value="owner_authorization">Owner Written Authorization / NOC / Consent</option>
                      <option value="other_evidence">Other Operational / Panchayati Permission</option>
                    </select>
                  </div>

                  <div className="sm:self-end">
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Choose File...</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="text-[11px] text-charcoal-500">
                  Accepted formats: PDF, JPG, JPEG, PNG • Maximum size: 5MB per document
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Currently Selected Pending Uploads */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-charcoal-700">
                    Documents Ready to Submit ({pendingFiles.length}):
                  </div>
                  <div className="space-y-2">
                    {pendingFiles.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl bg-white border border-sand-300 shadow-2xs flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-forest-700 shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-forest-950 truncate">{f.fileName}</div>
                            <div className="text-[11px] text-charcoal-500">
                              {(f.fileSize / 1024).toFixed(0)} KB •{' '}
                              <span className="capitalize font-medium text-amber-800">
                                {f.documentType.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePendingFile(f.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previously Uploaded Documents from Database (if re-submitting) */}
              {existingAuth?.documents && existingAuth.documents.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-charcoal-600">
                    Previously Stored Documents ({existingAuth.documents.length}):
                  </div>
                  <div className="space-y-1.5">
                    {existingAuth.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-sand-100/70 border border-sand-200 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="font-medium truncate">{doc.fileName}</span>
                          <span className="text-[10px] text-charcoal-500 uppercase tracking-wider">
                            ({doc.documentType.replace(/_/g, ' ')})
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          Archived in DB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-charcoal-700">
                  Additional Notes or Supporting Explanation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide any additional context or certificates regarding your homestay management..."
                  className="w-full text-xs p-3 rounded-xl border border-sand-300 focus:ring-2 focus:ring-forest-700 focus:outline-none bg-white"
                />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 3: DECLARATION AND SUBMISSION                                     */}
          {/* ========================================================================= */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-sand-200 pb-2">
              <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="font-serif text-base font-bold text-forest-950">
                Declaration & Verification Submission
              </h3>
            </div>

            {/* Mandatory Declaration Checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300/80 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationConfirmed}
                  onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-forest-700 rounded border-sand-300 focus:ring-forest-600"
                />
                <span className="text-xs font-semibold text-charcoal-900 leading-relaxed">
                  "I confirm that the information and supporting documents submitted are genuine and that
                  I am authorized to manage or represent this property."
                </span>
              </label>
              <p className="text-[11px] text-charcoal-600 pl-7">
                Under Uttarakhand sustainable tourism rules, platform administrators will review your
                submission before publishing the property for tourist bookings.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-sand-300 text-charcoal-700 hover:bg-sand-100 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !declarationConfirmed}
                className="px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting for Verification...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit for Verification</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};
