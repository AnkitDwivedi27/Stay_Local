/**
 * StayLocal Domain Types & Interfaces
 * Focused on Uttarakhand Community-Led Tourism & Homestay Discovery
 */

export type VerificationStatus =
  | 'unverified_lead'
  | 'verification_pending'
  | 'verified'
  | 'rejected_or_inactive';

export type PublicationStatus = 'draft' | 'published' | 'archived';

export type AccommodationCategory =
  | 'village_homestay'
  | 'heritage_farmstay'
  | 'eco_lodge'
  | 'mountain_cottage'
  | 'bed_and_breakfast';

export type LeadType =
  | 'direct_homestay'
  | 'community_cooperative'
  | 'local_host'
  | 'directory_entry';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface ContactDetails {
  phone?: string;
  email?: string;
  contactPerson?: string;
  isPubliclyListed: boolean;
}

export type AssignmentStatus = 'unassigned' | 'assigned';

export interface AssignmentHistoryItem {
  hostId: string;
  hostName: string;
  hostEmail: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
  action: 'assigned' | 'reassigned' | 'unassigned';
  reason?: string;
}

export type PropertyRelationship =
  | 'owner'
  | 'family_member'
  | 'authorized_manager'
  | 'other';

export type VerificationDocumentType =
  | 'ownership_document'
  | 'owner_authorization'
  | 'other_evidence';

export interface HostVerificationDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: VerificationDocumentType;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface HostAuthorizationSubmission {
  relationship: PropertyRelationship;
  relationshipExplanation?: string;
  notes?: string;
  declarationConfirmed: boolean;
  declaredAt: string;
  submittedAt: string;
  documents: HostVerificationDocument[];
}

export interface SubmitHostAuthorizationPayload {
  relationship: PropertyRelationship;
  relationshipExplanation?: string;
  notes?: string;
  declarationConfirmed: boolean;
  documents?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    documentType: VerificationDocumentType;
    dataUrl: string;
  }>;
}

export interface VerificationHistoryItem {
  decision: 'submitted' | 'approved' | 'rejected' | 'suspended' | 'info_requested';
  reason?: string;
  reviewedBy?: string;
  reviewerName?: string;
  timestamp: string;
}

export interface AccommodationRecord {
  id: string;
  name: string;
  description: string;
  destinationId?: string;
  district: string;
  locality: string;
  address: string;
  coordinates?: GeoCoordinates;
  category: AccommodationCategory;
  leadType?: LeadType;
  contactDetails?: ContactDetails;
  localSpecialties: string[];
  dataSource: string;
  sourceReference?: string;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  verificationNotes?: string;
  nextVerificationStep?: string;
  guestCapacity?: {
    maxGuests?: number;
    roomCount?: number;
  };
  pricePerNight?: number;
  hostId?: string;
  isPreloaded?: boolean;
  assignmentStatus?: AssignmentStatus;
  assignedAt?: string;
  assignedBy?: string;
  assignedByName?: string;
  assignedHostId?: string;
  assignedHostName?: string;
  assignedHostEmail?: string;
  assignmentHistory?: AssignmentHistoryItem[];
  amenities?: string[];
  images?: string[];
  imagePlaceholder?: string;
  submissionEvidence?: string;
  hostAuthorization?: HostAuthorizationSubmission;
  accessibilityNotes?: string;
  travelTip?: string;
  verificationHistory?: VerificationHistoryItem[];
  confirmationLock?: boolean;
  confirmationLockExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleHostRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  bio?: string;
  status: string;
  role: string;
  createdAt?: string;
}

export interface AssignHostPayload {
  stayId: string;
  hostId: string;
  reason?: string;
}

export interface ReassignHostPayload {
  hostId: string;
  reason: string;
}

export interface UnassignHostPayload {
  reason?: string;
}

export interface CreateListingPayload {
  name: string;
  description: string;
  destinationId?: string;
  district: string;
  locality: string;
  address: string;
  category: AccommodationCategory;
  pricePerNight: number;
  guestCapacity: {
    maxGuests: number;
    roomCount?: number;
  };
  amenities?: string[];
  localSpecialties?: string[];
  accessibilityNotes?: string;
  travelTip?: string;
  submissionEvidence?: string;
  contactDetails?: ContactDetails;
  images?: string[];
  submitForVerification?: boolean;
}

export interface UpdateListingPayload {
  name?: string;
  description?: string;
  destinationId?: string;
  district?: string;
  locality?: string;
  address?: string;
  category?: AccommodationCategory;
  pricePerNight?: number;
  guestCapacity?: {
    maxGuests: number;
    roomCount?: number;
  };
  amenities?: string[];
  localSpecialties?: string[];
  accessibilityNotes?: string;
  travelTip?: string;
  submissionEvidence?: string;
  contactDetails?: ContactDetails;
  images?: string[];
  publicationStatus?: PublicationStatus;
}

export interface AdminVerifyListingPayload {
  action: 'approve' | 'reject';
  reason: string;
}

export interface AdminSuspendListingPayload {
  reason: string;
}

export interface DestinationRecord {
  id: string;
  name: string;
  district: string;
  division: 'Kumaon' | 'Garhwal';
  tagline: string;
  description: string;
  altitudeMeters: number;
  coordinates?: GeoCoordinates;
  bestTimeToVisit: string;
  characterTags: string[];
  featuredSpecialties: string[];
  knownLocalities: string[];
  accessibilityNotes: string;
  travelTip: string;
  leadCountEstimate: number;
  verifiedCountEstimate: number;
  heroImage: string;
}

export type ExperienceCategory =
  | 'craft_and_weaving'
  | 'village_culture'
  | 'culinary_and_farming'
  | 'nature_and_trekking';

export type ExperienceVerificationStatus =
  | 'grounded_regional_heritage'
  | 'lead_under_verification'
  | 'verified_host_experience';

export interface ExperienceRecord {
  id: string;
  title: string;
  category: ExperienceCategory;
  destinationId: string;
  destinationName: string;
  district: string;
  locality: string;
  description: string;
  highlights: string[];
  potentialStakeholders?: string;
  evidenceSource: string;
  sourceType: string;
  verificationStatus: ExperienceVerificationStatus;
  responsibleTravelGuideline: string;
  seasonality: string;
}

export type UserRole = 'tourist' | 'host' | 'guide' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthUser = UserRecord;

export interface AuthResponse {
  user: AuthUser;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface BookingPriceBreakdown {
  nights: number;
  pricePerNight: number;
  baseAmount: number;
  communityFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: 'INR';
}

export interface BookingRecord {
  id: string;
  bookingReference: string;
  touristId: string;
  touristName: string;
  touristEmail: string;
  touristPhone?: string;
  stayId: string;
  stayName: string;
  stayLocality: string;
  stayDistrict: string;
  hostId?: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  pricing: BookingPriceBreakdown;
  status: BookingStatus;
  specialRequests?: string;
  cancellationReason?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  stayId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  specialRequests?: string;
}

export interface BookingResponse {
  booking: BookingRecord;
}

/**
 * Guide Discovery & Booking System Types
 */

export type GuideVerificationStatus =
  | 'unverified'
  | 'verification_pending'
  | 'verified'
  | 'rejected'
  | 'suspended';

export interface GuideServiceLocation {
  district: string;
  locality: string;
  village?: string;
}

export interface GuideDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  downloadUrl?: string;
  filePath?: string;
  uploadedAt: string;
}

export interface GuideProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  experienceYears?: number;
  languages: string[];
  serviceLocations: GuideServiceLocation[];
  specialties: string[];
  qualifications?: string;
  documents: GuideDocument[];
  verificationStatus: GuideVerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGuideProfilePayload {
  bio?: string;
  experienceYears?: number;
  phone?: string;
  avatarUrl?: string;
  languages?: string[];
  serviceLocations?: GuideServiceLocation[];
  specialties?: string[];
  qualifications?: string;
}

export interface SubmitGuideVerificationPayload {
  bio?: string;
  experienceYears?: number;
  languages?: string[];
  serviceLocations?: GuideServiceLocation[];
  specialties?: string[];
  qualifications?: string;
  documents?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    dataUrl: string;
  }>;
}

export interface GuideAvailableSlot {
  date: string; // YYYY-MM-DD
  timeSlots: string[]; // e.g. ["09:00 AM - 12:00 PM"]
}

export interface GuideExperienceRecord {
  id: string;
  guideId: string;
  guideName: string;
  guideAvatarUrl?: string;
  title: string;
  description: string;
  category: string;
  district: string;
  locality: string;
  meetingPoint: string;
  duration: string;
  price: number;
  pricingType: 'per_person' | 'per_group';
  maxGroupSize: number;
  images: string[];
  requirements?: string;
  availableSlots: GuideAvailableSlot[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuideExperiencePayload {
  title: string;
  description: string;
  category: string;
  district: string;
  locality: string;
  meetingPoint: string;
  duration: string;
  price: number;
  pricingType: 'per_person' | 'per_group';
  maxGroupSize: number;
  images?: string[];
  requirements?: string;
  availableSlots?: GuideAvailableSlot[];
}

export interface UpdateGuideExperiencePayload {
  title?: string;
  description?: string;
  category?: string;
  district?: string;
  locality?: string;
  meetingPoint?: string;
  duration?: string;
  price?: number;
  pricingType?: 'per_person' | 'per_group';
  maxGroupSize?: number;
  images?: string[];
  requirements?: string;
  availableSlots?: GuideAvailableSlot[];
}

export type GuideBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface GuideBookingPricing {
  basePrice: number;
  pricingType: 'per_person' | 'per_group';
  totalAmount: number;
  currency: string;
}

export interface GuideBookingRecord {
  id: string;
  bookingReference: string;
  touristId: string;
  touristName: string;
  touristEmail: string;
  touristPhone?: string;
  guideId: string;
  guideName: string;
  experienceId: string;
  experienceTitle: string;
  linkedHomestayBookingId?: string;
  location: {
    district: string;
    locality: string;
    meetingPoint?: string;
  };
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string;
  participantCount: number;
  pricing: GuideBookingPricing;
  status: GuideBookingStatus;
  specialRequests?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuideBookingPayload {
  experienceId: string;
  bookingDate: string;
  timeSlot: string;
  participantCount: number;
  specialRequests?: string;
  linkedHomestayBookingId?: string;
}

export interface RespondGuideBookingPayload {
  action: 'confirm' | 'reject';
  reason?: string;
}

// ==========================================
// Discover Local Treasures (Artisans & Crafts)
// ==========================================

export type TreasureCategory =
  | 'woollens_textiles'
  | 'traditional_art'
  | 'handicrafts_carvings'
  | 'local_food_produce'
  | 'cultural_heritage';

export type TreasureVerificationStatus =
  | 'verified'
  | 'unverified_lead'
  | 'draft'
  | 'inactive';

export type TreasureArtisanType =
  | 'individual_artisan'
  | 'artisan_collective'
  | 'village_cluster'
  | 'heritage_workshop'
  | 'local_shop';

export interface TreasureContact {
  phone?: string;
  email?: string;
  contactPerson?: string;
  isPubliclyVerified: boolean;
}

export interface LocalTreasureRecord {
  id: string;
  title: string;
  craftName: string;
  category: TreasureCategory;
  artisanOrShopName: string;
  artisanType: TreasureArtisanType;
  district: string;
  locality: string;
  village?: string;
  address?: string;
  coordinates?: GeoCoordinates;
  description: string;
  culturalSignificance: string;
  productionProcess: string;
  visitingInfo?: string;
  contact?: TreasureContact;
  locationLink?: string;
  images: string[];
  verificationStatus: TreasureVerificationStatus;
  verificationNotes?: string;
  sourceReference: string;
  researchNotes?: string;
  nearbyClusters: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreasurePayload {
  title: string;
  craftName: string;
  category: TreasureCategory;
  artisanOrShopName: string;
  artisanType: TreasureArtisanType;
  district: string;
  locality: string;
  village?: string;
  address?: string;
  coordinates?: GeoCoordinates;
  description: string;
  culturalSignificance: string;
  productionProcess: string;
  visitingInfo?: string;
  contact?: TreasureContact;
  locationLink?: string;
  images?: string[];
  verificationStatus?: TreasureVerificationStatus;
  verificationNotes?: string;
  sourceReference: string;
  researchNotes?: string;
  nearbyClusters?: string[];
  isActive?: boolean;
}

export interface UpdateTreasurePayload {
  title?: string;
  craftName?: string;
  category?: TreasureCategory;
  artisanOrShopName?: string;
  artisanType?: TreasureArtisanType;
  district?: string;
  locality?: string;
  village?: string;
  address?: string;
  coordinates?: GeoCoordinates;
  description?: string;
  culturalSignificance?: string;
  productionProcess?: string;
  visitingInfo?: string;
  contact?: TreasureContact;
  locationLink?: string;
  images?: string[];
  verificationStatus?: TreasureVerificationStatus;
  verificationNotes?: string;
  sourceReference?: string;
  researchNotes?: string;
  nearbyClusters?: string[];
  isActive?: boolean;
}

export interface ReviewTreasurePayload {
  action: 'approve' | 'reject' | 'deactivate' | 'activate';
  notes?: string;
}


