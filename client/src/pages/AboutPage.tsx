import React from 'react';
import {
  Mountain,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  PhoneCall,
  Building2,
  Mail,
} from 'lucide-react';
import { Card } from '../components/ui/Card';

export const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl space-y-16">
      {/* Hero Section */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-semibold tracking-wider uppercase border border-forest-200">
          <Mountain className="w-3.5 h-3.5 text-forest-700" />
          <span>About StayLocal</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 tracking-tight">
          Pioneering Honest, Community-Led Homestay Discovery in Uttarakhand
        </h1>
        <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed max-w-2xl mx-auto">
          We are building StayLocal to empower rural mountain households, protect indigenous craft lineages, and connect conscious travelers with authentic Himalayan hosts.
        </p>
      </div>

      {/* 1. Project Background & Core Mission */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 border-b border-sand-200 pb-3">
          Why StayLocal Exists
        </h2>
        <div className="prose prose-stone text-sm text-charcoal-700 leading-relaxed space-y-4">
          <p>
            Uttarakhand’s hill districts—from the high alpine borders of Pithoragarh to the lake basins of Nainital and river valleys of Bageshwar—hold exceptional natural and cultural heritage. However, the commercial tourism model frequently clusters in crowded highway corridors, inflating costs and concentrating profits among large outside aggregators.
          </p>
          <p>
            Meanwhile, rural homestay operators, village cooperatives, and traditional artisans struggle for online visibility. Genuine homestays—such as the women-led Sarmoli collective in Munsiyari or generational orchard farmsteads in Mehragaon—offer profound cultural immersion and direct forest stewardship, yet travelers rarely have access to accurate, unmanipulated directories.
          </p>
          <p>
            <strong>StayLocal</strong> was founded to bridge this gap. Our mission is to build a reliable, public-facing discovery platform where:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-charcoal-800 font-medium">
            <li>Travelers discover authentic homestays without inflated booking commissions.</li>
            <li>Hosts and village Van Panchayats retain 100% of their accommodation and guiding revenue.</li>
            <li>Regional crafts (such as Darkot handloom Pashmina, Ringal bamboo weaving, and Kumaoni Aipan art) receive direct patron connections.</li>
            <li>All listing data is transparently verified rather than scraped and artificially hyped.</li>
          </ul>
        </div>
      </section>

      {/* 2. Our 4-Stage Verification Methodology */}
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            Our 4-Stage Verification Methodology
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            We reject the industry practice of publishing unverified directory leads as instant-bookable hotels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stage 1 */}
          <Card className="p-5 border-sand-200 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-charcoal-500">
              <span className="w-6 h-6 rounded-full bg-sand-200 text-charcoal-800 flex items-center justify-center text-xs">
                1
              </span>
              <span>Research Discovery</span>
            </div>
            <h3 className="font-serif text-base font-bold text-charcoal-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-clay-600" />
              Regional Lead Identification
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              We compile regional leads from public listings, village sarpanch references, and government directories (e.g. NIDHI+). At this stage, entries are strictly marked as <em>Unverified Research Leads</em>.
            </p>
          </Card>

          {/* Stage 2 */}
          <Card className="p-5 border-sand-200 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-amber-700">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Direct Host Outreach</span>
            </div>
            <h3 className="font-serif text-base font-bold text-charcoal-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-600" />
              Host Availability & Consent
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              We contact the listed property owner or community representative directly to verify that the residence is actively operational and to seek explicit permission to list on StayLocal. Status moves to <em>Verification Pending</em>.
            </p>
          </Card>

          {/* Stage 3 */}
          <Card className="p-5 border-sand-200 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-forest-700">
              <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Administrative Cross-Check</span>
            </div>
            <h3 className="font-serif text-base font-bold text-charcoal-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-forest-600" />
              Registration Validation
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              We cross-reference property details with the Uttarakhand Tourism Development Board (UTDB) and District Tourism Development Office (DTDO) homestay registry records to confirm legitimate registration.
            </p>
          </Card>

          {/* Stage 4 */}
          <Card className="p-5 border-sand-200 bg-white space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Standard Compliance</span>
            </div>
            <h3 className="font-serif text-base font-bold text-charcoal-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified Homestay Publication
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Upon verifying potable water, clean sanitation, host identity, and community support, the listing receives the green <em>Verified Homestay</em> badge and host contact details are made available to travelers.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. Principles of Responsible Travel */}
      <section className="bg-sand-100/70 p-6 sm:p-8 rounded-3xl border border-sand-200 space-y-4">
        <div className="flex items-center gap-2 text-forest-800">
          <ShieldCheck className="w-5 h-5 text-forest-700" />
          <h2 className="font-serif text-xl sm:text-2xl font-bold">
            StayLocal Traveler Conduct Charter
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed">
          When visiting rural Himalayan villages, travelers are guests in sensitive living communities. We request all travelers adhere to these foundational principles:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-charcoal-700 pt-2">
          <div className="p-3 bg-white rounded-xl border border-sand-200 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
            <span>
              <strong>Zero Litter Tolerance:</strong> Pack out all plastic waste and packaging; high alpine valleys lack industrial waste processing.
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-sand-200 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
            <span>
              <strong>Water Conservation:</strong> Respect village spring sources (Naulas and Dhāras); use water mindfully during dry seasons.
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-sand-200 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
            <span>
              <strong>Cultural Respect:</strong> Request permission before photographing artisans in their homes; respect sacred grove customs.
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-sand-200 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
            <span>
              <strong>Fair Compensation:</strong> Pay quoted artisan and homestay rates without demanding steep discounts that undercut rural livelihood.
            </span>
          </div>
        </div>
      </section>

      {/* 4. Host & Artisan Verification Contact */}
      <section className="bg-white p-8 rounded-3xl border border-sand-200 text-center space-y-4 shadow-sm">
        <HeartHandshake className="w-10 h-10 text-clay-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-charcoal-900">
          Join the StayLocal Homestay Network
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-600 max-w-lg mx-auto leading-relaxed">
          If you operate a registered homestay in Uttarakhand or lead a traditional craft collective, reach out to our team to initiate listing verification. We charge zero platform listing fees.
        </p>
        <div className="pt-2">
          <a
            href="mailto:verify@staylocal.org.in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-medium text-sm transition-colors shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Verification Team: verify@staylocal.org.in</span>
          </a>
        </div>
      </section>
    </div>
  );
};
