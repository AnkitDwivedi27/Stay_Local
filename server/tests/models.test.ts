import { describe, it, expect } from 'vitest';
import { DestinationModel } from '../src/models/destination.model';
import { StayModel } from '../src/models/stay.model';
import { ExperienceModel } from '../src/models/experience.model';
import { VerificationStatus, AccommodationCategory } from '../src/types';

describe('StayLocal Mongoose Data Models & Validation', () => {
  describe('DestinationModel Schema & Validation', () => {
    it('should validate a valid destination document without errors', () => {
      const doc = new DestinationModel({
        id: 'test-valley',
        name: 'Test Valley',
        district: 'Pithoragarh',
        division: 'Kumaon',
        tagline: 'A scenic test valley',
        description: 'Detailed description of the test valley in Uttarakhand.',
        altitudeMeters: 1800,
        coordinates: { latitude: 29.8, longitude: 80.1 },
        bestTimeToVisit: 'April to June',
        characterTags: ['Alpine', 'Scenic'],
        featuredSpecialties: ['Handloom'],
        knownLocalities: ['Village A'],
        accessibilityNotes: 'Road accessible via state highway.',
        travelTip: 'Bring warm clothes.',
        leadCountEstimate: 5,
        verifiedCountEstimate: 1,
        heroImage: 'https://images.unsplash.com/test.jpg',
      });

      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.id).toBe('test-valley');
    });

    it('should fail validation when required fields are missing', () => {
      const doc = new DestinationModel({});
      const err = doc.validateSync();

      expect(err).toBeDefined();
      expect(err?.errors.id).toBeDefined();
      expect(err?.errors.name).toBeDefined();
      expect(err?.errors.district).toBeDefined();
      expect(err?.errors.division).toBeDefined();
      expect(err?.errors.altitudeMeters).toBeDefined();
    });

    it('should reject invalid division enum values', () => {
      const doc = new DestinationModel({
        id: 'invalid-div',
        name: 'Invalid Division Place',
        district: 'Pithoragarh',
        division: 'Himachal' as unknown as 'Kumaon' | 'Garhwal',
        tagline: 'Tagline',
        description: 'Description',
        altitudeMeters: 1000,
        bestTimeToVisit: 'May',
        accessibilityNotes: 'Notes',
        travelTip: 'Tip',
        heroImage: 'https://example.com/img.jpg',
      });

      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.division).toBeDefined();
    });

    it('should strip _id and __v in toJSON transform', () => {
      const doc = new DestinationModel({
        id: 'clean-json',
        name: 'Clean JSON',
        district: 'Nainital',
        division: 'Kumaon',
        tagline: 'Clean Tagline',
        description: 'Clean Desc',
        altitudeMeters: 1200,
        bestTimeToVisit: 'Year-round',
        accessibilityNotes: 'Easy',
        travelTip: 'None',
        heroImage: 'https://example.com/img.jpg',
      });

      const json = doc.toJSON();
      expect(json).toHaveProperty('id', 'clean-json');
      expect(json).not.toHaveProperty('_id');
      expect(json).not.toHaveProperty('__v');
    });
  });

  describe('StayModel Schema & Validation', () => {
    it('should validate a valid stay record with honest verification status', () => {
      const doc = new StayModel({
        id: 'stay-test-01',
        name: 'Mountain Oak Homestay',
        description: 'A genuine village homestay run by resident farmers.',
        district: 'Bageshwar',
        locality: 'Baijnath',
        address: 'Baijnath Ridge, Bageshwar, Uttarakhand',
        category: 'village_homestay',
        leadType: 'direct_homestay',
        contactDetails: {
          phone: '+91 98765 43210',
          contactPerson: 'Kalyan Singh',
          isPubliclyListed: true,
        },
        localSpecialties: ['Mandua Roti', 'Bhangjeera Chutney'],
        dataSource: 'District Tourism Survey 2026',
        verificationStatus: 'unverified_lead',
        publicationStatus: 'published',
        guestCapacity: { maxGuests: 4, roomCount: 2 },
        amenities: ['Hot Water', 'Home-Cooked Meals'],
      });

      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.verificationStatus).toBe('unverified_lead');
    });

    it('should reject invalid verification status enum', () => {
      const doc = new StayModel({
        id: 'stay-test-02',
        name: 'Fake Status Stay',
        description: 'Description',
        district: 'Nainital',
        locality: 'Bhimtal',
        address: 'Lake Road',
        category: 'village_homestay',
        dataSource: 'Manual',
        verificationStatus: 'guaranteed_authentic' as unknown as VerificationStatus,
      });

      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.verificationStatus).toBeDefined();
    });

    it('should reject invalid accommodation category enum', () => {
      const doc = new StayModel({
        id: 'stay-test-03',
        name: 'Invalid Category Stay',
        description: 'Description',
        district: 'Nainital',
        locality: 'Bhimtal',
        address: 'Lake Road',
        category: 'luxury_casino_resort' as unknown as AccommodationCategory,
        dataSource: 'Manual',
        verificationStatus: 'verified',
      });

      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.category).toBeDefined();
    });
  });

  describe('ExperienceModel Schema & Validation', () => {
    it('should validate a valid experience record with responsible guidelines', () => {
      const doc = new ExperienceModel({
        id: 'exp-test-01',
        title: 'Traditional Wool Spinning Workshop',
        category: 'craft_and_weaving',
        destinationId: 'munsiyari',
        destinationName: 'Munsiyari',
        district: 'Pithoragarh',
        locality: 'Darkot',
        description: 'Learn ancestral wool spinning from lineage artisans.',
        highlights: ['Hand carding', 'Spindle spinning'],
        evidenceSource: 'Field Survey 2026',
        sourceType: 'Artisan Cooperative Survey',
        verificationStatus: 'grounded_regional_heritage',
        responsibleTravelGuideline: 'Pay fair artisan prices directly.',
        seasonality: 'Year-round',
      });

      const err = doc.validateSync();
      expect(err).toBeUndefined();
    });

    it('should reject missing destinationId and title', () => {
      const doc = new ExperienceModel({
        category: 'craft_and_weaving',
      });

      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.title).toBeDefined();
      expect(err?.errors.destinationId).toBeDefined();
    });
  });
});
