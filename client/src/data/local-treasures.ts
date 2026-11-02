import { LocalTreasureRecord } from '../types';

export const LOCAL_TREASURES_DATA: LocalTreasureRecord[] = [
  // =========================================================================
  // 1. MUNSIYARI & DARKOT (DISTRICT: PITHORAGARH)
  // Source: StayLocal_Munsiyari_Homestay_Research (2).xlsx
  // =========================================================================
  {
    id: 'trs-darkot-pashmina',
    title: 'Darkot Handwoven Pashmina & Himalayan Woollen Shawls',
    craftName: 'Pashmina & Sheep Wool Handloom Weaving',
    category: 'woollens_textiles',
    artisanOrShopName: 'Darkot Shauka Weavers Collective',
    artisanType: 'village_cluster',
    district: 'Pithoragarh',
    locality: 'Munsiari',
    village: 'Darkot',
    address: 'Darkot Village, 6 km from Munsiyari Bazar, Johar Valley, Pithoragarh, Uttarakhand 262554',
    coordinates: {
      latitude: 30.0768,
      longitude: 80.2452,
    },
    description:
      'Darkot is a historic mountain hamlet renowned as the handloom weaving center of Johar Valley. The indigenous Shauka (Bhotia) women weave exquisite, featherlight Pashmina, Angora, and pure mountain sheep-wool shawls, stoles, and mufflers on traditional pit-looms.',
    culturalSignificance:
      'The Shauka community historically traded across high Himalayan passes into western Tibet. When the trans-Himalayan trade routes closed, spinning and weaving wool became the heartbeat of community sustenance. Almost every traditional carved wooden home in Darkot houses a functional pit-loom (Rachh), keeping centuries of indigenous Himalayan textile knowledge alive.',
    productionProcess:
      'Raw sheep and Pashmina goat wool is hand-sorted, thoroughly cleaned in natural mountain springs, carded with fine wire brushes, and spun into delicate yarn using the handheld Takli spindle or Charkha wheel. The yarn is woven on wooden pit-looms using age-old twill and diamond-weave patterns, then gently hand-washed and air-dried under the Himalayan sun.',
    visitingInfo:
      'Artisan homes and workshops are open for visits Monday through Saturday, 9:00 AM – 5:00 PM. Visitors can witness live pit-loom weaving demonstrations and purchase shawls directly from artisan families without intermediary markups.',
    contact: {
      contactPerson: 'Darkot Village Weavers Council',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Darkot+Village+Munsiyari',
    images: [
      'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Official tourism planning document documents Darkot as a specialized Shauka weaving village.',
    sourceReference: 'StayLocal_Munsiyari_Homestay_Research (2).xlsx - Local Specialties / Uttarakhand Tourism planning document',
    nearbyClusters: ['Munsiari', 'Darkot', 'Sarmoli', 'Johar Valley'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-mun-thulma-chutka',
    title: 'Shauka Heavy Woollen Thulma Blankets & Dan Carpets',
    craftName: 'Traditional Woollen Thulma & Dan Knotting',
    category: 'woollens_textiles',
    artisanOrShopName: 'Johar Valley Wool Crafts Center',
    artisanType: 'artisan_collective',
    district: 'Pithoragarh',
    locality: 'Munsiari',
    village: 'Sarmoli',
    address: 'Sarmoli Craft Cooperative, Sarmoli Village, Munsiari, Uttarakhand 262554',
    coordinates: {
      latitude: 30.0682,
      longitude: 80.2375,
    },
    description:
      'Handcrafted heavy blankets (Thulma), fluffy sheep-pile seating rugs (Chutka), and Tibetan-influenced hand-knotted woollen carpets (Dans) crafted by master Shauka weavers in Sarmoli and Munsiari.',
    culturalSignificance:
      'Thulmas and Chutkas were engineered to endure sub-zero Himalayan winters at high altitudes. Traditionally woven as sacred heirlooms gifted during weddings, their geometric motifs reflect Johar Valley folk cosmology, mountain flora, and ancestral trade caravan routes.',
    productionProcess:
      'Coarse indigenous mountain sheep wool is spun into thick warps and wefts. For Thulmas, the fabric is felted after weaving by immersing it in boiling mountain water mixed with wild soapnuts (Reetha) and trodden underfoot to lock the fibers, yielding a windproof, dense thermal fleece.',
    visitingInfo:
      'Visitors can visit the cooperative weaving sheds in Sarmoli Village. Open daily 10:00 AM – 4:00 PM. Weavers explain the felting and carding tools.',
    contact: {
      contactPerson: 'Sarmoli Women Craft Cooperative Coordinator',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Sarmoli+Village+Munsiyari',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Documented in Uttarakhand Tourism master plan for Johar Valley community livelihood clusters.',
    sourceReference: 'StayLocal_Munsiyari_Homestay_Research (2).xlsx - Local Specialties / Uttarakhand Tourism planning document',
    nearbyClusters: ['Munsiari', 'Sarmoli', 'Darkot', 'Johar Valley'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-mun-rajma-spices',
    title: 'Munsiyari High-Altitude White Rajma & Wild Jambu Spices',
    craftName: 'Organic Mountain Agriculture & Foraging',
    category: 'local_food_produce',
    artisanOrShopName: 'Munsiari Organic Farmers Guild',
    artisanType: 'village_cluster',
    district: 'Pithoragarh',
    locality: 'Munsiari',
    village: 'Sarmoli',
    address: 'Main Bazaar Road & Sarmoli Farm Hub, Munsiari, Uttarakhand 262554',
    coordinates: {
      latitude: 30.0671,
      longitude: 80.2388,
    },
    description:
      'Famed GI-tagged high-altitude white kidney beans (Munsiyari Rajma), naturally sun-dried alpine potatoes, and wild Himalayan chive herb (Jambu / Faran / Gandherani) harvested from alpine pastures above 3,000 meters.',
    culturalSignificance:
      'Munsiyari Rajma cooks rapidly due to its soft skin and high mineral content from glacial meltwater soils. Jambu and Gandherani are staple seasoning herbs of Shauka mountain gastronomy, prized for both their aromatic tempering qualities and digestive medicinal properties.',
    productionProcess:
      'Cultivated completely without synthetic chemicals on stone-terraced fields fed by Himalayan glacial streams. Harvested by hand in early autumn, sun-cured on woven Ringal mats, and hand-cleaned by village farming households.',
    visitingInfo:
      'Available fresh at the village farm-gates in Sarmoli and directly at producer stalls in Munsiyari Main Bazaar. Best season to purchase is September through April.',
    contact: {
      contactPerson: 'Sarmoli Organic Farmers Coordinator',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Munsiyari+Bazaar',
    images: [
      'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Official Uttarakhand state GI produce documentation and district agricultural research.',
    sourceReference: 'StayLocal_Munsiyari_Homestay_Research (2).xlsx - Local Specialties',
    nearbyClusters: ['Munsiari', 'Sarmoli', 'Darkot'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-mun-aipankari-lead',
    title: 'Aipankari Traditional Craft Workshop (Research Lead)',
    craftName: 'Kumaoni Aipan & Folk Crafts',
    category: 'traditional_art',
    artisanOrShopName: 'Aipankari Studio',
    artisanType: 'local_shop',
    district: 'Pithoragarh',
    locality: 'Munsiari',
    address: 'Bazar Road / Main Market Area, Munsiari / Pithoragarh',
    description:
      'Preliminary research lead for an artisan workshop creating traditional Kumaoni Aipan folk paintings, ritual bookmarks, hand-painted wooden coasters, and ceremonial fabrics.',
    culturalSignificance:
      'Represents local efforts to adapt age-old Aipan folk art onto sustainable mountain handicrafts and decorative utility items.',
    productionProcess:
      'Terracotta brick red pigment (Geru) base topped with freehand motifs painted using fine bamboo brushes and rice paste.',
    visitingInfo:
      'Artisan identity and walk-in visiting hours pending direct field validation. Please contact local tourism coordinators before visiting.',
    contact: {
      phone: '+91 79736 15955',
      isPubliclyVerified: false,
    },
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'unverified_lead',
    verificationNotes:
      'Map/business directory listing surfaced in initial research; artisan studio location and local handmade provenance require field interview.',
    sourceReference: 'StayLocal_Munsiyari_Homestay_Research (2).xlsx - Craft & Seller Leads',
    researchNotes: 'Confirm whether products are made locally in Munsiari or sourced from Almora/Haldwani.',
    nearbyClusters: ['Munsiari', 'Sarmoli'],
    isActive: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // =========================================================================
  // 2. PITHORAGARH TOWN & REGIONAL CLUSTERS
  // Source: StayLocal_Pithoragarh_Other_Regions_Research.xlsx
  // =========================================================================
  {
    id: 'trs-pit-aipan-art',
    title: 'Sacred Kumaoni Aipan Folk Art & Ceremonial Chowkis',
    craftName: 'Aipan Floor & Wall Painting',
    category: 'traditional_art',
    artisanOrShopName: 'Pithoragarh Traditional Aipan Guild',
    artisanType: 'artisan_collective',
    district: 'Pithoragarh',
    locality: 'Pithoragarh Town',
    village: 'Kumour',
    address: 'Kumour Folk Arts Centre, Near Chandak Road, Pithoragarh, Uttarakhand 262501',
    coordinates: {
      latitude: 29.5828,
      longitude: 80.2182,
    },
    description:
      'Aipan is the sacred ritualistic folk art of Kumaon. Women artists paint intricate geometric mandalas, lotus motifs, feet of Goddess Lakshmi, and Vasudhara designs on freshly plastered terracotta clay surfaces using ground white rice paste (Biswar).',
    culturalSignificance:
      'Practiced since the Katyuri dynasty, Aipan is integral to every rite of passage in Kumaoni households—births (Namkaran), sacred thread ceremonies (Janeu), weddings, and Diwali. Each geometric design carries deep spiritual symbolism invoking cosmic protection and agrarian abundance.',
    productionProcess:
      'The surface (natural slate, dried wood, or handmade cloth) is first treated with rich red terracotta clay (Geru). Once dried, artists dip the last three fingers of their right hand or fine squirrel-hair brushes into fresh rice flour paste (Biswar) to execute freehand, symmetrical sacred geometry without stencils.',
    visitingInfo:
      'Workshops in Kumour and Chandak welcome visitors from 10:00 AM – 4:30 PM. Live demonstrations and interactive workshops are available by prior appointment.',
    contact: {
      contactPerson: 'Master Aipan Artisan Coordinator',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Kumour+Pithoragarh',
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Official district cultural heritage documentation from National Informatics Centre (NIC Pithoragarh).',
    sourceReference: 'StayLocal_Pithoragarh_Other_Regions_Research.xlsx - Local Specialties / https://pithoragarh.nic.in/culture-heritage/',
    nearbyClusters: ['Pithoragarh Town', 'Chandak Hill', 'Kumour'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-pit-pichhaura',
    title: 'Traditional Sacred Pichhaura Bridal Stoles & Textiles',
    craftName: 'Pichhaura Hand-Block Dyeing & Embroidery',
    category: 'woollens_textiles',
    artisanOrShopName: 'Saraswati Pichhaura Artisans',
    artisanType: 'heritage_workshop',
    district: 'Pithoragarh',
    locality: 'Pithoragarh Town',
    address: 'Naya Bazar Craft Lane, Pithoragarh, Uttarakhand 262501',
    coordinates: {
      latitude: 29.584,
      longitude: 80.2195,
    },
    description:
      'Pichhaura is the distinctive saffron and crimson ceremonial drape worn by Kumaoni brides and married women during religious festivals, weddings, and pujas. Features the sacred Swastika, Sun, Moon, Conch shell, and Bell motifs.',
    culturalSignificance:
      'A Pichhaura is the ultimate auspicious symbol of a married woman (Suhag) in Uttarakhand. Passed down through generations, wearing it is believed to invoke the protective blessings of Goddess Parvati and ancestral deities.',
    productionProcess:
      'Fine woven silk or cotton cloth is dyed in vibrant turmeric saffron-yellow. The central Swastika medallion, surrounded by 108 auspicious dots and floral paisleys, is hand-printed or block-dyed using deep crimson red dye (Roli), followed by delicate zari and beadwork on the outer borders.',
    visitingInfo:
      'Open Monday to Saturday, 10:00 AM – 6:00 PM at Naya Bazar artisans lane.',
    contact: {
      contactPerson: 'Pichhaura Guild Secretary',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Naya+Bazar+Pithoragarh',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Documented on official district heritage portal and Uttarakhand State Handloom board.',
    sourceReference: 'StayLocal_Pithoragarh_Other_Regions_Research.xlsx - Local Specialties / https://pithoragarh.nic.in/culture-heritage/',
    nearbyClusters: ['Pithoragarh Town', 'Chandak Hill'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-pit-ringal-doka',
    title: 'Ringal Bamboo Doka Baskets & Mosta Mats',
    craftName: 'Ringal Bamboo Weaving',
    category: 'handicrafts_carvings',
    artisanOrShopName: 'Himalayan Ringal Weavers Guild',
    artisanType: 'village_cluster',
    district: 'Pithoragarh',
    locality: 'Chandak Hill',
    village: 'Chandak',
    address: 'Mostamanu Trail, Chandak Hill, Pithoragarh, Uttarakhand 262501',
    coordinates: {
      latitude: 29.6012,
      longitude: 80.2054,
    },
    description:
      'Cone-shaped conical load baskets (Doka), storage bins (Pitar), water-resistant floor mats (Mosta), and winnowing trays hand-woven from high-altitude dwarf bamboo (Ringal).',
    culturalSignificance:
      'Ringal bamboo is an indispensable material for Himalayan agrarian life, used for carrying firewood and fodder across steep mountain trails. The specialized weaving community possesses deep generational knowledge of sustainable harvesting cycles that prune and regenerate bamboo groves.',
    productionProcess:
      'Dwarf bamboo reeds (Chimtu Ringal) are sustainably harvested from moist sub-alpine forest slopes in late autumn. The canes are split into micro-fine flexible slivers using a sickle, soaked in cold mountain springs, and tightly woven into waterproof or breathing weave patterns.',
    visitingInfo:
      'Artisans can be observed along the Chandak-Mostamanu path. Morning hours 9:00 AM – 1:00 PM are ideal for watching reed splitting and basket weaving.',
    contact: {
      contactPerson: 'Chandak Ringal Craft Representative',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Chandak+Pithoragarh',
    images: [
      'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Official district cultural survey notes Ringal weaving across Chandak and Didihat hill slopes.',
    sourceReference: 'StayLocal_Pithoragarh_Other_Regions_Research.xlsx - Local Specialties / https://pithoragarh.nic.in/culture-heritage/',
    nearbyClusters: ['Chandak Hill', 'Pithoragarh Town', 'Didihat'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-pit-hilljatra-masks',
    title: 'Hilljatra Festival Hand-Carved Wooden Masks & Dikaras Figures',
    craftName: 'Wooden Mask Carving & Sacred Clay Sculpting',
    category: 'cultural_heritage',
    artisanOrShopName: 'Kumour Hilljatra Heritage Trust',
    artisanType: 'artisan_collective',
    district: 'Pithoragarh',
    locality: 'Pithoragarh Town',
    village: 'Kumour',
    address: 'Kumour Village, 3 km from Pithoragarh Town, Uttarakhand 262501',
    coordinates: {
      latitude: 29.587,
      longitude: 80.224,
    },
    description:
      'Exotic hand-carved wooden theatrical masks depicting Lakhia Bhoot (attendant of Lord Shiva), divine bulls, and deer used in the historic agrarian Hilljatra pastoral theatre, alongside Dikaras clay figurines crafted for the monsoon Harela festival.',
    culturalSignificance:
      'The Hilljatra festival is unique to Sor Valley, originally introduced through historical royal ties with the Kathmandu Valley. The masks are treated as living deities endowed with spiritual power during performance cycles celebrating cattle farming and paddy transplantation.',
    productionProcess:
      'Carved from seasoned mountain timber (Bhojpatra, Tun, or Deodar) using traditional gouges and chisels. Faces are painted using mineral pigments and natural lacquers. Dikaras are sculpted from fertile river clay and painted with vibrant natural watercolors.',
    visitingInfo:
      'Heritage sanctuary and carving workshops open during festive seasons and by prior inquiry. Respectful observation is requested.',
    contact: {
      contactPerson: 'Kumour Heritage Preservation Committee',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Kumour+Pithoragarh',
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Documented on official district administration tourism page (https://pithoragarh.nic.in/culture-heritage/).',
    sourceReference: 'StayLocal_Pithoragarh_Other_Regions_Research.xlsx - Local Specialties',
    nearbyClusters: ['Pithoragarh Town', 'Kumour', 'Chandak Hill'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // =========================================================================
  // 3. BHIMTAL & NAINITAL REGION
  // Source: StayLocal_Bhimtal_Research.xlsx
  // =========================================================================
  {
    id: 'trs-bhm-folk-museum',
    title: "Folk Culture Museum (Lok Sanskriti Sangrahalaya) - Woodcraft & Heritage",
    craftName: 'Kumaoni Woodcarving & Archaeological Heritage',
    category: 'cultural_heritage',
    artisanOrShopName: "Dr. Mathpal's Folk Culture Museum & Craft Gallery",
    artisanType: 'heritage_workshop',
    district: 'Nainital',
    locality: 'Bhimtal',
    village: 'Mahargaon',
    address: 'Bhowali-Kutani Road, Kutani, Mahargaon, Bhimtal, Uttarakhand 263136',
    coordinates: {
      latitude: 29.3582,
      longitude: 79.5448,
    },
    description:
      'Founded by renowned archaeologist, painter, and ethnographer Dr. Yashodhar Mathpal. Houses a priceless living archive of traditional Kumaoni woodcarvings (Kholi entrance doors, carved pillars), prehistoric Himalayan rock art reproductions, Aipan murals, handlooms, and ancient musical instruments.',
    culturalSignificance:
      'The museum is the paramount institution dedicated to rescuing disappearing Uttarakhand folk technologies, wooden architectural joinery, and ritual implements before they were replaced by modern concrete.',
    productionProcess:
      'Demonstrates traditional Kumaoni relief woodcarving techniques on seasoned Tun and Walnut wood, replicating intricate floral and mythological door lintels (Kholis) typical of 18th-century mountain manor homes.',
    visitingInfo:
      'Open daily 9:00 AM – 5:30 PM. Small entry ticket at the gate. Guided walk-throughs offer deep insights into Kumaon rural heritage.',
    contact: {
      phone: '+91 94120 94613',
      contactPerson: 'Museum Operations Desk',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Folk+Culture+Museum+Bhimtal',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Official cultural landmark documented in Uttarakhand Tourism Bhimtal destination directory.',
    sourceReference: 'StayLocal_Bhimtal_Research.xlsx - Local Specialties & Community Leads',
    nearbyClusters: ['Bhimtal', 'Mehragaon', 'Kutani', 'Mahargaon', 'Bhowali'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-bhm-nirvana-organic',
    title: 'Nirvana Organic - Mountain Honey, Herbs & Craft Preserves (Research Lead)',
    craftName: 'Organic Wild Honey & Agro-Preserves',
    category: 'local_food_produce',
    artisanOrShopName: 'Nirvana Organic Outlet',
    artisanType: 'local_shop',
    district: 'Nainital',
    locality: 'Bhimtal',
    village: 'Mehragaon',
    address: 'Mehragaon, Bhimtal, Uttarakhand 263136',
    description:
      'Preliminary business lead for raw high-altitude wildflower honey, sun-dried wild herbs, cold-pressed Himalayan mustard oil, and local handcraft souvenirs.',
    culturalSignificance:
      'Highlights wild forest beekeeping traditions and smallholder agro-processing across the oak-pine belt of Bhimtal.',
    productionProcess:
      'Wild forest hives harvested sustainably without heating or processing, paired with mountain sun-dried herbs.',
    visitingInfo:
      'Unverified retail lead; confirm current operational status and artisan origin directly before visiting.',
    contact: {
      phone: '+91 99971 81192',
      isPubliclyVerified: false,
    },
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'unverified_lead',
    verificationNotes: 'Public business directory lead; product origin and direct maker engagement require verification.',
    sourceReference: 'StayLocal_Bhimtal_Research.xlsx - Community & Business Leads',
    researchNotes: 'Confirm whether honey is wild-harvested locally in Mehragaon or packaged from external suppliers.',
    nearbyClusters: ['Bhimtal', 'Mehragaon'],
    isActive: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-bhm-deejay-preserves',
    title: 'Deejay Food Processing - Hill Fruit Squashes & Jams (Research Lead)',
    craftName: 'Regional Fruit Processing & Preserves',
    category: 'local_food_produce',
    artisanOrShopName: 'Deejay Food Processing',
    artisanType: 'local_shop',
    district: 'Nainital',
    locality: 'Bhimtal',
    village: 'Mehragaon',
    address: 'A-15, SIIDCUL Industrial Estate, Bhimtal, Uttarakhand 263136',
    description:
      'Regional agro-processing unit for authentic Himalayan Rhododendron (Buransh) flower squash, apricot kernel oil, and handmade hill fruit preserves.',
    culturalSignificance:
      'Buransh squash is the iconic welcome drink of Uttarakhand mountain hospitality, renowned for cardiovascular and cooling health benefits.',
    productionProcess:
      'Freshly foraged wild rhododendron petals steeped and boiled with raw sugar and mountain lime juice.',
    visitingInfo:
      'Industrial lead; retail visitor counter availability to be confirmed.',
    contact: {
      isPubliclyVerified: false,
    },
    images: [
      'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'unverified_lead',
    verificationNotes: 'Public industrial directory listing; verify walk-in purchase availability and local fruit sourcing.',
    sourceReference: 'StayLocal_Bhimtal_Research.xlsx - Community & Business Leads',
    nearbyClusters: ['Bhimtal', 'Mehragaon'],
    isActive: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // =========================================================================
  // 4. BAGESHWAR & KAUSANI
  // Source: StayLocal_Bageshwar_District_Research (1).xlsx
  // =========================================================================
  {
    id: 'trs-bag-kausani-shawls',
    title: 'Kausani Handloom Woollen Shawls, Tweeds & Stoles',
    craftName: 'Handloom Woollen Weaving',
    category: 'woollens_textiles',
    artisanOrShopName: 'Kausani Handloom Weaving Center',
    artisanType: 'artisan_collective',
    district: 'Bageshwar',
    locality: 'Kausani',
    village: 'Pingalkot',
    address: 'Pingalkot / Dauni Road, Kausani, District Bageshwar, Uttarakhand 263639',
    coordinates: {
      latitude: 29.8515,
      longitude: 79.5982,
    },
    description:
      'Handcrafted Kumaoni shawls, hand-spun Merino stoles, and rugged mountain tweed jackets woven on traditional frame and floor looms by village women cooperatives in the Kausani hills.',
    culturalSignificance:
      'Promoted following Mahatma Gandhi’s historic 1929 stay at Anasakti Ashram in Kausani, where he championed Khadi, self-reliance, and local handloom cottage industry for mountain women.',
    productionProcess:
      'Pure Australian merino wool and local mountain wool are hand-spun into fine counts, dyed with non-toxic dyes, and woven on hand-operated wooden shuttle fly looms featuring signature Himalayan border designs.',
    visitingInfo:
      'Open daily 8:30 AM – 6:00 PM. Visitors can walk onto the weaving floor, watch the shuttle fly across the warp, and purchase authentic hand-tagged woollens directly from the cooperative.',
    contact: {
      phone: '+91 89370 61061',
      contactPerson: 'Kausani Shawl Workshop Supervisor',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Kausani+Shawl+Factory',
    images: [
      'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Verified attraction documented in Uttarakhand Tourism Kausani destination guide.',
    sourceReference: 'StayLocal_Bageshwar_District_Research (1).xlsx - Local Specialties & Community Leads',
    nearbyClusters: ['Kausani', 'Pingalkot', 'Dauni', 'Bageshwar'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-bag-kausani-tea',
    title: 'Kausani Organic Orthodox Black & Green Tea',
    craftName: 'Orthodox Himalayan Tea Processing',
    category: 'local_food_produce',
    artisanOrShopName: 'Kausani Tea Estate (Girias Estate)',
    artisanType: 'heritage_workshop',
    district: 'Bageshwar',
    locality: 'Kausani',
    address: 'Kausani Tea Estate, Pingalkot Slopes, Kausani, Uttarakhand 263639',
    coordinates: {
      latitude: 29.864,
      longitude: 79.593,
    },
    description:
      'Organic high-altitude orthodox green and black teas cultivated on scenic terraced slopes facing the Trishul, Nanda Devi, and Panchachuli peaks at an elevation of 1,800 meters.',
    culturalSignificance:
      'Established in the British era and revitalized by the Uttarakhand Tea Development Board, Kausani tea represents the finest high-altitude Himalayan tea gardens outside Darjeeling.',
    productionProcess:
      'Two leaves and a bud are delicately hand-plucked during seasonal flushes (Spring Flush & Autumn Flush), withered, gently rolled in miniature orthodox rollers to release aromatic catechins, and fired to preserve floral undertones.',
    visitingInfo:
      'Tea gardens and retail sales counter open daily 9:00 AM – 5:00 PM. Visitors can stroll through tea bushes and sample freshly brewed tea.',
    contact: {
      contactPerson: 'Kausani Estate Tasting Desk',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Kausani+Tea+Estate',
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Official tourism destination feature documented in Uttarakhand Tourism Kausani guide.',
    sourceReference: 'StayLocal_Bageshwar_District_Research (1).xlsx - Local Specialties',
    nearbyClusters: ['Kausani', 'Pingalkot', 'Bageshwar'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-bag-tamta-copper',
    title: 'Traditional Bageshwar Hand-Beaten Copperware (Tamta Craft)',
    craftName: 'Hand-Beaten Copper Metallurgy',
    category: 'handicrafts_carvings',
    artisanOrShopName: 'Bageshwar Tamta Artisan Guild',
    artisanType: 'artisan_collective',
    district: 'Bageshwar',
    locality: 'Bageshwar',
    village: 'Matiyoli',
    address: 'Tamta Mohalla & Saras Market, Near District Hospital, Bageshwar, Uttarakhand 263642',
    coordinates: {
      latitude: 29.8405,
      longitude: 79.7712,
    },
    description:
      'Iconic hand-hammered pure copper water vessels (Gaggar, Lota, Tamku), traditional ceremonial prayer utensils, and cooking pots hand-beaten by the historic Tamta metalsmiths of Bageshwar.',
    culturalSignificance:
      'The Tamta coppersmiths have lived at the sacred confluence of Saryu and Gomti for over 400 years, originally patronized by Chand and Katyuri kings to forge royal mint copper coins and temple urns.',
    productionProcess:
      'Raw copper ingots are repeatedly heated in open charcoal hearths, annealed, and meticulously hand-hammered on heavy iron anvils into seamless shapes with distinctive dimpled surface textures that optimize structural durability.',
    visitingInfo:
      'Artisans can be visited at Tamta Mohalla near Saras Market. Open 10:00 AM – 6:00 PM. Best experienced during morning forging hours.',
    contact: {
      contactPerson: 'Tamta Coppersmith Guild Secretary',
      isPubliclyVerified: true,
    },
    locationLink: 'https://maps.google.com/?q=Saras+Market+Bageshwar',
    images: [
      'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Official district cultural survey notes Bageshwar traditional coppersmith heritage.',
    sourceReference: 'StayLocal_Bageshwar_District_Research (1).xlsx - Local Specialties & Community Leads',
    nearbyClusters: ['Bageshwar', 'Matiyoli', 'Kausani'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trs-bag-danu-woolens',
    title: 'Danu Woolens - Almora-Bageshwar Road Workshop (Research Lead)',
    craftName: 'Traditional Mountain Woollen Knitting',
    category: 'woollens_textiles',
    artisanOrShopName: 'Danu Woolens',
    artisanType: 'local_shop',
    district: 'Bageshwar',
    locality: 'Bageshwar',
    village: 'Kaphalkhet',
    address: 'Almora-Bageshwar Road, Kaphalkhet, Bageshwar, Uttarakhand',
    description:
      'Research lead for a roadside workshop and retail center offering hand-knitted caps, pure woollen sweaters, and mountain wraps.',
    culturalSignificance:
      'Reflects pastoral migration wool traditions between higher Bageshwar valleys and lower markets.',
    productionProcess:
      'Indigenous wool spinning and hand-frame knitting.',
    visitingInfo:
      'Unverified lead; verify opening hours and handmade provenance before visiting.',
    contact: {
      phone: '+91 94565 12529',
      isPubliclyVerified: false,
    },
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    ],
    verificationStatus: 'unverified_lead',
    verificationNotes: 'Public business directory listing; current operation and artisan origin need confirmation.',
    sourceReference: 'StayLocal_Bageshwar_District_Research (1).xlsx - Community & Business Leads',
    nearbyClusters: ['Bageshwar', 'Kaphalkhet'],
    isActive: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];
