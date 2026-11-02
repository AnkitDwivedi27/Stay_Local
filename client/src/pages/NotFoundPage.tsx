import React from 'react';
import { Link } from 'react-router-dom';
import { MountainSnow, Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="editorial-card max-w-lg w-full text-center p-8 sm:p-10 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-forest-50 border border-forest-200 text-forest-700 flex items-center justify-center mx-auto shadow-xs">
          <MountainSnow className="w-8 h-8 text-clay-600" />
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-100 text-clay-700 text-xs font-semibold uppercase tracking-wider border border-sand-300">
            404 · Uncharted Trail
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            You've wandered off the marked trail.
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-sm mx-auto">
            The mountain path or destination listing you are searching for does not exist on StayLocal. Return to verified settlements and homestays below.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <Link to="/stays" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2 text-forest-700" />
              <span>Explore Stays</span>
            </Button>
          </Link>
          <Link to="/destinations" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              <Compass className="w-4 h-4 mr-2 text-clay-600" />
              <span>Destinations</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
