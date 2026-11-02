import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { VerificationExplainerModal } from '../components/ui/VerificationExplainerModal';

export const RootLayout: React.FC = () => {
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-himalayan-atmosphere text-charcoal-800">
      <Header onOpenExplainer={() => setExplainerOpen(true)} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <VerificationExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  );
};
