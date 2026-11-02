import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { StayDetailPage } from '../pages/StayDetailPage';
import { DestinationDetailPage } from '../pages/DestinationDetailPage';
import { ExperienceDetailPage } from '../pages/ExperienceDetailPage';
import { apiService } from '../services/api';
import { AccommodationRecord, DestinationRecord, ExperienceRecord } from '../types';

const mockStay: AccommodationRecord = {
  id: 'stay-sarmoli-01',
  name: 'Sarmoli Village Collective Homestay',
  description: 'Traditional Kumaoni stone house hosted by the village Van Panchayat women.',
  district: 'Pithoragarh',
  locality: 'Sarmoli',
  address: 'Upper Sarmoli Trail, Munsiyari',
  category: 'village_homestay',
  dataSource: 'field_research',
  verificationStatus: 'verified',
  publicationStatus: 'published',
  pricePerNight: 2200,
  hostId: 'host-123',
  guestCapacity: {
    maxGuests: 4,
    roomCount: 2,
  },
  amenities: ['Organic Himalayan Meals', 'Solar Water Heating', 'Village Trail Guide'],
  localSpecialties: ['Munsiyari White Rajma', 'Hand-ground Bhaang Chutney'],
  accessibilityNotes: '200m walking trail from the nearest motorable road.',
  travelTip: 'Carry warm thermals even during spring.',
  contactDetails: {
    phone: '+91 94120 00000',
    email: 'sarmoli.hosts@staylocal.in',
    contactPerson: 'Bina Devi',
    isPubliclyListed: true,
  },
  createdAt: '2026-09-15T08:00:00Z',
  updatedAt: '2026-10-20T10:00:00Z',
};

const mockUnverifiedStay: AccommodationRecord = {
  ...mockStay,
  id: 'stay-unverified-02',
  name: 'Remote Ridge Shelter Lead',
  verificationStatus: 'unverified_lead',
  publicationStatus: 'draft',
};

const mockDestination: DestinationRecord = {
  id: 'munsiyari',
  name: 'Munsiyari',
  district: 'Pithoragarh',
  division: 'Kumaon',
  altitudeMeters: 2200,
  tagline: 'Gateway to the Johar Valley and Panchachuli Peaks',
  description: 'Ancient Himalayan trading post situated beneath the jagged snow-clad Panchachuli massif.',
  heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23',
  characterTags: ['Alpine Meadows', 'Panchachuli Views', 'Bhotia Culture'],
  featuredSpecialties: ['Shauka Pashmina Weaving', 'Organic White Rajma'],
  bestTimeToVisit: 'March to June; September to November',
  knownLocalities: ['Sarmoli', 'Darkot', 'Madkot'],
  accessibilityNotes: 'Reached via Thal or Birthi Falls mountain roads.',
  travelTip: 'Start early from Almora to cross Kalamuni pass before afternoon mist.',
  leadCountEstimate: 12,
  verifiedCountEstimate: 4,
};

const mockExperience: ExperienceRecord = {
  id: 'exp-pashmina-01',
  title: 'Pashmina & Tibetan Wool Weaving with Shauka Artisans',
  category: 'craft_and_weaving',
  locality: 'Darkot Village, Munsiyari',
  district: 'Pithoragarh',
  destinationId: 'munsiyari',
  destinationName: 'Munsiyari',
  description: 'Observe traditional drop-spindle spinning and backstrap loom weaving in generational artisan homes.',
  highlights: ['Raw pashmina carding demonstration', 'Direct purchase from artisan collective'],
  seasonality: 'Year-round except heavy winter snowfall (January)',
  verificationStatus: 'verified_host_experience',
  evidenceSource: 'District Handloom Cooperative Registry',
  sourceType: 'district_handloom_registry',
  responsibleTravelGuideline: 'Always request permission before photographing weavers; pay listed collective prices without haggling.',
};

describe('StayLocal Individual Detail Pages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('StayDetailPage Component', () => {
    it('renders verified homestay details, amenities, pricing and booking action', async () => {
      vi.spyOn(apiService, 'getStayById').mockResolvedValue(mockStay);

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/stays/stay-sarmoli-01']}>
            <Routes>
              <Route path="/stays/:id" element={<StayDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Sarmoli Village Collective Homestay/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/Traditional Kumaoni stone house/i)).toBeInTheDocument();
      expect(screen.getByText(/₹2,200/)).toBeInTheDocument();
      expect(screen.getByText(/Up to 4 guests/)).toBeInTheDocument();
      expect(screen.getByText('Organic Himalayan Meals')).toBeInTheDocument();
      expect(screen.getByText('Solar Water Heating')).toBeInTheDocument();
      expect(screen.getByText('Munsiyari White Rajma')).toBeInTheDocument();
      expect(screen.getByText(/Bina Devi/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Request Homestay Booking/i })).toBeInTheDocument();
    });

    it('shows unverified status warning and disables booking for unverified listings', async () => {
      vi.spyOn(apiService, 'getStayById').mockResolvedValue(mockUnverifiedStay);

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/stays/stay-unverified-02']}>
            <Routes>
              <Route path="/stays/:id" element={<StayDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Remote Ridge Shelter Lead/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/Unverified Field Lead/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Booking Not Supported/i })).toBeDisabled();
    });
  });

  describe('DestinationDetailPage Component', () => {
    it('renders destination details, altitude, specialties and navigation links', async () => {
      vi.spyOn(apiService, 'getDestinationById').mockResolvedValue(mockDestination);

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/destinations/munsiyari']}>
            <Routes>
              <Route path="/destinations/:id" element={<DestinationDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^Munsiyari$/i })).toBeInTheDocument();
      });

      expect(screen.getByText('2,200 m')).toBeInTheDocument();
      expect(screen.getByText(/Pithoragarh District/)).toBeInTheDocument();
      expect(screen.getByText(/Ancient Himalayan trading post/)).toBeInTheDocument();
      expect(screen.getByText('Shauka Pashmina Weaving')).toBeInTheDocument();
      expect(screen.getByText(/Browse Homestays in Munsiyari/i)).toBeInTheDocument();
    });
  });

  describe('ExperienceDetailPage Component', () => {
    it('renders experience details, highlights, seasonality and charter', async () => {
      vi.spyOn(apiService, 'getExperienceById').mockResolvedValue(mockExperience);

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/experiences/exp-pashmina-01']}>
            <Routes>
              <Route path="/experiences/:id" element={<ExperienceDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Pashmina & Tibetan Wool Weaving with Shauka Artisans/i })
        ).toBeInTheDocument();
      });

      expect(screen.getAllByText(/Darkot Village, Munsiyari/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Observe traditional drop-spindle spinning/)).toBeInTheDocument();
      expect(screen.getByText(/Raw pashmina carding demonstration/)).toBeInTheDocument();
      expect(screen.getByText(/pay listed collective prices without haggling/)).toBeInTheDocument();
      expect(screen.getByText(/Find Nearby Homestays in Darkot Village, Munsiyari/i)).toBeInTheDocument();
    });
  });
});
