/*
 * Grand Tour: the one file you edit to launch a new brand.
 *
 * Everything brand-specific lives here: name, destination, colours, fonts,
 * photos, regions, journeys and contact details. The build (`npm run build`)
 * reads this file and writes the finished site to dist/.
 *
 * Tokens: any text below may use {brand} and {destination}; the build swaps
 * them for brand.name and destination.name. Text marked "HTML" may contain
 * <em>…</em> for the italic accents the design relies on.
 *
 * Photos: { src, alt }. `src` is either an Unsplash URL
 * (https://images.unsplash.com/photo-…), which the build crops and sizes
 * automatically, or a path to your own file under src/assets/ (for example
 * "/assets/photos/harbour.jpg").
 */

/* ---------- placeholder photo library (swap for your own) ---------- */
const u = (id) => `https://images.unsplash.com/photo-${id}`;
const photo = {
  peaksAboveCloud: { src: u('1506905925346-21bda4d32df4'), alt: 'Mountain peaks rising above a sea of cloud at sunrise' },
  alpineValley: { src: u('1464822759023-fed622ff2c3b'), alt: 'Snow-capped mountains above a wide valley and pine forest' },
  greenHills: { src: u('1469474968028-56623f02e42e'), alt: 'A walker on a rocky outcrop above green hills in soft light' },
  mistyRidges: { src: u('1500534314209-a25ddb2bd429'), alt: 'Layers of misty blue ridges fading towards the horizon' },
  beachSunset: { src: u('1507525428034-b723cf961d3e'), alt: 'Waves running up a sandy beach at sunset' },
  aerialCoast: { src: u('1505228395891-9a51e7e86bf6'), alt: 'Aerial view of turquoise surf breaking on a white beach below trees' },
  desertRoad: { src: u('1500530855697-b586d89ba3ee'), alt: 'An empty road running between red rock walls towards a mountain' },
  forestPath: { src: u('1441974231531-c6227db76b6e'), alt: 'A path through tall trees in a sunlit forest' },
  forestBridge: { src: u('1447752875215-b2761acb3c5d'), alt: 'A footbridge leading into dense green forest' },
  dinnerTable: { src: u('1414235077428-338989a2e8c0'), alt: 'Plates being served at a candlelit dinner table' },
  seaDusk: { src: u('1473116763249-2faaef81ccda'), alt: 'Calm sea and a long beach under a pastel dusk sky' },
  valleySunset: { src: u('1472214103451-9374bd1c798e'), alt: 'The sun setting between grassy hills above a green valley' },
  mountainLake: { src: u('1493246507139-91e8fad9978e'), alt: 'Jagged peaks at sunrise reflected in a still turquoise lake' },
  starryPeaks: { src: u('1519681393784-d120267933ba'), alt: 'The Milky Way above snowy peaks and a dark forest' },
  tentView: { src: u('1504280390367-361c6d9f38f4'), alt: 'Looking out of an open tent towards pine trees' },
  poolStay: { src: u('1520250497591-112f2f40a3f4'), alt: 'A pool among palms and thatched villas below green hills' },
};

export default {
  /* ---------- brand ---------- */
  brand: {
    // Used everywhere: header, menu, footer, page titles, meta tags, copyright.
    name: 'Brand Name',
    // The giant full-width wordmark at the bottom of the hero. Defaults to
    // brand.name; set this only if the wordmark should read differently.
    wordmark: null,
    // Small mark beside the name in the header, menu and footer: an inline SVG
    // drawn in a 14×28 box with fill="currentColor". Set to null for none.
    logo: '<svg viewBox="0 0 14 28" aria-hidden="true" focusable="false"><path d="M7 7l6 7-6 7-6-7z" fill="currentColor"/></svg>',
    // Browser-tab icon. null = generated from the first letter of the name.
    favicon: null,
    // One-line promise. Hero tagline, footer line and page titles. HTML.
    tagline: 'Tailor-made {destination}, <em>off the beaten track.</em>',
    // Meta description, social preview and structured data. Plain text.
    description: 'Tailor-made journeys in {destination}: smaller towns, local food, slower days and quieter alternatives to the crowded icons.',
  },

  /* ---------- destination ---------- */
  destination: {
    name: '[Destination]',
  },

  /* ---------- site ---------- */
  site: {
    // Full public URL with a trailing slash. Used for canonical and social tags.
    url: 'https://www.example.com/',
    lang: 'en-GB',
    // Optional language switcher, e.g. [{ code: 'EN', lang: 'en', href: '/' }, { code: 'FR', lang: 'fr', href: '/fr/' }].
    // Leave empty to hide it.
    languages: [],
  },

  /* ---------- colours ----------
   * Six named colours, each with a text colour that reads on it.
   * accent  buttons, tags and the first sticky-list colour
   * warm    highlights, form errors
   * deep    the call-to-action band and dark panels
   * cool    a second dark panel colour
   * paper   page background
   * ink     text, footer, menu
   */
  colours: {
    accent: { bg: '#D9663B', on: '#141414' },
    warm: { bg: '#E3B448', on: '#141414' },
    deep: { bg: '#1F4D4A', on: '#F2EDE4' },
    cool: { bg: '#2B4C7E', on: '#F2EDE4' },
    paper: { bg: '#F2EDE4', on: '#141414' },
    ink: { bg: '#141414', on: '#F2EDE4' },
  },

  /* ---------- fonts ----------
   * serif: headings and body copy. sans: labels, buttons and the wordmark.
   * faces: @font-face rules for self-hosted files in src/assets/fonts/.
   * stylesheet: optional URL of a hosted font stylesheet (e.g. Google Fonts);
   * if you use one, you can empty `faces` and `preload`.
   */
  fonts: {
    serif: { family: 'Newsreader', fallback: "Georgia, 'Times New Roman', serif" },
    sans: { family: 'Archivo', fallback: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
    stylesheet: null,
    preload: ['/assets/fonts/archivo-normal-300-700-latin.woff2'],
    faces: [
      { family: 'Archivo', style: 'normal', weight: '300 700', stretch: '100%', file: '/assets/fonts/archivo-normal-300-700-latin-ext.woff2', range: 'latin-ext' },
      { family: 'Archivo', style: 'normal', weight: '300 700', stretch: '100%', file: '/assets/fonts/archivo-normal-300-700-latin.woff2', range: 'latin' },
      { family: 'Newsreader', style: 'italic', weight: '200 600', file: '/assets/fonts/newsreader-italic-200-600-latin-ext.woff2', range: 'latin-ext' },
      { family: 'Newsreader', style: 'italic', weight: '200 600', file: '/assets/fonts/newsreader-italic-200-600-latin.woff2', range: 'latin' },
      { family: 'Newsreader', style: 'normal', weight: '200 600', file: '/assets/fonts/newsreader-normal-200-600-latin-ext.woff2', range: 'latin-ext' },
      { family: 'Newsreader', style: 'normal', weight: '200 600', file: '/assets/fonts/newsreader-normal-200-600-latin.woff2', range: 'latin' },
    ],
  },

  /* ---------- contact ---------- */
  contact: {
    email: 'hello@example.com',
    phone: null, // e.g. '+44 20 0000 0000'
    hours: 'Monday to Friday, 09:00–18:00',
    // Postal address. Shown in the footer and on the enquiry page.
    address: {
      line: '[Studio name], [Street and number], [Postcode] [City], [Country]',
      street: '[Street and number]',
      postcode: '[Postcode]',
      city: '[City]',
      country: '[Country code, e.g. GB]',
    },
    // How quickly you reply. Shown on the enquiry page.
    reply: 'Tell us roughly when, who and what you love. We reply within two working days with questions, not a brochure.',
  },

  /* ---------- header navigation ---------- */
  nav: [
    { label: 'Regions', href: '/#regions' },
    { label: 'Instead of', href: '/#instead-of' },
    { label: 'Journeys', href: '/#journeys' },
    { label: 'Plan with us', href: '/#plan' },
    { label: 'About', href: '/#intro' },
  ],
  // The pill button at the right of the header.
  enquireLabel: 'Enquire',

  /* ---------- home: hero ---------- */
  hero: {
    photo: photo.peaksAboveCloud,
    scrollLabel: 'Discover',
  },

  /* ---------- home: intro ---------- */
  intro: {
    label: 'Tailor-made {destination}',
    heading: 'Smaller towns, <em>slower days</em>, and the food of every valley.', // HTML
    lead: 'Tailor-made journeys in {destination}: small towns, family-run stays, regional food and quieter alternatives to the crowded icons.',
    body: 'Every journey starts with a conversation and is planned around your dates, your pace and what you like to eat. We favour small, family-run places to stay, towns that still have a life of their own, and a quieter alternative to every crowded icon.',
    cta: { label: 'How we plan', href: '/#plan' },
    photo: photo.forestPath,
  },

  /* ---------- home: scattered photo collage (exactly four) ---------- */
  collage: {
    label: 'Places we love',
    photos: [photo.mistyRidges, photo.aerialCoast, photo.alpineValley, photo.desertRoad],
  },

  /* ---------- home: regions (sticky colour list) ----------
   * colour: one of accent | warm | deep | cool | ink. Leave out to cycle.
   * Each region links to the enquiry form with that region ticked.
   */
  regions: {
    label: 'Regions',
    heading: 'Six regions, <em>numbered</em>.', // HTML
    body: 'The famous names are only the start. Each region has its own towns, its own food and its own quieter corners.',
    ctaLabel: 'Plan a journey',
    items: [
      { name: '[Region one]', blurb: 'The capital, then the hill towns and lakes that locals escape to.', photo: photo.greenHills },
      { name: '[Region two]', blurb: 'Rolling hills, country roads and villages that still keep their own festivals.', photo: photo.valleySunset },
      { name: '[Region three]', blurb: 'The green heart of the country: forests, mushrooms and long lunches.', photo: photo.forestBridge },
      { name: '[Region four]', blurb: 'High peaks, mountain huts that cook like restaurants, and lakes the colour of glass.', photo: photo.mountainLake },
      { name: '[Region five]', blurb: 'A long coast of fishing towns, beach suppers and boats at dawn.', photo: photo.beachSunset },
      { name: '[Region six]', blurb: 'Islands, coves and an interior that most beach visitors never see.', photo: photo.aerialCoast },
    ],
  },

  /* ---------- home: "Instead of" (stacked panels) ----------
   * For each crowded icon, a quieter place with the same feeling.
   * colour: paper | accent | warm | deep | cool | ink. region: the name of a
   * region above (its link opens the enquiry form with it ticked).
   */
  swaps: {
    label: 'Instead of',
    heading: 'Same feeling, <em>fewer people</em>.', // HTML
    lead: 'For each crowded icon, a quieter place that gives you the same thing: the colours, the water, the square, the view.',
    items: [
      {
        icon: '[The famous coast]', instead: '[The fishing town]', where: '[Region five], 30 minutes from the airport',
        feeling: 'Painted houses above a harbour, bread warm from the oven, and a swim off the rocks before dinner.',
        why: 'The famous coast shares narrow paths and a single road with a very large number of day visitors in high season. The fishing town has the same colours and the same sea, a long seafront and good restaurants, and it still lives off its harbour.',
        tradeoff: 'You give up the famous viewpoint. You can still see it early in the morning, on a weekday.',
        alsoTry: '[A second quiet town]',
        region: '[Region five]', colour: 'paper', iconPhoto: photo.seaDusk, insteadPhoto: photo.beachSunset,
      },
      {
        icon: '[The famous lake]', instead: '[The quiet lake]', where: '[Region four], an hour further up the valley',
        feeling: 'Still water, mountain walls and a wooden boat for the afternoon.',
        why: 'The famous lake fills with coaches by mid-morning. One valley over, a smaller lake has the same peaks and the same colour, with a single inn and a path all the way round.',
        tradeoff: 'There is no lakeside promenade or boutique shopping, only walking and very good food.',
        alsoTry: '[A high pasture village]',
        region: '[Region four]', colour: 'deep', iconPhoto: photo.alpineValley, insteadPhoto: photo.mountainLake,
      },
      {
        icon: '[The famous beach]', instead: '[The island cove]', where: 'An island, a short ferry ride away',
        feeling: 'White sand, clear water and a lunch that runs into the afternoon.',
        why: 'The famous beach is beautiful, but in summer its one road and its sand are full. A short ferry away, a small island has the same water around coves you can reach on foot, and its roads are quiet.',
        tradeoff: 'Fewer luxury hotels and no beach clubs. We pair it with a few nights somewhere grand if you want both.',
        alsoTry: '[A neighbouring island]',
        region: '[Region six]', colour: 'cool', iconPhoto: photo.beachSunset, insteadPhoto: photo.aerialCoast,
      },
      {
        icon: '[The famous viewpoint]', instead: '[The other ridge]', where: '[Region two], 35 minutes by train',
        feeling: 'Ridge after ridge fading into the haze, and nobody else on the path.',
        why: 'The famous viewpoint has a car park, a queue and a souvenir stand. The other ridge has the same view, a hut that serves lunch, and a path that starts in a village square.',
        tradeoff: 'There is no cable car. Instead you get a proper walk, a market and very good food.',
        alsoTry: '[A hill-town square]',
        region: '[Region two]', colour: 'ink', iconPhoto: photo.greenHills, insteadPhoto: photo.mistyRidges,
      },
    ],
  },

  /* ---------- home: sample journeys (carousel) ----------
   * Each card opens the enquiry form with the journey named in the message.
   */
  journeys: {
    label: 'Sample journeys',
    heading: 'Starting points, <em>not packages</em>.', // HTML
    body: 'Five routes that show how we like to travel: fewer bases, longer stays, a working town for every famous one. Every trip is planned to order.',
    tagSuffix: 'nights',
    allLabel: 'Plan your own',
    items: [
      { title: 'The <em>other</em> hill country', nights: 10, photo: photo.valleySunset },
      { title: 'Coast <em>to coast</em>', nights: 9, photo: photo.seaDusk },
      { title: 'Peaks <em>and lakes</em>', nights: 8, photo: photo.mountainLake },
      { title: 'Islands <em>and coves</em>', nights: 12, photo: photo.aerialCoast },
      { title: 'Under <em>the stars</em>', nights: 9, photo: photo.starryPeaks },
    ],
  },

  /* ---------- home: three ways in (numbered features) ---------- */
  features: {
    label: 'Plan with us',
    heading: 'Three ways <em>in</em>.', // HTML
    items: [
      { title: 'Start with a region', body: 'Choose a region to see its towns, its food and the quieter corners we would send you to first.', cta: { label: 'See the regions', href: '/#regions' }, photo: photo.dinnerTable },
      { title: 'Instead of', body: 'For each crowded icon, a quieter place with the same feeling, side by side.', cta: { label: 'See the swaps', href: '/#instead-of' }, photo: photo.tentView },
      { title: 'Tell us your dates', body: 'Send us a month, a rough budget and what you love. We come back with questions, then a first route.', cta: { label: 'Start an enquiry', href: '/enquire/' }, photo: photo.poolStay },
    ],
  },

  /* ---------- home: call-to-action band ---------- */
  band: {
    heading: 'Tell us the {destination} <em>you have in mind</em>.', // HTML
    body: 'Every journey is planned to order, around the places, the food and the pace you like. We plan journeys around the towns most visitors drive past.',
    cta: { label: 'Start an enquiry', href: '/enquire/' },
  },

  /* ---------- enquiry page ---------- */
  enquire: {
    label: 'Enquire',
    heading: 'Start with a <em>conversation</em>', // HTML
    photo: photo.forestBridge,
    interests: ['Food and cooking', 'Wine', 'Walking', 'Art and architecture', 'Festivals', 'Sea and islands', 'Family travel', 'Slow travel, few bases'],
    budgets: ['Under €3,000', '€3,000 to €6,000', '€6,000 to €10,000', 'Over €10,000'],
    budgetLabel: 'Budget per person, excluding flights',
  },

  /* ---------- footer ---------- */
  // The copyright line is built for you: "© <current year> <brand.name>".
  footer: {
    columns: [
      { heading: '{destination}', links: [
        { label: 'Regions', href: '/#regions' },
        { label: 'Instead of', href: '/#instead-of' },
        { label: 'Journeys', href: '/#journeys' },
        { label: 'Plan with us', href: '/#plan' },
      ] },
      { heading: 'Explore', links: [
        { label: 'About', href: '/#intro' },
        { label: 'Enquire', href: '/enquire/' },
      ] },
      { heading: 'Legal', links: [
        { label: 'Privacy Policy', href: '/privacy/' },
        { label: 'Booking Terms', href: '/terms/' },
        { label: 'Cookie Policy', href: '/cookies/' },
      ] },
    ],
  },

  /* ---------- legal pages ----------
   * Placeholders only. Replace each body with your own policy text
   * (HTML: use <h2> for headings and <p> for paragraphs).
   */
  legal: [
    { slug: 'privacy', title: 'Privacy Policy', intro: 'How {brand} collects, uses and protects your personal information.', updated: '2026-01-01',
      body: '<h2>Who we are</h2><p>[Replace this page with your privacy policy. Say who you are, what you collect, why, who you share it with, how long you keep it and how people can exercise their rights.]</p><p>Contact: <a href="mailto:{email}">{email}</a>.</p>' },
    { slug: 'terms', title: 'Booking Terms', intro: 'The terms on which {brand} arranges journeys.', updated: '2026-01-01',
      body: '<h2>Your booking</h2><p>[Replace this page with your booking terms: deposits, payments, changes, cancellations, insurance and complaints.]</p>' },
    { slug: 'cookies', title: 'Cookie Policy', intro: 'How {brand} uses cookies and similar technologies.', updated: '2026-01-01',
      body: '<h2>Cookies</h2><p>[Replace this page with your cookie policy. As built, this site sets no cookies and loads no tracking scripts.]</p>' },
  ],
};
