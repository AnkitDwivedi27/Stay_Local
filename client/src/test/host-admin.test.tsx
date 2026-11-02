import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ListingFormModal } from '../components/host/ListingFormModal';
import { HostListingsPage } from '../pages/HostListingsPage';
import { AdminVerificationPage } from '../pages/AdminVerificationPage';
import { apiService } from '../services/api';
import { AccommodationRecord } from '../types';

const mockHostStay: AccommodationRecord = {
  id: 'stay-host-01',
  name: 'Panchachuli Pine Homestay',
  description: 'Authentic stone cottage with views of the snow peaks in Sarmoli village.',
  district: 'Pithoragarh',
  locality: 'Sarmoli',
  address: 'Upper Sarmoli Village Trail',
  category: 'village_homestay',
  dataSource: 'host_portal',
  verificationStatus: 'verified',
  publicationStatus: 'published',
  pricePerNight: 2400,
  hostId: 'usr_host_101',
  guestCapacity: {
    maxGuests: 4,
    roomCount: 2,
  },
  localSpecialties: ['Organic rajma meals'],
  amenities: ['Solar Water Heating'],
  createdAt: '2026-09-20T08:00:00Z',
  updatedAt: '2026-10-22T11:00:00Z',
};

const mockPendingStay: AccommodationRecord = {
  ...mockHostStay,
  id: 'stay-pending-02',
  name: 'Johar High Altitude Lodge',
  verificationStatus: 'verification_pending',
  submissionEvidence: 'Uttarakhand Tourism Homestay Reg #UK-PITH-2026-8812',
};

const mockRejectedStay: AccommodationRecord = {
  ...mockHostStay,
  id: 'stay-rejected-03',
  name: 'Incomplete Safety Lead',
  verificationStatus: 'rejected_or_inactive',
  publicationStatus: 'draft',
  verificationNotes: 'Missing emergency solar heating and safe drinking water certificate.',
};

describe('StayLocal Host Listing & Admin Verification Frontend', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ListingFormModal Component', () => {
    it('renders create listing modal with required property fields', () => {
      render(
        <ListingFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
        />
      );

      expect(screen.getByText('List Your Uttarakhand Homestay')).toBeInTheDocument();
      expect(screen.getByLabelText(/Property \/ Homestay Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Property Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nightly Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Max Guests/i)).toBeInTheDocument();
    });

    it('validates description length and prevents premature submission', async () => {
      render(
        <ListingFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
        />
      );

      const nameInput = screen.getByLabelText(/Property \/ Homestay Name/i);
      fireEvent.change(nameInput, { target: { value: 'Short Cottage' } });

      const descInput = screen.getByLabelText(/Property Description/i);
      fireEvent.change(descInput, { target: { value: 'Too short' } }); // < 20 chars

      fireEvent.change(screen.getByLabelText(/Village \/ Locality/i), {
        target: { value: 'Sarmoli' },
      });
      fireEvent.change(screen.getByLabelText(/Full Address/i), {
        target: { value: 'Upper Sarmoli Village' },
      });

      const submitBtn = screen.getByRole('button', { name: /Create Listing/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Description must be at least 20 characters/i)).toBeInTheDocument();
      });
    });

    it('submits valid listing payload to API service', async () => {
      const mockSaved = { ...mockHostStay, id: 'stay-new-99' };
      const createSpy = vi.spyOn(apiService, 'createHostListing').mockResolvedValue(mockSaved);
      const onSaved = vi.fn();
      const onClose = vi.fn();

      render(
        <ListingFormModal
          isOpen={true}
          onClose={onClose}
          onSaved={onSaved}
        />
      );

      fireEvent.change(screen.getByLabelText(/Property \/ Homestay Name/i), {
        target: { value: 'New Alpine Haven' },
      });
      fireEvent.change(screen.getByLabelText(/Property Description/i), {
        target: { value: 'Traditional stone house with organic apple orchard and mountain views.' },
      });
      fireEvent.change(screen.getByLabelText(/Village \/ Locality/i), {
        target: { value: 'Sarmoli' },
      });
      fireEvent.change(screen.getByLabelText(/Full Address/i), {
        target: { value: 'Upper Sarmoli Village' },
      });

      const submitBtn = screen.getByRole('button', { name: /Create Listing/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled();
        expect(onSaved).toHaveBeenCalledWith(mockSaved);
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('HostListingsPage Component', () => {
    it('renders host homestays with verification status and metrics', async () => {
      vi.spyOn(apiService, 'getHostListings').mockResolvedValue([
        mockHostStay,
        mockPendingStay,
        mockRejectedStay,
      ]);

      render(
        <MemoryRouter>
          <HostListingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('My Homestay Listings')).toBeInTheDocument();
        expect(screen.getByText('Panchachuli Pine Homestay')).toBeInTheDocument();
        expect(screen.getByText('Johar High Altitude Lodge')).toBeInTheDocument();
        expect(screen.getByText('Incomplete Safety Lead')).toBeInTheDocument();

        // Verification badges
        expect(screen.getByText('Verified Listing')).toBeInTheDocument();
        expect(screen.getByText('Pending Review')).toBeInTheDocument();
        expect(screen.getByText('Rejected / Inactive')).toBeInTheDocument();
      });
    });

    it('displays admin feedback note when listing is rejected', async () => {
      vi.spyOn(apiService, 'getHostListings').mockResolvedValue([mockRejectedStay]);

      render(
        <MemoryRouter>
          <HostListingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Admin Review Feedback \(Action Required\)/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Missing emergency solar heating and safe drinking water certificate/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit for Verification/i })).toBeInTheDocument();
      });
    });
  });

  describe('AdminVerificationPage Component', () => {
    it('renders administrator verification queue and opens inspection dialog', async () => {
      vi.spyOn(apiService, 'getAdminVerificationQueue').mockResolvedValue([mockPendingStay]);
      vi.spyOn(apiService, 'getAdminListingDetails').mockResolvedValue({
        ...mockPendingStay,
        hostUser: {
          id: 'usr_host_101',
          fullName: 'Kundan Singh Rawat',
          email: 'kundan@sarmoli.org',
          phone: '+91 94123 45678',
        },
        bookings: [],
      });

      render(
        <MemoryRouter>
          <AdminVerificationPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Administrator Verification Portal')).toBeInTheDocument();
        expect(screen.getByText('Johar High Altitude Lodge')).toBeInTheDocument();
      });

      // Click Inspect & Audit
      const inspectBtn = screen.getByRole('button', { name: /Inspect & Audit/i });
      fireEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByText(/Field Audit Inspection: Johar High Altitude Lodge/i)).toBeInTheDocument();
        expect(screen.getByText('Kundan Singh Rawat')).toBeInTheDocument();
        expect(screen.getByText('Uttarakhand Tourism Homestay Reg #UK-PITH-2026-8812')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Approve & Publish/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reject Listing/i })).toBeInTheDocument();
      });
    });
  });
});
