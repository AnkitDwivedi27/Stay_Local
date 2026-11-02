import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerificationBadge } from '../components/ui/Badge';

describe('VerificationBadge Component', () => {
  it('renders "Verified Homestay" badge with green styling', () => {
    render(<VerificationBadge status="verified" />);
    expect(screen.getByText('Verified Homestay')).toBeInTheDocument();
  });

  it('renders "Verification Pending" badge', () => {
    render(<VerificationBadge status="verification_pending" />);
    expect(screen.getByText('Verification Pending')).toBeInTheDocument();
  });

  it('renders "Research Lead (Unverified)" badge', () => {
    render(<VerificationBadge status="unverified_lead" />);
    expect(screen.getByText('Research Lead (Unverified)')).toBeInTheDocument();
  });
});
