import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BookingModal } from '../components/booking/BookingModal';
import { MyBookingsPage } from '../pages/MyBookingsPage';
import { HostBookingsPage } from '../pages/HostBookingsPage';
import { apiService } from '../services/api';
import * as AuthContextModule from '../context/AuthContext';
import { AccommodationRecord, BookingRecord, AuthUser } from '../types';

const mockVerifiedStay: AccommodationRecord = {
  id: 'stay-mun-02',
  name: 'Mesar Kund Alpine Homestay',
  description: 'Traditional stone-and-timber mountain home in Sarmoli.',
  district: 'Pithoragarh',
  locality: 'Sarmoli',
  address: 'Upper Sarmoli Trail, Munsiyari',
  category: 'village_homestay',
  dataSource: 'Field Inspection',
  verificationStatus: 'verified',
  publicationStatus: 'published',
  pricePerNight: 2400,
  hostId: 'usr_host_123',
  guestCapacity: {
    maxGuests: 6,
    roomCount: 3,
  },
  localSpecialties: ['Organic farm meals', 'Mesar Kund lake walk'],
  amenities: ['Solar hot water', 'Clean attached bathrooms'],
  createdAt: '2026-09-20T08:00:00Z',
  updatedAt: '2026-10-22T11:00:00Z',
};

const mockUnverifiedStay: AccommodationRecord = {
  ...mockVerifiedStay,
  id: 'stay-unverified-01',
  name: 'Unverified Alpine Shelter Lead',
  verificationStatus: 'unverified_lead',
};

const mockTouristUser: AuthUser = {
  id: 'usr_tourist_123',
  fullName: 'Aarav Sharma',
  email: 'aarav@staylocal.org',
  role: 'tourist',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockBooking: BookingRecord = {
  id: 'bk_1729000000_abc',
  bookingReference: 'SLB-7K9F2Q',
  touristId: 'usr_tourist_123',
  touristName: 'Aarav Sharma',
  touristEmail: 'aarav@staylocal.org',
  stayId: 'stay-mun-02',
  stayName: 'Mesar Kund Alpine Homestay',
  stayLocality: 'Sarmoli',
  stayDistrict: 'Pithoragarh',
  hostId: 'usr_host_123',
  checkIn: '2026-11-15',
  checkOut: '2026-11-18',
  guestCount: 2,
  pricing: {
    nights: 3,
    pricePerNight: 2400,
    baseAmount: 7200,
    communityFee: 360,
    taxAmount: 360,
    totalAmount: 7920,
    currency: 'INR',
  },
  status: 'pending',
  createdAt: '2026-10-25T12:00:00Z',
  updatedAt: '2026-10-25T12:00:00Z',
};

describe('StayLocal Frontend Booking Management & Availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BookingModal Component', () => {
    it('renders verified homestay details and calculates live price breakdown with community fee', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: mockTouristUser,
        loading: false,
        error: null,
        isAuthenticated: true,
        role: 'tourist',
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <BookingModal
            stay={mockVerifiedStay}
            isOpen={true}
            onClose={vi.fn()}
          />
        </MemoryRouter>
      );

      // Verify Stay Title & Nightly Rate
      expect(screen.getByRole('heading', { level: 2, name: 'Mesar Kund Alpine Homestay' })).toBeInTheDocument();
      expect(screen.getByText(/₹2,400 \/ night/i)).toBeInTheDocument();

      // Verify Live Price Breakdown section
      expect(screen.getByText('Price Breakdown Preview')).toBeInTheDocument();
      expect(screen.getByText(/Village Community Fund \(5%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Sustainable Tourism Tax \/ GST \(5%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/No online payment collected/i)).toBeInTheDocument();

      // Submit Button
      expect(screen.getByRole('button', { name: /Request Homestay Reservation/i })).toBeInTheDocument();
    });

    it('blocks reservation request and shows warning for unverified listings', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: mockTouristUser,
        loading: false,
        error: null,
        isAuthenticated: true,
        role: 'tourist',
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <BookingModal
            stay={mockUnverifiedStay}
            isOpen={true}
            onClose={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByText(/Direct Booking Unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/unverified_lead/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Request Homestay Reservation/i })).not.toBeInTheDocument();
    });

    it('submits booking and displays confirmation reference screen on success', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: mockTouristUser,
        loading: false,
        error: null,
        isAuthenticated: true,
        role: 'tourist',
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      vi.spyOn(apiService, 'createBooking').mockResolvedValue(mockBooking);

      render(
        <MemoryRouter>
          <BookingModal
            stay={mockVerifiedStay}
            isOpen={true}
            onClose={vi.fn()}
          />
        </MemoryRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Request Homestay Reservation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Booking Request Submitted')).toBeInTheDocument();
        expect(screen.getByText('SLB-7K9F2Q')).toBeInTheDocument();
        expect(screen.getByText(/Pending Host Review/i)).toBeInTheDocument();
      });
    });
  });

  describe('MyBookingsPage Component', () => {
    it('renders list of user bookings with reference code, dates, and status', async () => {
      vi.spyOn(apiService, 'getMyBookings').mockResolvedValue([mockBooking]);

      render(
        <MemoryRouter>
          <MyBookingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('My Homestay Bookings')).toBeInTheDocument();
        expect(screen.getByText('Mesar Kund Alpine Homestay')).toBeInTheDocument();
        expect(screen.getByText('SLB-7K9F2Q')).toBeInTheDocument();
        expect(screen.getByText('Pending Host Review')).toBeInTheDocument();
        expect(screen.getByText(/₹7,920/)).toBeInTheDocument();
      });
    });

    it('renders empty state when tourist has no reservations', async () => {
      vi.spyOn(apiService, 'getMyBookings').mockResolvedValue([]);

      render(
        <MemoryRouter>
          <MyBookingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No Booking Requests Yet')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Discover Verified Homestays/i })).toBeInTheDocument();
      });
    });
  });

  describe('HostBookingsPage Component', () => {
    it('renders incoming host booking requests with guest details and action buttons', async () => {
      vi.spyOn(apiService, 'getHostBookings').mockResolvedValue([mockBooking]);

      render(
        <MemoryRouter>
          <HostBookingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Manage Booking Requests')).toBeInTheDocument();
        expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
        expect(screen.getByText('aarav@staylocal.org')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Confirm Reservation/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Decline Request/i })).toBeInTheDocument();
      });
    });
  });
});
