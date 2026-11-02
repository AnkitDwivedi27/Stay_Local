import { AccommodationRecord } from '../types';

export const ACCOMMODATIONS_DATA: AccommodationRecord[] = [
  {
    id: 'stay-mun-01',
    name: 'Anasuya Devi Homestay',
    description:
      'Family-run village residence in Sarmoli village, framed by views of the Panchachuli range. Host family practices traditional Himalayan kitchen farming with meals prepared using local grains and seasonal garden greens.',
    district: 'Pithoragarh',
    locality: 'Sarmoli',
    address: 'Sarmoli Village, Near Munsiyari Post Office, Pithoragarh, Uttarakhand 262554',
    coordinates: {
      latitude: 30.0712,
      longitude: 80.2395,
    },
    category: 'village_homestay',
    leadType: 'community_cooperative',
    contactDetails: {
      phone: '+91 96347 57840',
      email: 'sheelanitwal96334@gmail.com',
      contactPerson: 'Sheela Devi Nitwal (Representative)',
      isPubliclyListed: true,
    },
    localSpecialties: [
      'Authentic Shauka Cuisine (Bhang ki Chutney, Mandua Roti)',
      'Direct Village Walk to Mesar Kund',
      'Pashmina & Wool Spinning Insights',
    ],
    dataSource: 'NIDHI+ Directory (Uttarakhand Tourism Dept.)',
    sourceReference: 'StayLocal_Munsiyari_Homestay_Research.xlsx (Sheet: Homestay Leads, Row 2)',
    verificationStatus: 'verification_pending',
    publicationStatus: 'published',
    verificationNotes:
      'Public listing identified in national tourism directory. Field outreach scheduled to verify current host availability, room condition, and district registration certificate.',
    nextVerificationStep:
      'Confirm active operational status with Pithoragarh District Tourism Development Officer (DTDO) and obtain formal consent for StayLocal onboarding.',
    guestCapacity: {
      maxGuests: 4,
      roomCount: 2,
    },
    amenities: ['Home-Cooked Kumaoni Meals', 'Hot Water on Request', 'Mountain View Verandah'],
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-24T14:30:00Z',
  },
  {
    id: 'stay-mun-02',
    name: 'Mesar Kund Alpine Homestay',
    description:
      'Traditional stone-and-timber mountain home nestled along the pine trail ascending toward sacred Mesar Kund. Operated by local hosts actively participating in community forest stewardship.',
    district: 'Pithoragarh',
    locality: 'Sarmoli',
    address: 'Upper Sarmoli Trail, Munsiyari Sub-Division, Uttarakhand 262554',
    coordinates: {
      latitude: 30.0745,
      longitude: 80.2411,
    },
    category: 'village_homestay',
    leadType: 'direct_homestay',
    contactDetails: {
      phone: '+91 93899 58871',
      email: 'ravitolia16@gmail.com',
      contactPerson: 'Ravi Tolia',
      isPubliclyListed: true,
    },
    localSpecialties: [
      'Organic Farm Harvest Experience',
      'Guided Trail to Mesar Kund Sacred Pond',
      'Solar-Heated Alpine Living',
    ],
    dataSource: 'Direct Host Onboarding & Field Verification Protocol',
    sourceReference: 'StayLocal_Munsiyari_Homestay_Research.xlsx (Sheet: Homestay Leads, Row 5)',
    verificationStatus: 'verified',
    publicationStatus: 'published',
    verificationNotes:
      'Independently verified: host identity confirmed, village homestay license cross-checked with district records, sanitation standards inspected.',
    nextVerificationStep: 'Annual review scheduled for spring 2027.',
    guestCapacity: {
      maxGuests: 6,
      roomCount: 3,
    },
    pricePerNight: 2400,
    amenities: ['Verified Clean Private Rooms', 'Traditional Hearth', 'Solar Water Heating', 'Pure Spring Drinking Water'],
    createdAt: '2026-09-20T08:00:00Z',
    updatedAt: '2026-10-22T11:00:00Z',
  },
  {
    id: 'stay-bhm-01',
    name: 'Mehragaon Oak & Pine Farmstead',
    description:
      'Perched on the terraced slopes above Bhimtal lake basin, this generational family farm preserves indigenous Kumaoni fruit varieties, beehives, and natural water recharge catchment.',
    district: 'Nainital',
    locality: 'Mehragaon',
    address: 'Bhimtal-Bhowali Road, Mehragaon, Nainital District, Uttarakhand 263136',
    coordinates: {
      latitude: 29.3621,
      longitude: 79.5512,
    },
    category: 'heritage_farmstay',
    leadType: 'direct_homestay',
    contactDetails: {
      phone: '+91 98710 44219',
      email: 'contact@mehragaonfarm.in',
      contactPerson: 'Kalyan Singh Bisht',
      isPubliclyListed: true,
    },
    localSpecialties: [
      'Seasonal Apricot & Plum Picking',
      'Himalayan Multiflora Honey Tasting',
      'Sattal Birding Trail Departure Point',
    ],
    dataSource: 'Direct Host Verification & Field Inspection',
    sourceReference: 'StayLocal_Bhimtal_Research.xlsx (Sheet: Accommodation Leads, Row 3)',
    verificationStatus: 'verified',
    publicationStatus: 'published',
    verificationNotes:
      'Verified in October 2026. Uttarakhand Tourism registration validated. Organic agriculture certification inspected.',
    nextVerificationStep: 'Verified for 2026–2027 season.',
    guestCapacity: {
      maxGuests: 8,
      roomCount: 4,
    },
    pricePerNight: 2800,
    amenities: ['Terrace Orchard Gardens', 'Farm-to-Table Breakfast', 'Birding Guide Referral', 'Attached Bathrooms'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-20T16:00:00Z',
  },
  {
    id: 'stay-bhm-02',
    name: 'Sattal Forest Edge Cottage',
    description:
      'Identified research lead for an independent wooden cottage located near the freshwater wetland corridor of Sattal. Features tranquil forest surroundings and proximity to birdwatching hides.',
    district: 'Nainital',
    locality: 'Sattal Road',
    address: 'Near Sattal Lake Crossing, Nainital District, Uttarakhand 263139',
    category: 'eco_lodge',
    leadType: 'directory_entry',
    contactDetails: {
      isPubliclyListed: false,
    },
    localSpecialties: [
      'Over 200 Bird Species in Immediate Vicinity',
      'Dense Oak-Pine Canopy Silence',
    ],
    dataSource: 'Regional Hospitality Directory Aggregator',
    sourceReference: 'StayLocal_Bhimtal_Research.xlsx (Sheet: Accommodation Leads, Row 7)',
    verificationStatus: 'unverified_lead',
    publicationStatus: 'published',
    verificationNotes:
      'Unverified research lead. Contact details and environmental compliance currently unconfirmed. Not available for direct booking.',
    nextVerificationStep:
      'Initiate telephone outreach to property owner, confirm land use clearance with forest division, and schedule physical inspection.',
    guestCapacity: {
      maxGuests: 4,
      roomCount: 2,
    },
    amenities: ['Forest Setting', 'Walking Access to Sattal'],
    createdAt: '2026-10-18T14:00:00Z',
    updatedAt: '2026-10-18T14:00:00Z',
  },
  {
    id: 'stay-bag-01',
    name: 'Trishul Panorama Heritage Cottage',
    description:
      'Traditional mud-plaster and stone cottage situated on the high ridge of Kausani, offering unobstructed 180-degree vistas of Trishul, Nanda Devi, and Panchachuli. Built with locally sourced timber and slate roof shingles.',
    district: 'Bageshwar',
    locality: 'Kausani Ridge',
    address: 'Tea Estate Byway, Kausani, Bageshwar District, Uttarakhand 263639',
    coordinates: {
      latitude: 29.8542,
      longitude: 79.5968,
    },
    category: 'mountain_cottage',
    leadType: 'direct_homestay',
    contactDetails: {
      phone: '+91 94120 73501',
      email: 'stay@kausanipanorama.org',
      contactPerson: 'Devendra Pandey',
      isPubliclyListed: true,
    },
    localSpecialties: [
      'Morning Sunrise Viewing of Nanda Devi',
      'Walk to Organic Kausani Tea Garden',
      'Evening Astronomy & Dark Sky Gazing',
    ],
    dataSource: 'District Tourism Homestay Registry',
    sourceReference: 'StayLocal_Bageshwar_District_Research.xlsx (Sheet: Accommodation Leads, Row 4)',
    verificationStatus: 'verified',
    publicationStatus: 'published',
    verificationNotes:
      'Verified with District Tourism Office Bageshwar. Cleanliness, water source reliability, and host background verified.',
    nextVerificationStep: 'Compliant with StayLocal Standards.',
    guestCapacity: {
      maxGuests: 6,
      roomCount: 3,
    },
    amenities: ['Himalayan Panorama Deck', 'Traditional Hearth (Bukhari)', 'Locally Sourced Organic Meals', 'Clean Linens'],
    createdAt: '2026-09-12T11:00:00Z',
    updatedAt: '2026-10-21T10:15:00Z',
  },
  {
    id: 'stay-pit-01',
    name: 'Chandak Hillside Stone Homestay',
    description:
      'Family homestay identified on the ridgeline of Chandak hill overlooking the entire Soar valley bowl. Surrounded by deodar cedar trees and limestone formations.',
    district: 'Pithoragarh',
    locality: 'Chandak Hill',
    address: 'Near Mostamanu Temple Link Road, Chandak, Pithoragarh, Uttarakhand 262501',
    category: 'village_homestay',
    leadType: 'local_host',
    contactDetails: {
      phone: '+91 94561 22890',
      contactPerson: 'Mahesh Joshi',
      isPubliclyListed: true,
    },
    localSpecialties: [
      'Panoramic Sunset over Pithoragarh Town',
      'Nearby Ancient Mostamanu Temple Festival Ground',
      'Wild Mountain Mint & Jakhiya Infusions',
    ],
    dataSource: 'Regional Community Recommendations & Field Notes',
    sourceReference: 'StayLocal_Pithoragarh_Other_Regions_Research.xlsx (Sheet: Accommodation Leads, Row 2)',
    verificationStatus: 'verification_pending',
    publicationStatus: 'published',
    verificationNotes:
      'Preliminary telephone interview completed with host. Awaiting physical verification of guest rooms and submission of government ID and registration paperwork.',
    nextVerificationStep:
      'Field inspector visit scheduled for early November 2026 to verify sanitation, guest safety, and water access.',
    guestCapacity: {
      maxGuests: 5,
      roomCount: 2,
    },
    amenities: ['Valley View Terrace', 'Home Cooked Food', 'Quiet Rural Environment'],
    createdAt: '2026-10-12T12:00:00Z',
    updatedAt: '2026-10-24T18:00:00Z',
  },
];
