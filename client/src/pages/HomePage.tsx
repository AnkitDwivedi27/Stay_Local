import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Search,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Home,
  Users,
  TreePine,
} from 'lucide-react';
import { DestinationRecord, AccommodationRecord } from '../types';
import { apiService } from '../services/api';
import { DestinationCard } from '../components/destinations/DestinationCard';
import { StayCard } from '../components/stays/StayCard';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [featuredStays, setFeaturedStays] = useState<AccommodationRecord[]>([]);
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dests, stays] = await Promise.all([
        apiService.getDestinations(),
        apiService.getStays(),
      ]);
      setDestinations(dests);
      setFeaturedStays(stays.slice(0, 3));
    } catch (err) {
      console.error('Failed to load home data', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchDestination.trim()) params.append('destination', searchDestination.trim());
    if (searchDistrict.trim()) params.append('district', searchDistrict.trim());
    navigate(`/stays?${params.toString()}`);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. Himalayan Travel Hero Section */}
      <section className="relative min-h-[620px] lg:min-h-[680px] flex items-center justify-center bg-forest-950 overflow-hidden">
        {/* Background Image with Himalayan Atmosphere */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1920&q=85"
            alt="Panchachuli peaks rising above Munsiyari alpine meadows in Uttarakhand"
            className="w-full h-full object-cover opacity-40 object-center scale-105 animate-in fade-in duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-900/80 border border-forest-700/80 text-sand-100 text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-sm">
            <TreePine className="w-3.5 h-3.5 text-clay-400" />
            <span>Community-Led Himalayan Tourism · Uttarakhand</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.12] text-balance drop-shadow-sm">
            Discover Uttarakhand through living village heritage & authentic homestays.
          </h1>

          <p className="text-base sm:text-lg text-sand-200/95 max-w-2xl mx-auto font-normal leading-relaxed text-balance">
            Connect directly with verified mountain hosts in Johar Valley, Kumaon lake basins, and Saryu ridges. No artificial reviews, no commission markups—just honest community travel.
          </p>

          {/* Search Bar Interface */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-sand-200 text-left max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-3 items-center backdrop-blur-sm"
          >
            <div className="sm:col-span-6 relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                Destination or Valley
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-clay-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Munsiyari, Bhimtal, Sarmoli..."
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-charcoal-900 font-medium rounded-xl border border-sand-300 focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 bg-sand-50/60 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                District
              </label>
              <select
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm text-charcoal-900 font-medium rounded-xl border border-sand-300 focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 bg-sand-50/60 transition-colors"
              >
                <option value="">All Researched Districts</option>
                <option value="Pithoragarh">Pithoragarh (Munsiyari & Johar)</option>
                <option value="Nainital">Nainital (Bhimtal & Sattal)</option>
                <option value="Bageshwar">Bageshwar (Kausani & Baijnath)</option>
              </select>
            </div>

            <div className="sm:col-span-2 sm:self-end">
              <button
                type="submit"
                className="w-full h-[40px] bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Value Badges */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-medium text-sand-300/90">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-clay-400" /> Grounded in Field Research
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-clay-400" /> Transparent Verification
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-clay-400" /> 100% Direct Host Remuneration
            </span>
          </div>
        </div>
      </section>

      {/* 2. Featured Uttarakhand Destinations */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-clay-600">
              <Sparkles className="w-4 h-4" />
              <span>Researched High-Himalayan Regions</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 tracking-tight">
              Featured Uttarakhand Destinations
            </h2>
            <p className="text-sm text-charcoal-600 max-w-xl leading-relaxed">
              From alpine trading hamlets beneath Panchachuli to quiet lake basins and river confluences with centuries of living temple heritage.
            </p>
          </div>
          <Link
            to="/destinations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900 group transition-colors"
          >
            <span>View all 4 researched regions</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-sand-200 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage
            title="Could Not Load Featured Destinations"
            message={error}
            onRetry={loadData}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Community-Based Tourism & Homestay Philosophy */}
      <section className="bg-forest-950 text-sand-100 py-20 border-y border-forest-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-900 text-clay-300 text-xs font-semibold tracking-wider uppercase border border-forest-800">
                <HeartHandshake className="w-3.5 h-3.5 text-clay-400" />
                <span>Our Tourism Philosophy</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight leading-snug">
                Why community homestays preserve Uttarakhand's living mountains.
              </h2>

              <p className="text-sm sm:text-base text-sand-200/90 leading-relaxed font-normal">
                Conventional mass tourism funnels revenue into remote corporate hands while straining fragile Himalayan ecosystems and road corridors. StayLocal champions village-owned homestays where traveler income remains directly with host families and village Van Panchayats.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-forest-900 border border-forest-800 text-clay-400 shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">
                      Authentic Himalayan Living
                    </h3>
                    <p className="text-xs text-sand-300/80 mt-1 leading-relaxed">
                      Sleep in generational stone and timber architecture, dine on wholesome millets and organic garden harvests, and share hearthside conversations with your hosts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-forest-900 border border-forest-800 text-clay-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">
                      Forest Stewardship & Van Panchayats
                    </h3>
                    <p className="text-xs text-sand-300/80 mt-1 leading-relaxed">
                      Villages like Sarmoli demonstrate how community forest management safeguards high-altitude water catchments and oak-rhododendron biodiversity.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-forest-900 border border-forest-800 text-clay-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">
                      Direct Economic Empowerment
                    </h3>
                    <p className="text-xs text-sand-300/80 mt-1 leading-relaxed">
                      Women-led microenterprises, local guides, and village weavers retain 100% of accommodation and experience fees without middleman commissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/about">
                  <Button variant="secondary" size="md">
                    Read Our Complete Mission & Ethics Charter
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Visual Feature */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-forest-800 bg-forest-900">
                <img
                  src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80"
                  alt="Rural mountain life and terraced farms in Kumaon Himalayas"
                  className="w-full h-[460px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/95 via-forest-950/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-forest-900/90 backdrop-blur-md border border-forest-800">
                  <p className="text-xs text-clay-300 font-bold uppercase tracking-wider mb-1">
                    Community Spotlight
                  </p>
                  <p className="text-base font-serif font-bold text-white">
                    Sarmoli Homestay Collective, Johar Valley
                  </p>
                  <p className="text-xs text-sand-300/90 mt-1.5 leading-relaxed">
                    Over 20 family homes cooperatively hosting travelers, funding village education, and protecting alpine pastures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Regional Culture & Traditional Craft Highlights */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-clay-600">
            <Sparkles className="w-4 h-4" />
            <span>Living Heritage of Uttarakhand</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 tracking-tight">
            Traditional Crafts & Indigenous Mountain Produce
          </h2>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            Support heritage lineages—hand-spun Pashminas, sacred Kumaoni Aipan paintings, and GI-tagged organic mountain pulses directly at village workshops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Craft 1 */}
          <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm hover:shadow-md hover:border-sand-300 transition-all flex flex-col justify-between group">
            <div className="relative h-44 w-full overflow-hidden bg-sand-200">
              <img
                src="https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80"
                alt="Shauka Pashmina weaving in Darkot village"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sand-200">
                  Pithoragarh · Darkot Village
                </span>
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-charcoal-900 leading-snug">
                  Shauka Pashmina & Dans
                </h3>
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  Centuries-old handloom weaving traditions practiced by Shauka artisan families. Weavers spin raw mountain wool into delicate shawls, heavy winter carpets, and warm wraps using ancestral wooden pit looms.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-forest-700 border-t border-sand-100">
                Direct from weaver households in Darkot
              </div>
            </div>
          </div>

          {/* Craft 2 */}
          <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm hover:shadow-md hover:border-sand-300 transition-all flex flex-col justify-between group">
            <div className="relative h-44 w-full overflow-hidden bg-sand-200">
              <img
                src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
                alt="Kumaon Aipan folk art ritual mandalas"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sand-200">
                  Kumaon Region
                </span>
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-charcoal-900 leading-snug">
                  Aipan Folk Art Traditions
                </h3>
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  Ritual floor paintings made from sacred red ochre clay (Geru) and hand-ground rice paste (Biswar). Master women artists adorn thresholds and ceremonial fabrics with intricate spiritual mandalas.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-forest-700 border-t border-sand-100">
                Preserved across Almora and Pithoragarh
              </div>
            </div>
          </div>

          {/* Craft 3 */}
          <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm hover:shadow-md hover:border-sand-300 transition-all flex flex-col justify-between group">
            <div className="relative h-44 w-full overflow-hidden bg-sand-200">
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80"
                alt="High-altitude organic agriculture in Munsiyari"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sand-200">
                  High Altitude Agriculture
                </span>
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-charcoal-900 leading-snug">
                  Munsiyari White Rajma & Jambu
                </h3>
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  Cultivated in mineral-rich glacial soil at 2,200m altitude. Renowned for its buttery tenderness, alongside wild mountain herbs like Jambu and Gandrayani harvested seasonally from high alpine meadows.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-forest-700 border-t border-sand-100">
                Geographical Indication (GI) heritage produce
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link to="/experiences">
            <Button variant="outline" size="md">
              <span>Explore All Regional Crafts & Living Experiences</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 5. Featured Homestay Discovery Preview */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-clay-600">
              <Home className="w-4 h-4" />
              <span>Accommodation Discovery Preview</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 tracking-tight">
              Sample Researched Stays
            </h2>
            <p className="text-sm text-charcoal-600 max-w-xl leading-relaxed">
              We distinguish verified community homestays from researched directory leads to maintain strict platform integrity.
            </p>
          </div>
          <Link
            to="/stays"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900 group transition-colors"
          >
            <span>Browse full accommodation directory</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-sand-200 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage
            title="Could Not Load Sample Stays"
            message={error}
            onRetry={loadData}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredStays.map((stay) => (
              <StayCard key={stay.id} stay={stay} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Dual Call-to-Action: For Travelers & Prospective Hosts */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Travelers */}
          <div className="p-8 sm:p-12 rounded-2xl bg-forest-900 text-white space-y-6 border border-forest-800 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-forest-800 flex items-center justify-center text-clay-300 border border-forest-700">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
                Planning a conscious journey to Uttarakhand?
              </h3>
              <p className="text-sm text-sand-200/90 leading-relaxed font-normal">
                Explore our verified homestay directory, discover local trail guides, and prepare for respectful, low-impact mountain travel.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/stays">
                <Button variant="secondary" size="md">
                  Explore Verified Directory
                </Button>
              </Link>
            </div>
          </div>

          {/* For Hosts & Village Cooperatives */}
          <div className="p-8 sm:p-12 rounded-2xl bg-sand-100 text-charcoal-900 space-y-6 border border-sand-300/80 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-forest-800 border border-sand-200 shadow-xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-950 leading-snug">
                Are you a homestay host or village artisan?
              </h3>
              <p className="text-sm text-charcoal-700 leading-relaxed font-normal">
                StayLocal provides free onboarding and verification support for registered Uttarakhand homestays and traditional craft collectives.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/about">
                <Button variant="primary" size="md">
                  Learn About Host Onboarding
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
