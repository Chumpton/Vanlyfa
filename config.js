/* ==========================================================================
   VANLYFA APPLICATION CONFIGURATION & COPY - config.js
   ========================================================================== */

const AppConfig = {
  defaultCenter: [37.7749, -122.4194],
  defaultZoom: 4,
  glitchRate: 0.1,
  apiDelay: 800,
  gpsLocateWait: 1000
};

const SVG_ASSETS = {
  avatar_bob: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#3B7A57"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="white" text-anchor="middle">NB</text></svg>`,
  avatar_clara: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#A2BEA9"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" text-anchor="middle">CO</text></svg>`,
  avatar_forest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#6E6A5F"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="white" text-anchor="middle">FN</text></svg>`,
  avatar_solar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#2D2D2D"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="#F4F1EA" text-anchor="middle">SE</text></svg>`,
  avatar_surf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#5C8D70"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="white" text-anchor="middle">BS</text></svg>`,
  avatar_guest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#888888"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="white" text-anchor="middle">G</text></svg>`,
  
  image_desert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#EAE6DC"/><path d="M 0 250 L 100 130 L 220 200 L 350 80 L 400 150 L 400 250 Z" fill="#DCD6C5"/><circle cx="320" cy="60" r="25" fill="#3B7A57" opacity="0.15"/><text x="20" y="40" font-family="Inter,sans-serif" font-weight="700" fill="#6E6A5F" font-size="14">Utah Desert Campsite</text></svg>`,
  image_interior: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#FAF9F6"/><rect x="40" y="60" width="320" height="150" rx="8" fill="#E5E0D4"/><line x1="200" y1="60" x2="200" y2="210" stroke="#DCD6C5" stroke-width="2"/><text x="20" y="40" font-family="Inter,sans-serif" font-weight="700" fill="#6E6A5F" font-size="14">Rig Ceiling Tongue &amp; Groove</text></svg>`,
  image_beach: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#F4F1EA"/><path d="M 0 200 Q 150 180 400 220 L 400 250 L 0 250 Z" fill="#E5E0D4"/><circle cx="100" cy="100" r="40" fill="#3B7A57" opacity="0.08"/><text x="20" y="40" font-family="Inter,sans-serif" font-weight="700" fill="#6E6A5F" font-size="14">San Felipe Surf Check</text></svg>`,

  item_solar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#2D2D2D"/><rect x="20" y="20" width="360" height="210" fill="none" stroke="#FAF9F6" stroke-width="4"/><line x1="200" y1="20" x2="200" y2="230" stroke="#FAF9F6" stroke-width="2"/><line x1="20" y1="125" x2="380" y2="125" stroke="#FAF9F6" stroke-width="2"/><text x="35" y="45" font-family="Inter,sans-serif" font-weight="700" fill="white" font-size="14">Renogy 100W Solar</text></svg>`,
  item_gear: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#FAF9F6"/><rect x="100" y="50" width="200" height="150" rx="10" fill="#6E6A5F"/><rect x="120" y="70" width="160" height="80" rx="4" fill="#FAF9F6"/><circle cx="200" cy="175" r="10" fill="#3B7A57"/><text x="20" y="35" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" font-size="14">Dometic CFX3 Fridge</text></svg>`,
  item_fan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#EAE6DC"/><circle cx="200" cy="125" r="80" fill="none" stroke="#2D2D2D" stroke-width="4"/><circle cx="200" cy="125" r="20" fill="#3B7A57"/><path d="M 200 125 L 140 80 M 200 125 L 260 80 M 200 125 L 200 205" stroke="#2D2D2D" stroke-width="8" stroke-linecap="round"/><text x="20" y="35" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" font-size="14">MaxxFan Roof Ventilator</text></svg>`,
  item_van: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#E5E0D4"/><path d="M 50 160 L 90 90 L 290 90 L 350 120 L 350 180 L 50 180 Z" fill="#FAF9F6" stroke="#2D2D2D" stroke-width="4"/><circle cx="100" cy="180" r="20" fill="#2D2D2D"/><circle cx="300" cy="180" r="20" fill="#2D2D2D"/><rect x="250" y="100" width="80" height="40" rx="4" fill="#3B7A57" opacity="0.3"/><text x="20" y="35" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" font-size="14">Transit 148 Custom Camper</text></svg>`
};

const ZIP_DATABASE = {
  "84532": { lat: 38.5733, lng: -109.5498, city: "Moab, UT" },
  "97701": { lat: 44.0582, lng: -121.3153, city: "Bend, OR" },
  "86001": { lat: 35.1983, lng: -111.6513, city: "Flagstaff, AZ" },
  "80202": { lat: 39.7392, lng: -104.9903, city: "Denver, CO" },
  "90210": { lat: 34.0736, lng: -118.4004, city: "Beverly Hills, CA" },
  "10001": { lat: 40.7501, lng: -73.9996, city: "New York, NY" },
  "85281": { lat: 33.4255, lng: -111.9400, city: "Tempe, AZ" }
};

const AppCopy = {
  welcomeTitle: "Welcome to Vanlyfa!",
  welcomeIntro: "We're glad to have you in our community hub for van life travelers. Here is a quick guide to what you can do:",
  welcomeFeatures: [
    {
      icon: "compass",
      title: "Interactive Map & Dashboard",
      desc: "Discover and share wild camping spots, water fill stations, dump stations, and repair shops. Filter map locations, add new spots, or vouch for existing ones."
    },
    {
      icon: "rss",
      title: "Community Feed",
      desc: "Post updates, share beautiful photos of your rig and travels, ask questions, and comment on other travelers' posts in real-time."
    },
    {
      icon: "shopping-bag",
      title: "Nomadic Marketplace",
      desc: "Buy, sell, or barter items, rigs, camper accessories, and services. Share off-grid skills with local travelers near you."
    },
    {
      icon: "scroll-text",
      title: "Community Forums",
      desc: "Participate in long-form threads about mechanical troubleshooting, solar configuration, pet safety on the road, and travel tips."
    },
    {
      icon: "shield-check",
      title: "Vouching & Reputation System",
      desc: "Vouch for campsites you have verified to raise spot credibility. Upvote helpful answers and trade interactions to build user reputation scores."
    }
  ],
  tabPlaceholders: {
    dashboard: "Search vouched spots or posts...",
    feed: "Search posts...",
    marketplace: "Search rigs, items, or skills...",
    tribes: "Search camper tribes...",
    meetups: "Search local meetups...",
    forum: "Search threads, guides, or questions...",
    messages: "Search chats...",
    jobs: "Search work trades or stays..."
  },
  roles: {
    admin: { label: "Admin", color: "var(--accent-green)" },
    moderator: { label: "Mod", color: "#3b82f6" },
    pro: { label: "Verified Vouch", color: "#a855f7" }
  }
};

const FORUM_CATEGORIES = [
  { id: "builds", name: "Builds", icon: "wrench" },
  { id: "electrical", name: "Electrical", icon: "zap" },
  { id: "mechanics", name: "Mechanics", icon: "truck" },
  { id: "destinations", name: "Destinations", icon: "map-pin" },
  { id: "cooking", name: "Cooking", icon: "utensils" },
  { id: "pets", name: "Pets", icon: "heart" },
  { id: "recreation", name: "Recreation", icon: "compass" },
  { id: "guides", name: "Guides", icon: "book-open" },
  { id: "general", name: "General", icon: "message-square" }
];

const DefaultUsers = [
  {
    name: "Clara Outdoors",
    handle: "@clara_outdoors",
    avatar: "avatar_clara",
    bio: "Driving through Utah, cell signal is spotty but loving the boondocking life.",
    rig: "Ford Transit Camper",
    solar: "350W Solar",
    power: "200Ah Lithium",
    water: "20 Gal Fresh",
    gallery: ["image_desert", "image_beach"],
    visitedSpots: ["usfs-1", "usfs-2"],
    friends: ["Forest Nomad", "Baja Surfer"],
    reputation: 24,
    givenRepTo: [],
    role: "user",
    instagram_handle: "clara_outdoors",
    tiktok_handle: "clara_outdoors",
    password: "ClaraPass123!"
  },
  {
    name: "Forest Nomad",
    handle: "@forest_nomad",
    avatar: "avatar_forest",
    bio: "Woodworker & designer building off-grid rigs on the road.",
    rig: "Sprinter 144 DIY",
    solar: "400W Solar",
    power: "300Ah Lithium",
    water: "25 Gal Fresh",
    gallery: ["image_interior"],
    visitedSpots: ["usfs-5", "usfs-6"],
    friends: ["Clara Outdoors"],
    reputation: 45,
    givenRepTo: [],
    role: "user",
    instagram_handle: "forest_nomad",
    tiktok_handle: "",
    password: "ForestPass123!"
  },
  {
    name: "Baja Surfer",
    handle: "@baja_surfer",
    avatar: "avatar_surf",
    bio: "Salt water, warm sand, and 12V fridges. Currently exploring Baja California.",
    rig: "Chevy Express 4x4",
    solar: "200W Solar",
    power: "100Ah Lithium",
    water: "15 Gal Fresh",
    gallery: ["image_beach"],
    visitedSpots: ["usfs-3"],
    friends: ["Clara Outdoors"],
    reputation: 12,
    givenRepTo: [],
    role: "user",
    instagram_handle: "baja_surfer",
    tiktok_handle: "bajasurfer",
    password: "BajaPass123!"
  },
  {
    name: "Solar Explorer",
    handle: "@solar_explorer",
    avatar: "avatar_solar",
    bio: "Rig electrical consultant. Ask me about solar panels, alternators, and inverters.",
    rig: "Promaster 159 Extended",
    solar: "800W Solar",
    power: "600Ah Lithium",
    water: "30 Gal Fresh",
    gallery: ["item_solar"],
    visitedSpots: ["usfs-10"],
    friends: [],
    reputation: 89,
    givenRepTo: [],
    role: "moderator",
    instagram_handle: "solar_explorer",
    tiktok_handle: "solar_explorer",
    password: "SolarPass123!"
  },
  {
    name: "Admin User",
    handle: "@admin",
    avatar: "avatar_guest",
    role: "admin",
    bio: "Vanlyfa Platform Administrator. Direct message for support.",
    rig: "Command Center Van",
    solar: "1200W Solar",
    power: "1000Ah Lithium",
    water: "50 Gal Fresh",
    gallery: [],
    visitedSpots: [],
    friends: [],
    reputation: 999,
    givenRepTo: [],
    instagram_handle: "vanlyfa_official",
    tiktok_handle: "vanlyfa_official",
    password: "AdminPass123!"
  },
  {
    name: "Vanlyfa",
    handle: "@vanlyfa",
    avatar: "avatar_guest",
    role: "admin",
    bio: "Official Vanlyfa account. Supporting off-grid nomads.",
    rig: "Vanlyfa HQ",
    solar: "800W Solar",
    power: "400Ah Lithium",
    water: "30 Gal Fresh",
    gallery: [],
    visitedSpots: [],
    friends: [],
    reputation: 1000,
    givenRepTo: [],
    instagram_handle: "vanlyfa",
    tiktok_handle: "vanlyfa",
    password: "VanlyfaPass123!"
  }
];

const DefaultSpots = [];

const DefaultMeetups = [
  {
    id: "meetup-welcome",
    title: "Official Vanlyfa Campground Meetup",
    date: "2026-10-15",
    time: "6:00 PM",
    location: "Moab BLM dispersed camping",
    description: "Welcome gather for all off-grid nomads. Join us around the campfire to swap road stories, camper hacks, and build designs.",
    host: { name: "Vanlyfa", avatar: "avatar_guest" },
    attendees: ["avatar_guest"],
    attendeesCount: 1,
    comments: [],
    status: "approved",
    lat: 38.5733,
    lng: -109.5498
  }
];

const DefaultPosts = [
  {
    id: "post-welcome",
    content: "Welcome to Vanlyfa! 🌲 We're building the ultimate community hub for off-grid travelers. Introduce yourself, browse nearby campsites, and find your regional tribe! #vanlife #welcome",
    image: "none",
    author: {
      name: "Vanlyfa",
      avatar: "avatar_guest"
    },
    likes: 15,
    likedByUser: false,
    reposts: 0,
    shares: 0,
    time: "1 day ago",
    comments: [],
    status: "approved",
    lat: 38.5733,
    lng: -109.5498,
    views: 120,
    saves: 15
  }
];

const DefaultMarketplace = [
  {
    id: "market-1",
    title: "Renogy 100W Solar Panel",
    price: 80,
    category: "electrical",
    location: "Moab, UT",
    zip: "84532",
    description: "Brand new Renogy 100W Monocrystalline solar panel in original packaging. Perfect for expanding your rig's array.",
    image: "item_solar",
    condition: "New",
    seller: { name: "Solar Explorer", avatar: "avatar_solar" },
    status: "approved"
  }
];

const DefaultForum = [
  {
    id: "thread-welcome",
    title: "Welcome to the Vanlyfa Forums! Please read first",
    category: "General",
    body: "Welcome to our discussion board! This is the place to share solar specs, mechanical tips, and travel routes. Keep discussion respectful and observe Leave No Trace principles on public lands. #welcome #guides",
    author: { name: "Vanlyfa", avatar: "avatar_guest" },
    viewsCount: 154,
    repliesCount: 0,
    date: "1 day ago",
    replies: [],
    status: "approved"
  }
];

const DefaultTribes = [
  {
    id: "tribe-vanlyfa",
    title: "Vanlyfa Community",
    description: "The official group for Vanlyfa app users. Stay updated on new features, meetups, and platform announcements.",
    membersCount: 1,
    banner: "forest",
    iconLetter: "VL",
    joined: true,
    isPublic: true,
    category: "Regional",
    state: "UT",
    ideal: "Off-grid / Boondocking"
  }
];

const DefaultChats = {
  "Clara Outdoors": [
    { id: "m1", sender: "Clara Outdoors", text: "Hey! How is your rig building going?", time: "Yesterday", reaction: false, status: "read" },
    { id: "m2", sender: "me", text: "Pretty good! Finished the cedar roof panels yesterday.", time: "Yesterday", reaction: false, status: "read" },
    { id: "m3", sender: "Clara Outdoors", text: "Awesome! Cedars are perfect for ceilings. Smells great too.", time: "Yesterday", reaction: false, status: "read" }
  ],
  "Forest Nomad": [
    { id: "m4", sender: "Forest Nomad", text: "Hey Bob, let me know if you need help with carpentry tips.", time: "Yesterday", reaction: false, status: "read" }
  ]
};

const US_CITIES_DATABASE = [
  { name: "Moab, UT (84532)", lat: 38.5733, lng: -109.5498, zip: "84532" },
  { name: "Bend, OR (97701)", lat: 44.0582, lng: -121.3153, zip: "97701" },
  { name: "Flagstaff, AZ (86001)", lat: 35.1983, lng: -111.6513, zip: "86001" },
  { name: "Quartzsite, AZ (85346)", lat: 33.6840, lng: -114.2310, zip: "85346" },
  { name: "Joshua Tree, CA (92252)", lat: 34.1347, lng: -116.3131, zip: "92252" },
  { name: "Asheville, NC (28801)", lat: 35.5951, lng: -82.5515, zip: "28801" },
  { name: "Austin, TX (78701)", lat: 30.2729, lng: -97.7444, zip: "78701" },
  { name: "Portland, OR (97201)", lat: 45.5152, lng: -122.6848, zip: "97201" },
  { name: "Seattle, WA (98101)", lat: 47.6085, lng: -122.3295, zip: "98101" },
  { name: "Denver, CO (80202)", lat: 39.7392, lng: -104.9903, zip: "80202" },
  { name: "Salt Lake City, UT (84101)", lat: 40.7608, lng: -111.8910, zip: "84101" },
  { name: "Bozeman, MT (59715)", lat: 45.6796, lng: -111.0386, zip: "59715" },
  { name: "Jackson, WY (83001)", lat: 43.4799, lng: -110.7624, zip: "83001" },
  { name: "Bar Harbor, ME (04609)", lat: 44.3876, lng: -68.2039, zip: "04609" },
  { name: "Sedona, AZ (86336)", lat: 34.8697, lng: -111.7601, zip: "86336" },
  { name: "Durango, CO (81301)", lat: 37.2753, lng: -107.8801, zip: "81301" },
  { name: "Lake Tahoe, CA (96150)", lat: 38.9399, lng: -119.9772, zip: "96150" },
  { name: "Bishop, CA (93514)", lat: 37.3614, lng: -118.3996, zip: "93514" },
  { name: "San Diego, CA (92101)", lat: 32.7157, lng: -117.1611, zip: "92101" },
  { name: "Key West, FL (33040)", lat: 24.5551, lng: -81.7800, zip: "33040" },
  { name: "Yosemite Valley, CA (95389)", lat: 37.7456, lng: -119.5332, zip: "95389" },
  { name: "Grand Canyon, AZ (86023)", lat: 36.0544, lng: -112.1386, zip: "86023" },
  { name: "Zion National Park, UT (84767)", lat: 37.2982, lng: -113.0263, zip: "84767" },
  { name: "Yellowstone, WY (82190)", lat: 44.4280, lng: -110.5885, zip: "82190" },
  { name: "Glacier National Park, MT (59936)", lat: 48.7596, lng: -113.7870, zip: "59936" },
  { name: "Everglades, FL (33034)", lat: 25.2866, lng: -80.8987, zip: "33034" },
  { name: "Acadia National Park, ME (04660)", lat: 44.3386, lng: -68.2733, zip: "04660" }
];
