/**
 * Curated starter catalogue (Oct 2026 snapshot of Reactive Outdoor FR/EU + Kilos Gear).
 * Regional duplicates of the source stores are consolidated into size/pack variants.
 * Run `npm run import:catalog` to sync the complete, up-to-date catalogues (images, variants, prices).
 * Copy below is original Vanguard Outdoor copy (EN/FR/DE).
 */

export const categories = [
  { slug: 'camping', sort: 1, name: { en: 'Tents & Shelters', fr: 'Tentes & abris', de: 'Zelte & Unterstände' },
    description: { en: 'Instant tents, cabins and screen shelters that pitch in seconds.', fr: 'Tentes instantanées, cabines et abris moustiquaires montés en quelques secondes.', de: 'Sofortzelte, Kabinenzelte und Moskitounterstände – in Sekunden aufgebaut.' } },
  { slug: 'sleeping', sort: 2, name: { en: 'Sleep & Relax', fr: 'Couchage & détente', de: 'Schlafen & Entspannen' },
    description: { en: 'Sleeping pads and hammocks for real rest outdoors.', fr: 'Matelas et hamacs pour un vrai repos en pleine nature.', de: 'Isomatten und Hängematten für echte Erholung draußen.' } },
  { slug: 'furniture', sort: 3, name: { en: 'Chairs & Tables', fr: 'Chaises & tables', de: 'Stühle & Tische' },
    description: { en: 'Camp furniture engineered for comfort and packability.', fr: 'Mobilier de camp pensé pour le confort et la compacité.', de: 'Campingmöbel für Komfort und kleines Packmaß.' } },
  { slug: 'lighting', sort: 4, name: { en: 'Lighting', fr: 'Éclairage', de: 'Beleuchtung' },
    description: { en: 'Lanterns, headlamps and string lights for after dark.', fr: 'Lanternes, frontales et guirlandes pour la nuit tombée.', de: 'Laternen, Stirnlampen und Lichterketten für die Nacht.' } },
  { slug: 'hiking', sort: 5, name: { en: 'Hiking & Packing', fr: 'Randonnée & rangement', de: 'Wandern & Packen' },
    description: { en: 'Light, compressible essentials for the trail.', fr: 'Essentiels légers et compressibles pour le sentier.', de: 'Leichte, komprimierbare Essentials für den Trail.' } },
  { slug: 'transport', sort: 6, name: { en: 'Wagons & Beach', fr: 'Chariots & plage', de: 'Bollerwagen & Strand' },
    description: { en: 'All-terrain wagons that roll over sand, gravel and grass.', fr: 'Chariots tout-terrain qui roulent sur sable, gravier et herbe.', de: 'Geländetaugliche Wagen für Sand, Kies und Wiese.' } },
  { slug: 'clothing', sort: 7, name: { en: 'Clothing', fr: 'Vêtements', de: 'Bekleidung' },
    description: { en: 'Technical layers for every season.', fr: 'Couches techniques pour toutes les saisons.', de: 'Technische Lagen für jede Jahreszeit.' } },
  { slug: 'accessories', sort: 8, name: { en: 'Accessories', fr: 'Accessoires', de: 'Zubehör' },
    description: { en: 'Fans, racks, shades, spare parts and camp upgrades.', fr: 'Ventilateurs, étagères, pare-soleil, pièces détachées et upgrades.', de: 'Ventilatoren, Regale, Sonnenschutz, Ersatzteile und Upgrades.' } },
];

const KG = 'https://cdn.shopify.com/s/files/1/0581/5579/4624';
const RO = 'https://cdn.shopify.com/s/files/1/0366/1889/5405';

// v(title, priceEUR, compareEUR, stock, weightKg)
const v = (title, price, compare = null, stock = 25, kg = 2) => ({ title, price, compare, stock, kg });

export const products = [
  // ───────────── Reactive Outdoor ─────────────
  {
    brand: 'reactive-outdoor', handle: '3-secs-tent', category: 'camping', featured: true, rating: 4.8,
    title: { en: '3 Secs Tent', fr: 'Tente 3 Secs', de: '3-Sekunden-Zelt' },
    description: {
      en: 'Pop it open and it stands: the 3 Secs Tent sets up in seconds with no poles to thread. Waterproof flysheet, ventilated mesh and a carry bag that fits any boot.',
      fr: 'Ouvrez-la, elle tient debout : la Tente 3 Secs se monte en quelques secondes, sans arceaux à enfiler. Double toit imperméable, moustiquaire ventilée et housse compacte.',
      de: 'Aufklappen, fertig: Das 3-Sekunden-Zelt steht in Sekunden – ohne Stangenfädeln. Wasserdichtes Außenzelt, belüftetes Mesh und kompakte Tragetasche.',
    },
    highlights: {
      en: ['Instant pop-up setup', 'Waterproof rain fly', 'Free camping tarp with Large size', 'Fits 1–3 people'],
      fr: ['Montage instantané', 'Double toit imperméable', 'Bâche offerte avec la taille Large', '1 à 3 personnes'],
      de: ['Sofortaufbau', 'Wasserdichtes Überzelt', 'Gratis-Plane bei Größe L', 'Für 1–3 Personen'],
    },
    images: [`${RO}/products/Product-Image_d0375386-c89f-41c4-a0c4-b6c46fa7d247.jpg?v=1750810718`, `${RO}/files/For-1-2-person_0f807493-b72f-4cb9-bbb0-d18471b28d8d.jpg?v=1750810718`],
    variants: [v('Small · 1–2 people', 109.95, 218.95, 40, 3.2), v('Large · 2–3 people + tarp', 139.95, 279.9, 30, 4.1), v('Family pack · S + L + 2 tarps', 199.95, 519.8, 15, 7.5)],
  },
  {
    brand: 'reactive-outdoor', handle: '2-step-cabin-tent', category: 'camping', featured: true, rating: 4.7,
    title: { en: '2-Step Cabin Tent', fr: 'Tente cabine 2-Step', de: '2-Schritt-Kabinenzelt' },
    description: {
      en: 'Family-size cabin tent that goes up in two moves. Near-vertical walls, full standing height and a free camping tarp included.',
      fr: 'Tente cabine familiale montée en deux gestes. Parois quasi verticales, hauteur debout et bâche de camping offerte.',
      de: 'Familien-Kabinenzelt, aufgebaut in zwei Schritten. Fast senkrechte Wände, volle Stehhöhe und kostenlose Campingplane.',
    },
    highlights: {
      en: ['Two-step setup', 'Standing height', 'Free tarp included', 'Up to 10 people'],
      fr: ['Montage en 2 étapes', 'Hauteur debout', 'Bâche offerte', "Jusqu'à 10 personnes"],
      de: ['Aufbau in 2 Schritten', 'Stehhöhe', 'Plane inklusive', 'Bis zu 10 Personen'],
    },
    images: [`${RO}/files/EN_-_6P_Buybox_9622455e-84ea-4442-a2a5-6cd187e20e94.jpg?v=1765854939`, `${RO}/files/First_Image_-_1_ca56c5dd-9cb9-4eba-a2f8-9fb306d43f9e.jpg?v=1765854528`, `${RO}/files/Carousel_5_-_People_4_5409aa5e-6185-4bca-a061-b2906c20626b.jpg?v=1765854528`, `${RO}/files/Carousel_4_-_People_5_46584b2a-62e6-4f55-b50f-c57ba4a70714.jpg?v=1765854528`, `${RO}/files/Review_3_0f7242eb-ac65-479c-ba55-7afd72b10987.jpg?v=1765854528`, `${RO}/files/2SC_Buybox_6p.jpg?v=1765855262`],
    variants: [v('Small · up to 4 people', 269.95, 539.9, 12, 11), v('Large · up to 6 people', 272.95, 545.95, 12, 14), v('Extra Large · up to 10 people', 363.95, 956.95, 8, 19)],
  },
  {
    brand: 'reactive-outdoor', handle: '2-step-suv-tent', category: 'camping', rating: 4.6,
    title: { en: '2-Step SUV Tent', fr: 'Tente SUV 2-Step', de: '2-Schritt-SUV-Zelt' },
    description: {
      en: 'Connects to the tailgate of your SUV or van to extend your living space. Two-step pitch, free camping tarp included.',
      fr: "Se raccorde au hayon de votre SUV ou van pour agrandir l'espace de vie. Montage en deux étapes, bâche offerte.",
      de: 'Wird an die Heckklappe von SUV oder Van angeschlossen und erweitert den Wohnraum. Aufbau in zwei Schritten, Plane inklusive.',
    },
    highlights: { en: ['Tailgate connection', 'Up to 8 people'], fr: ['Raccord au hayon', "Jusqu'à 8 personnes"], de: ['Heckklappen-Anschluss', 'Bis zu 8 Personen'] },
    images: [`${RO}/files/2SS6PBuybox.jpg?v=1783651543`],
    variants: [v('Large · up to 6 people', 363.95, 727.95, 8, 15), v('Extra Large · up to 8 people', 409.95, 1075.95, 6, 18)],
  },
  {
    brand: 'reactive-outdoor', handle: 'ez-bugout-screen-tent', category: 'camping', rating: 4.6,
    title: { en: 'EZ BugOut Screen Tent', fr: 'Abri moustiquaire EZ BugOut', de: 'EZ BugOut Moskitozelt' },
    description: {
      en: 'A bug-free outdoor living room. Fine mesh walls, wide doors and quick setup for up to 11 people.',
      fr: "Un salon d'extérieur sans insectes. Parois en maille fine, larges portes et montage rapide jusqu'à 11 personnes.",
      de: 'Ein insektenfreies Wohnzimmer im Freien. Feinmaschige Wände, breite Türen und schneller Aufbau für bis zu 11 Personen.',
    },
    highlights: { en: ['Fine insect mesh', 'Up to 11 people'], fr: ['Maille anti-insectes', "Jusqu'à 11 personnes"], de: ['Feines Insektennetz', 'Bis zu 11 Personen'] },
    images: [`${RO}/files/EBSTBuybox-11P_XL.jpg?v=1776748003`],
    variants: [v('Extra Large · up to 11 people', 363.95, 956.95, 10, 13)],
  },
  {
    brand: 'reactive-outdoor', handle: '3-secs-cabana', category: 'camping', rating: 4.5,
    title: { en: '3 Secs Cabana', fr: 'Cabana 3 Secs', de: '3-Sekunden-Cabana' },
    description: {
      en: 'Instant beach and garden shade with UV protection. Opens in seconds, folds flat into its bag.',
      fr: "Abri de plage et de jardin instantané avec protection UV. S'ouvre en quelques secondes, se replie à plat.",
      de: 'Sofort-Sonnenschutz für Strand und Garten mit UV-Schutz. In Sekunden offen, flach verpackt.',
    },
    highlights: { en: ['UV protection', 'Instant setup'], fr: ['Protection UV', 'Montage instantané'], de: ['UV-Schutz', 'Sofortaufbau'] },
    images: [`${RO}/files/3SC_Buybox_2_893a0258-e4cc-47ad-86f2-7ea36e8d186e.jpg?v=1772173367`],
    variants: [v('Large · up to 5 people', 109.95, 218.95, 20, 3.5), v('Family pack · S + L', 154.95, 406.95, 10, 6)],
  },
  {
    brand: 'reactive-outdoor', handle: 'anywhere-hammock', category: 'sleeping', featured: true, rating: 4.7,
    title: { en: 'Anywhere Hammock', fr: 'Hamac Anywhere', de: 'Anywhere Hängematte' },
    description: {
      en: 'Freestanding hammock — no trees required. Set it up on the beach, in the garden or at camp.',
      fr: "Hamac autoportant — pas besoin d'arbres. Installez-le sur la plage, au jardin ou au camp.",
      de: 'Freistehende Hängematte – ganz ohne Bäume. Am Strand, im Garten oder im Camp aufstellen.',
    },
    highlights: { en: ['Freestanding frame', 'Packs into one bag'], fr: ['Structure autoportante', 'Tient dans un seul sac'], de: ['Freistehendes Gestell', 'In einer Tasche verstaut'] },
    images: [`${RO}/files/AH_Buybox_V3_1.jpg?v=1780549835`],
    variants: [v('Single', 154.95, 309.95, 18, 8), v('Pack of 2', 272.95, 618.95, 8, 16), v('Pack of 3', 363.95, 927.95, 5, 24)],
  },
  {
    brand: 'reactive-outdoor', handle: 'loungeback-camping-chair', category: 'furniture', rating: 4.6,
    title: { en: 'LoungeBack Camping Chair', fr: 'Chaise de camping LoungeBack', de: 'LoungeBack Campingstuhl' },
    description: {
      en: 'A reclining camp chair with a supportive high back. Folds compact for the car boot.',
      fr: 'Chaise de camping inclinable avec haut dossier enveloppant. Se replie pour le coffre.',
      de: 'Verstellbarer Campingstuhl mit stützender hoher Lehne. Kompakt faltbar für den Kofferraum.',
    },
    highlights: { en: ['Reclining back', 'Compact fold'], fr: ['Dossier inclinable', 'Pliage compact'], de: ['Neigbare Lehne', 'Kompakt faltbar'] },
    images: [`${RO}/files/1xLBBuybox.jpg?v=1779928399`],
    variants: [v('Single chair', 90.95, 181.95, 30, 4), v('2-chair bundle', 163.95, 363.95, 15, 8), v('3-chair bundle', 218.95, 545.95, 10, 12)],
  },
  {
    brand: 'reactive-outdoor', handle: 'trailthrone-camping-chair', category: 'furniture', rating: 4.7,
    title: { en: 'TrailThrone Camping Chair', fr: 'Chaise de camping TrailThrone', de: 'TrailThrone Campingstuhl' },
    description: {
      en: 'Throne-level comfort on the trail: padded seat, sturdy frame and a pack size that disappears in your kit.',
      fr: 'Un confort royal en bivouac : assise rembourrée, structure robuste et un encombrement minimal.',
      de: 'Thron-Komfort unterwegs: gepolsterter Sitz, robuster Rahmen und minimales Packmaß.',
    },
    highlights: { en: ['Padded seat', 'Sturdy frame'], fr: ['Assise rembourrée', 'Structure robuste'], de: ['Gepolsterter Sitz', 'Robuster Rahmen'] },
    images: [`${RO}/files/TTCCBuybox_1.jpg?v=1785813764`, `${RO}/files/TTCCBuybox_2.jpg?v=1785813681`],
    variants: [v('Single chair', 90.95, 181.95, 30, 3.5), v('2-chair bundle', 163.95, 363.95, 15, 7), v('3-chair bundle', 218.95, 545.95, 10, 10.5)],
  },
  {
    brand: 'reactive-outdoor', handle: 'sandglide-wagon', category: 'transport', featured: true, rating: 4.8,
    title: { en: 'SandGlide Wagon', fr: 'Chariot SandGlide', de: 'SandGlide Bollerwagen' },
    description: {
      en: 'Wide balloon wheels that glide over sand, gravel and grass. Folds flat and carries your whole beach day.',
      fr: "Roues ballon larges qui glissent sur le sable, le gravier et l'herbe. Se replie à plat et transporte toute votre journée plage.",
      de: 'Breite Ballonräder gleiten über Sand, Kies und Wiese. Flach faltbar und trägt den ganzen Strandtag.',
    },
    highlights: { en: ['All-terrain balloon wheels', 'Folds flat'], fr: ['Roues ballon tout-terrain', 'Pliage à plat'], de: ['Gelände-Ballonräder', 'Flach faltbar'] },
    images: [`${RO}/files/Buybox_S_f8931eca-a66b-4bb8-801d-2479b0765303.jpg?v=1786432099`, `${RO}/files/Buybox_L_4bf53f8d-8811-4b75-b46f-82314e579c08.jpg?v=1786432062`],
    variants: [v('Small', 245.95, 490.95, 12, 11), v('Large', 272.95, 545.95, 10, 13), v('Family bundle · S + L', 409.95, 1076.95, 5, 24)],
  },
  {
    brand: 'reactive-outdoor', handle: '2-step-cabin-tent-battery', category: 'accessories',
    title: { en: '2-Step Cabin Tent Battery', fr: 'Batterie pour tente cabine 2-Step', de: 'Akku für 2-Schritt-Kabinenzelt' },
    description: {
      en: 'Spare rechargeable battery for the 2-Step Cabin Tent lighting system.',
      fr: "Batterie rechargeable de rechange pour le système d'éclairage de la tente cabine 2-Step.",
      de: 'Ersatz-Akku für das Beleuchtungssystem des 2-Schritt-Kabinenzelts.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: [`${RO}/files/Buybox1.jpg?v=1773022520`],
    variants: [v('1 battery', 25.95, 51.9, 60, 0.3), v('2 batteries', 39.95, 103.8, 40, 0.6), v('3 batteries', 49.95, 155.7, 30, 0.9)],
  },

  // ───────────── Kilos Gear (USD source → EUR) ─────────────
  {
    brand: 'kilos-gear', handle: 'grandpeak-high-back-chair', category: 'furniture', featured: true, rating: 4.9, usd: true,
    title: { en: 'GrandPeak™ High-Back Chair', fr: 'Chaise haut dossier GrandPeak™', de: 'GrandPeak™ Hochlehner' },
    description: {
      en: 'Wider, taller and adjustable from upright chatting to napping. Use it elevated or at ground level, with an integrated pillow for full head support.',
      fr: "Plus large, plus haute et réglable de la position conversation à la sieste. S'utilise surélevée ou au ras du sol, avec coussin intégré.",
      de: 'Breiter, höher und verstellbar vom Plaudern bis zum Nickerchen. Erhöht oder bodennah nutzbar, mit integriertem Kopfkissen.',
    },
    highlights: {
      en: ['Elevated or ground mode', 'Multi-position recline', 'High back + pillow'],
      fr: ['Mode surélevé ou sol', 'Inclinaison multi-positions', 'Haut dossier + coussin'],
      de: ['Erhöht oder bodennah', 'Mehrstufig neigbar', 'Hohe Lehne + Kissen'],
    },
    images: [`${KG}/files/GP.jpg?v=1779958350`, `${KG}/files/GP_1.jpg?v=1779958349`, `${KG}/files/1_7b4a8df8-d978-42a2-9275-0440d8362f04.jpg?v=1780394701`, `${KG}/files/GP_3.jpg?v=1779958350`, `${KG}/files/3_5ed37c4e-904b-46f5-91c1-6e4259e262e9.jpg?v=1780394701`],
    variants: [v('Default', 129.95, 149.95, 35, 3.2)],
  },
  {
    brand: 'kilos-gear', handle: 'grandpeak-sun-shade', category: 'accessories', usd: true,
    title: { en: 'GrandPeak™ Sun Shade', fr: 'Pare-soleil GrandPeak™', de: 'GrandPeak™ Sonnenschutz' },
    description: {
      en: 'Clips onto the GrandPeak™ chair for UPF 50+ protection, with a tiltable aluminium frame.',
      fr: "Se fixe sur la chaise GrandPeak™ pour une protection UPF 50+, avec armature en aluminium inclinable.",
      de: 'Wird am GrandPeak™-Stuhl befestigt: UPF-50+-Schutz mit neigbarem Aluminiumrahmen.',
    },
    highlights: { en: ['UPF 50+', 'Adjustable tilt'], fr: ['UPF 50+', 'Inclinaison réglable'], de: ['UPF 50+', 'Neigung verstellbar'] },
    images: [`${KG}/files/52_70cb4818-f9c0-4819-a13c-84e0ebc77513.jpg?v=1760064715`, `${KG}/files/1_03fc2aa4-622c-467e-885f-7c33c76f12d7.jpg?v=1760064715`, `${KG}/files/6_f8edd9fb-b342-4b47-9c03-1a6d0642cd39.jpg?v=1760064715`, `${KG}/files/2_6cd95c30-8756-4c1d-b54d-bd2d81a3685e.jpg?v=1760064715`],
    variants: [v('Default', 44.95, null, 40, 0.6)],
  },
  {
    brand: 'kilos-gear', handle: 'grandpeak-stool-footrest', category: 'furniture', usd: true,
    title: { en: 'GrandPeak™ 2-in-1 Stool & Footrest', fr: 'Tabouret & repose-pieds 2-en-1 GrandPeak™', de: 'GrandPeak™ 2-in-1 Hocker & Fußstütze' },
    description: {
      en: 'A compact stool that doubles as a footrest for the GrandPeak™ chair.',
      fr: 'Un tabouret compact qui sert aussi de repose-pieds pour la chaise GrandPeak™.',
      de: 'Kompakter Hocker, der auch als Fußstütze für den GrandPeak™-Stuhl dient.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: ['https://kilosgear.com/cdn/shop/files/A5E07525-8291-460E-A7A7-3C036307751C_1_201_a.jpg?v=1708415395'],
    variants: [v('Default', 44.95, null, 30, 1.2)],
  },
  {
    brand: 'kilos-gear', handle: 'grandpeak-heatmax-seat', category: 'accessories', usd: true,
    title: { en: 'GrandPeak™ HeatMax Seat Cloth', fr: 'Housse chauffante HeatMax GrandPeak™', de: 'GrandPeak™ HeatMax Heizbezug' },
    description: {
      en: 'Turns your chair into a winter-ready seat: three heat levels powered by any USB power bank.',
      fr: "Transforme votre chaise en siège d'hiver : trois niveaux de chaleur alimentés par une batterie USB.",
      de: 'Macht Ihren Stuhl wintertauglich: drei Heizstufen, betrieben mit jeder USB-Powerbank.',
    },
    highlights: { en: ['3 heat levels', 'USB powered'], fr: ['3 niveaux de chaleur', 'Alimentation USB'], de: ['3 Heizstufen', 'USB-betrieben'] },
    images: [`${KG}/files/12_205fbcd9-96a3-492a-b7d1-4e5d9de7b10e.jpg?v=1730344907`, `${KG}/files/SiriRaittoPhotography_KilosGearJan2024-6.jpg?v=1729066665`, `${KG}/files/Kilos-Chair-010_fa356190-2819-4414-9183-cf868fc80148.jpg?v=1744774693`, `${KG}/files/Kilos-Chair-008_2172f3e7-0a1c-4034-8bf5-627eae894dcb.jpg?v=1744774693`],
    variants: [v('Default', 69.95, null, 25, 0.7)],
  },
  {
    brand: 'kilos-gear', handle: 'aerocloud-sleeping-pad-elite', category: 'sleeping', featured: true, rating: 4.8, usd: true,
    title: { en: 'AeroCloud™ Sleeping Pad Elite', fr: 'Matelas AeroCloud™ Elite', de: 'AeroCloud™ Isomatte Elite' },
    description: {
      en: 'Cushioned, stable support with ThermoTech™ insulation for all-season warmth. Inflates fast with the included pump sack.',
      fr: 'Soutien moelleux et stable avec isolation ThermoTech™ pour toutes les saisons. Gonflage rapide avec le sac-pompe fourni.',
      de: 'Weiche, stabile Unterstützung mit ThermoTech™-Isolierung für alle Jahreszeiten. Schnell aufgepumpt mit dem Pumpsack.',
    },
    highlights: { en: ['ThermoTech™ insulation', 'Pump sack included'], fr: ['Isolation ThermoTech™', 'Sac-pompe inclus'], de: ['ThermoTech™-Isolierung', 'Pumpsack inklusive'] },
    images: [`${KG}/files/15-3.jpg?v=1760173383`],
    variants: [v('Default', 129.95, null, 25, 0.9)],
  },
  {
    brand: 'kilos-gear', handle: 'aerocloud-sleeping-pad-ul', category: 'sleeping', rating: 4.7, usd: true,
    title: { en: 'AeroCloud™ Sleeping Pad UL', fr: 'Matelas AeroCloud™ UL', de: 'AeroCloud™ Isomatte UL' },
    description: {
      en: 'Ultralight three-season pad: less weight in the pack, more comfort at camp.',
      fr: 'Matelas ultraléger trois saisons : moins de poids dans le sac, plus de confort au bivouac.',
      de: 'Ultraleichte Dreijahreszeiten-Matte: weniger Gewicht im Rucksack, mehr Komfort im Camp.',
    },
    highlights: { en: ['Ultralight', '3-season'], fr: ['Ultraléger', '3 saisons'], de: ['Ultraleicht', '3 Jahreszeiten'] },
    images: [`${KG}/files/32_bde62fc0-bbf5-4688-91d2-9bdf50df0522.jpg?v=1723447463`, `${KG}/files/2_b411315f-2c7c-42b0-a7ff-78487620fd2b.png?v=1783309959`, `${KG}/files/22_90c5b712-0b5e-46d3-8e91-2b9bdf78e689.jpg?v=1723447523`, `${KG}/files/1_2_b744e642-f254-4455-a3fa-bd674834d0c3.jpg?v=1780039066`, `${KG}/files/8_9c351d6b-12c8-4824-a51b-c2ac90fdfb6e.jpg?v=1752746343`],
    variants: [v('Default', 109.95, null, 30, 0.6)],
  },
  {
    brand: 'kilos-gear', handle: 'sleeping-pads', category: 'sleeping', usd: true,
    title: { en: 'Air Sleeping Pad', fr: 'Matelas gonflable Air', de: 'Air Isomatte' },
    description: {
      en: 'Everyday inflatable sleeping pad with a compact pack size.',
      fr: 'Matelas gonflable polyvalent au format compact.',
      de: 'Vielseitige aufblasbare Isomatte mit kleinem Packmaß.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: ['https://kilosgear.com/cdn/shop/files/72_bd5c2d0c-d664-4c0d-b7e9-b76c046cc430.jpg?v=1723447459'],
    variants: [v('Default', 97.95, null, 20, 0.8)],
  },
  {
    brand: 'kilos-gear', handle: 'rover-camping-light-x', category: 'lighting', featured: true, rating: 4.8, usd: true,
    title: { en: 'Rover Camping Light X', fr: 'Lampe de camping Rover X', de: 'Rover Campinglicht X' },
    description: {
      en: 'Multi-angle light panels on an extendable magnetic tripod — floodlight your whole camp with adjustable brightness.',
      fr: 'Panneaux lumineux multi-angles sur trépied magnétique extensible — éclairez tout le camp, intensité réglable.',
      de: 'Mehrwinkel-Lichtpaneele auf ausziehbarem Magnetstativ – das ganze Camp ausleuchten, Helligkeit regelbar.',
    },
    highlights: { en: ['Extendable tripod', 'Adjustable brightness'], fr: ['Trépied extensible', 'Intensité réglable'], de: ['Ausziehbares Stativ', 'Regelbare Helligkeit'] },
    images: [`${KG}/files/2_81727b02-7410-4408-bc7b-e92a543c2858.jpg?v=1776933345`, `${KG}/files/1_c8410571-541d-4718-be71-a1a74086c46a.png?v=1783326222`, `${KG}/files/12_75d50f1b-0e63-4313-b708-ed3456942b58.jpg?v=1727597201`, `${KG}/files/2_c6ae860a-32a7-402f-bcf6-ac4f77bb518c.jpg?v=1780044259`],
    variants: [v('Default', 109.95, null, 30, 1.4)],
  },
  {
    brand: 'kilos-gear', handle: 'flint-roamer-light', category: 'lighting', usd: true,
    title: { en: 'Flint Roamer Light', fr: 'Lampe Flint Roamer', de: 'Flint Roamer Leuchte' },
    description: {
      en: 'A rugged, rechargeable lantern built to roam from tent to trail.',
      fr: 'Une lanterne rechargeable robuste, de la tente au sentier.',
      de: 'Robuste, aufladbare Laterne – vom Zelt bis auf den Trail.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: [`${KG}/files/6391ace427ade714b70fb966024ae804_16dbe6ae-6e1f-4485-a904-872270320fe0.jpg?v=1785751545`, `${KG}/files/10_f04a7690-f7a5-4a20-a1df-215734e6694f.jpg?v=1785308299`, `${KG}/files/25.jpg?v=1786097910`, `${KG}/files/9_710d8e05-f345-4e89-a751-1e3d03b257d4.jpg?v=1785494332`],
    variants: [v('Default', 79.95, null, 30, 0.5)],
  },
  {
    brand: 'kilos-gear', handle: '230-led-headlamp-max', category: 'hiking', usd: true,
    title: { en: '230° LED Headlamp Max', fr: 'Frontale LED 230° Max', de: '230° LED-Stirnlampe Max' },
    description: {
      en: 'Wide 230° beam lights your peripheral vision on night hikes.',
      fr: 'Faisceau large de 230° qui éclaire votre vision périphérique en randonnée de nuit.',
      de: 'Breiter 230°-Lichtkegel für peripheres Sehen bei Nachtwanderungen.',
    },
    highlights: { en: ['230° wide beam'], fr: ['Faisceau 230°'], de: ['230°-Lichtkegel'] },
    images: ['https://kilosgear.com/cdn/shop/products/6C9E05FB-F33F-476C-9617-0D6217F30D73.jpg?v=1668527931'],
    variants: [v('Default', 38.95, null, 50, 0.1)],
  },
  {
    brand: 'kilos-gear', handle: 'retractable-string-light', category: 'lighting', usd: true,
    title: { en: 'Retractable String Light', fr: 'Guirlande lumineuse rétractable', de: 'Einziehbare Lichterkette' },
    description: {
      en: 'Compact reel, big ambiance: pull out the string, hang it anywhere, retract with no tangles.',
      fr: "Enrouleur compact, grande ambiance : déroulez, accrochez partout, rembobinez sans nœuds.",
      de: 'Kompakte Rolle, große Atmosphäre: ausziehen, überall aufhängen, ohne Verheddern einziehen.',
    },
    highlights: { en: ['Tangle-free reel'], fr: ['Enrouleur sans nœuds'], de: ['Verhedderungsfreie Rolle'] },
    images: [`${KG}/files/6391ace427ade714b70fb966024ae804_91131dd8-538e-4ad3-ba17-8c3fb58cfcdc.jpg?v=1726198580`, `${KG}/files/dde103f81d92fa0911f546b76222d1ba.jpg?v=1725265969`, `${KG}/files/6_b88810a5-1c45-40c1-9999-9b5e13c064b6.jpg?v=1725239507`],
    variants: [v('Default', 39.95, null, 45, 0.4)],
  },
  {
    brand: 'kilos-gear', handle: 'after-dark-kit', category: 'lighting', usd: true,
    title: { en: 'After Dark Kit', fr: 'Kit After Dark', de: 'After Dark Kit' },
    description: {
      en: 'Bundle of camp lighting essentials for evenings that run late.',
      fr: "Pack d'éclairage essentiel pour les soirées qui se prolongent.",
      de: 'Set mit Beleuchtungs-Essentials für lange Abende.',
    },
    highlights: { en: ['Bundle saving'], fr: ['Pack avantageux'], de: ['Set-Vorteil'] },
    images: [`${KG}/files/32_f31dac63-0148-4dd2-ace0-d6c25bb099b1.jpg?v=1784273971`],
    variants: [v('Default', 189.9, null, 15, 2)],
  },
  {
    brand: 'kilos-gear', handle: 'full-light-kit', category: 'lighting', usd: true,
    title: { en: 'Full Light Kit', fr: 'Kit éclairage complet', de: 'Komplettes Licht-Kit' },
    description: {
      en: 'The complete Kilos Gear lighting setup in one box.',
      fr: "L'ensemble d'éclairage Kilos Gear complet dans une seule boîte.",
      de: 'Das komplette Kilos-Gear-Lichtsystem in einer Box.',
    },
    highlights: { en: ['Bundle saving'], fr: ['Pack avantageux'], de: ['Set-Vorteil'] },
    images: [`${KG}/files/2_d55e80b6-1212-4b1d-b1cd-e05692bab948.jpg?v=1784273987`],
    variants: [v('Default', 229.85, null, 10, 2.6)],
  },
  {
    brand: 'kilos-gear', handle: 'packing-cube', category: 'hiking', usd: true,
    title: { en: 'Compression Packing Cube Set', fr: 'Set de cubes de compression', de: 'Kompressions-Packwürfel-Set' },
    description: {
      en: 'Compress clothes and gear to free up space in your pack or suitcase.',
      fr: 'Compressez vêtements et matériel pour libérer de la place dans votre sac.',
      de: 'Kleidung und Ausrüstung komprimieren und Platz im Rucksack schaffen.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: ['https://kilosgear.com/cdn/shop/products/30.jpg?v=1645522422'],
    variants: [v('Default', 44.95, null, 40, 0.5)],
  },
  {
    brand: 'kilos-gear', handle: 'camping-hanging-rack', category: 'accessories', usd: true,
    title: { en: 'Camping Hanging Rack', fr: 'Étagère suspendue de camping', de: 'Hängendes Campingregal' },
    description: {
      en: 'Keeps cookware, lights and essentials organised and off the ground.',
      fr: 'Garde ustensiles, lampes et essentiels rangés et hors du sol.',
      de: 'Hält Kochgeschirr, Lampen und Essentials geordnet und vom Boden fern.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: ['https://kilosgear.com/cdn/shop/products/11.jpg?v=1649832277'],
    variants: [v('Default', 59.99, null, 25, 1.5)],
  },
  {
    brand: 'kilos-gear', handle: 'collapsible-water-bucket', category: 'accessories', usd: true,
    title: { en: 'Collapsible Water Bucket', fr: "Seau d'eau pliable", de: 'Faltbarer Wassereimer' },
    description: {
      en: 'Folds flat for storage, holds water for washing, cooking and campfire safety.',
      fr: "Se replie à plat, contient l'eau pour laver, cuisiner et sécuriser le feu de camp.",
      de: 'Flach faltbar, fasst Wasser zum Waschen, Kochen und für die Lagerfeuer-Sicherheit.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: ['https://kilosgear.com/cdn/shop/products/9.jpg?v=1661134297'],
    variants: [v('Default', 24.95, null, 60, 0.4)],
  },
  {
    brand: 'kilos-gear', handle: 'multifunctional-fan-with-led-light', category: 'accessories', usd: true,
    title: { en: 'Multi-Function Camping Fan', fr: 'Ventilateur de camping multifonction', de: 'Multifunktions-Campingventilator' },
    description: {
      en: '3-in-1 fan, light and power bank. Stand it or hang it, with all-day battery life.',
      fr: 'Ventilateur, lampe et batterie externe 3-en-1. À poser ou suspendre, autonomie toute la journée.',
      de: '3-in-1 Ventilator, Lampe und Powerbank. Stellen oder hängen, ganztägige Akkulaufzeit.',
    },
    highlights: { en: ['Fan + light + power bank'], fr: ['Ventilateur + lampe + batterie'], de: ['Ventilator + Licht + Powerbank'] },
    images: [`${KG}/products/43_1.jpg?v=1664531711`, `${KG}/products/2_f95c6139-596f-482b-9a55-5e18fd604915.jpg?v=1664531711`, `${KG}/products/1_0c21f2d0-dec5-4e02-b9cf-fe3524e6dc69.jpg?v=1664531711`],
    variants: [v('Default', 54.95, null, 35, 0.8)],
  },
  {
    brand: 'kilos-gear', handle: 'airclip-outdoor-cooling-fan', category: 'accessories', usd: true,
    title: { en: 'AirClip Outdoor Cooling Fan', fr: 'Ventilateur AirClip', de: 'AirClip Outdoor-Ventilator' },
    description: {
      en: 'Clip-on cooling fan with thermoelectric chill plate, LED light and high-capacity battery.',
      fr: 'Ventilateur à clipser avec plaque de refroidissement thermoélectrique, LED et grosse batterie.',
      de: 'Clip-Ventilator mit thermoelektrischer Kühlplatte, LED-Licht und großem Akku.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: [`${KG}/files/52_368f6b83-7d43-4414-8cb1-7eaaae1a866d.jpg?v=1776135142`, `${KG}/files/1-3.jpg?v=1776240421`, `${KG}/files/1-2_aaec8d2c-aca4-493d-9980-dc28d0c28e36.jpg?v=1776240421`, `${KG}/files/7_f6065758-ccf1-42d1-a303-1fa5d911979b.jpg?v=1776240421`],
    variants: [v('Default', 44.95, null, 35, 0.5)],
  },
  {
    brand: 'kilos-gear', handle: 'multi-function-clip-on-fan', category: 'accessories', usd: true,
    title: { en: 'Multi-Function Clip-On Fan', fr: 'Ventilateur à clipser multifonction', de: 'Multifunktions-Clip-Ventilator' },
    description: {
      en: '3-speed clip-on fan with neck lanyard and LED light.',
      fr: 'Ventilateur à clipser 3 vitesses avec tour de cou et LED.',
      de: 'Clip-Ventilator mit 3 Stufen, Umhängeband und LED-Licht.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: [`${KG}/files/50.jpg?v=1686023256`],
    variants: [v('Default', 44.95, null, 0, 0.4)],
  },
  {
    brand: 'kilos-gear', handle: 'replacement-parts-grandpeak-high-back-chair', category: 'accessories', usd: true,
    title: { en: 'Replacement Parts — GrandPeak™ Chair', fr: 'Pièces détachées — chaise GrandPeak™', de: 'Ersatzteile — GrandPeak™ Stuhl' },
    description: {
      en: 'Genuine spare parts for the GrandPeak™ High-Back Chair only.',
      fr: "Pièces d'origine, compatibles uniquement avec la chaise haut dossier GrandPeak™.",
      de: 'Original-Ersatzteile, nur für den GrandPeak™ Hochlehner.',
    },
    highlights: { en: [], fr: [], de: [] },
    images: [`${KG}/files/10-1.jpg?v=1723791329`, `${KG}/files/10-2.jpg?v=1723791329`],
    variants: [v('Default', 29.95, null, 15, 0.5)],
  },
];

// Variant label translations (EN → FR / DE), applied token by token
const VARIANT_TERMS = [
  ['Extra Large', "Très grande", 'Extragroß'],
  ['Family pack', 'Pack famille', 'Familienpaket'],
  ['Family bundle', 'Pack famille', 'Familienset'],
  ['Single chair', '1 chaise', '1 Stuhl'],
  ['2-chair bundle', 'Lot de 2 chaises', '2er-Set Stühle'],
  ['3-chair bundle', 'Lot de 3 chaises', '3er-Set Stühle'],
  ['Pack of 2', 'Lot de 2', '2er-Pack'],
  ['Pack of 3', 'Lot de 3', '3er-Pack'],
  ['1 battery', '1 batterie', '1 Akku'],
  ['2 batteries', '2 batteries', '2 Akkus'],
  ['3 batteries', '3 batteries', '3 Akkus'],
  ['up to', "jusqu'à", 'bis zu'],
  ['people', 'personnes', 'Personen'],
  ['tarps', 'bâches', 'Planen'],
  ['tarp', 'bâche', 'Plane'],
  ['Single', 'Simple', 'Einzeln'],
  ['Small', 'Petite', 'Klein'],
  ['Large', 'Grande', 'Groß'],
];
export function translateVariant(title) {
  if (!title || title === 'Default') return {};
  const out = { en: title, fr: title, de: title };
  for (const [en, fr, de] of VARIANT_TERMS) {
    out.fr = out.fr.split(en).join(fr);
    out.de = out.de.split(en).join(de);
  }
  return out;
}
