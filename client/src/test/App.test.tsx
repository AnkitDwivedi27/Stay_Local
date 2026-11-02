import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('StayLocal Frontend Application', () => {
  it('renders navigation links and StayLocal brand header', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Verify Brand Name
    const brandElements = screen.getAllByText(/StayLocal/i);
    expect(brandElements.length).toBeGreaterThan(0);

    // Verify Navigation Links
    const destinationLinks = screen.getAllByRole('link', { name: /Destinations/i });
    expect(destinationLinks.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByRole('link', { name: /^About StayLocal$/i })).toBeInTheDocument();
  });

  it('renders Himalayan hero headline and destination search', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Discover Uttarakhand through living village heritage & authentic homestays/i)
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/e\.g\. Munsiyari, Bhimtal, Sarmoli\.\.\./i)).toBeInTheDocument();
  });
});
