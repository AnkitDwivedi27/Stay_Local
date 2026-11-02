import React from 'react';
import { Link } from 'react-router-dom';
import { Mountain, MapPin, ShieldAlert, HeartHandshake, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-forest-950 text-sand-100 border-t border-forest-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-white border border-forest-700 shadow-sm">
                <Mountain className="w-5 h-5 text-sand-100" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-white">
                  StayLocal
                </span>
                <span className="block text-[10px] tracking-widest font-bold uppercase text-clay-400">
                  Uttarakhand Homestay Discovery
                </span>
              </div>
            </div>
            <p className="text-sm text-sand-200/80 leading-relaxed max-w-sm">
              Connecting travelers with genuine, community-led homestays, living mountain heritage, and traditional artisan crafts across the Himalayas of Uttarakhand.
            </p>
            <div className="flex items-center gap-2 text-xs text-sand-200 bg-forest-900/90 px-3.5 py-2.5 rounded-xl border border-forest-800/80 w-fit">
              <HeartHandshake className="w-4 h-4 text-clay-400 shrink-0" />
              <span>100% direct host support · Fair artisan remuneration</span>
            </div>
          </div>

          {/* Researched Regions */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold tracking-widest uppercase text-sand-300">
              Researched Regions
            </h4>
            <ul className="space-y-2.5 text-sm text-sand-300/90 font-medium">
              <li>
                <Link to="/destinations?district=Pithoragarh" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <MapPin className="w-3.5 h-3.5 text-clay-400 group-hover:translate-x-0.5 transition-transform" /> Munsiyari & Johar
                </Link>
              </li>
              <li>
                <Link to="/destinations?district=Nainital" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <MapPin className="w-3.5 h-3.5 text-clay-400 group-hover:translate-x-0.5 transition-transform" /> Bhimtal & Sattal
                </Link>
              </li>
              <li>
                <Link to="/destinations?district=Bageshwar" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <MapPin className="w-3.5 h-3.5 text-clay-400 group-hover:translate-x-0.5 transition-transform" /> Bageshwar & Baijnath
                </Link>
              </li>
              <li>
                <Link to="/destinations?district=Pithoragarh" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <MapPin className="w-3.5 h-3.5 text-clay-400 group-hover:translate-x-0.5 transition-transform" /> Pithoragarh Valley
                </Link>
              </li>
            </ul>
          </div>

          {/* Discovery Links */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold tracking-widest uppercase text-sand-300">
              Platform Discovery
            </h4>
            <ul className="space-y-2.5 text-sm text-sand-300/90 font-medium">
              <li>
                <Link to="/destinations" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>All Destinations</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/stays" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Homestays Directory</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/experiences" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Crafts & Living Heritage</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Our Mission & Ethics</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Research & Integrity Disclosure */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold tracking-widest uppercase text-sand-300">
              Integrity & Transparency
            </h4>
            <p className="text-xs text-sand-300/80 leading-relaxed">
              We do not publish artificial reviews, fabricated ratings, or fictitious partner badges. Research leads are clearly identified and segregated from verified homestays.
            </p>
            <div className="flex items-start gap-2 text-[11px] text-amber-200/90 bg-forest-900/90 p-3 rounded-xl border border-amber-900/40 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Grounded in active field research. Direct bookings occur directly with verified village hosts.</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-forest-900 flex flex-col sm:flex-row items-center justify-between text-xs text-sand-400 gap-4">
          <p>© {new Date().getFullYear()} StayLocal. Uttarakhand, India. Built with open community data.</p>
          <div className="flex items-center gap-6 font-medium">
            <span className="hover:text-sand-200 transition-colors">Responsible Himalayan Tourism</span>
            <span className="hover:text-sand-200 transition-colors">Grounded Field Research</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
