/* ==========================================================================
   VANLYFA APPLICATION LOGIC - index.js
   ========================================================================== */

// Initialize lucide icons on load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Global Application State
let State = {
  currentUser: {
    name: "Nomad Bob",
    handle: "@nomad_bob",
    avatar: "avatar_bob",
    bio: "Living full time in my build since 2024. Chasing weather patterns and solar power.",
    rig: "Sprinter 144 AWD",
    solar: "400W Solar",
    power: "300Ah Lithium",
    water: "25 Gal Fresh",
    spotsCount: 3,
    listingsCount: 1,
    reputation: 15,
    givenRepTo: ["Clara Outdoors", "Forest Nomad"]
  },
  users: [
    {
      name: "Nomad Bob",
      handle: "@nomad_bob",
      avatar: "avatar_bob",
      bio: "Living full time in my build since 2024. Chasing weather patterns and solar power.",
      rig: "Sprinter 144 AWD",
      solar: "400W Solar",
      power: "300Ah Lithium",
      water: "25 Gal Fresh",
      gallery: ["item_van", "image_interior"],
      visitedSpots: ["spot-1", "spot-5"],
      friends: ["Clara Outdoors", "Forest Nomad"],
      reputation: 15,
      givenRepTo: ["Clara Outdoors", "Forest Nomad"]
    },
    {
      name: "Clara Outdoors",
      handle: "@nomad_clara",
      avatar: "avatar_clara",
      bio: "Mountain biker and trail runner. Converting a 2021 Ford Transit. Off-grid is the only way.",
      rig: "Transit 148 Extended",
      solar: "350W Solar",
      power: "200Ah AGM",
      water: "20 Gal Fresh",
      gallery: ["image_desert"],
      visitedSpots: ["spot-1", "spot-2", "spot-4", "spot-6"],
      friends: ["Nomad Bob", "Forest Nomad"],
      reputation: 24,
      givenRepTo: ["Nomad Bob"]
    },
    {
      name: "Forest Nomad",
      handle: "@forest_nomad",
      avatar: "avatar_forest",
      bio: "Woodworker building mobile cabins. Sustainable logging advocate.",
      rig: "Dodge Ram Promaster",
      solar: "200W Solar",
      power: "100Ah Lithium",
      water: "15 Gal Fresh",
      gallery: ["image_interior"],
      visitedSpots: ["spot-2", "spot-3"],
      friends: ["Nomad Bob", "Clara Outdoors"],
      reputation: 18,
      givenRepTo: ["Nomad Bob"]
    },
    {
      name: "Solar Explorer",
      handle: "@solar_explorer",
      avatar: "avatar_solar",
      bio: "Electrical engineer traveling the country. Architect of high-voltage solar setups.",
      rig: "Ford Transit High Roof",
      solar: "800W Solar",
      power: "600Ah Lithium",
      water: "30 Gal Fresh",
      gallery: ["item_solar"],
      visitedSpots: ["spot-1", "spot-4"],
      friends: ["Nomad Bob"],
      reputation: 32,
      givenRepTo: []
    },
    {
      name: "Baja Surfer",
      handle: "@baja_surfer",
      avatar: "avatar_surf",
      bio: "Salt water, warm sands, and empty waves. Follow me south of the border.",
      rig: "Toyota Tundra Popup",
      solar: "100W Solar",
      power: "100Ah Lead Acid",
      water: "10 Gal Fresh",
      gallery: ["image_beach"],
      visitedSpots: ["spot-3"],
      friends: ["Nomad Bob"],
      reputation: 9,
      givenRepTo: []
    }
  ],
  activeProfileName: null,
  profileMap: null,
  profileMarkers: [],
  currentViewedSpotId: null,
  spots: [
    {
      id: "spot-1",
      title: "Pine Ridge Dispersed",
      category: "wild-camping",
      lat: 37.2405,
      lng: -112.5642,
      description: "Beautiful pines, level dirt pullouts. Vouched coordinates and holds great cell service. High clearance recommended for the last mile.",
      author: { name: "Clara Outdoors", avatar: "avatar_clara" },
      vouches: 14
    },
    {
      id: "spot-2",
      title: "Coastal Bluff Pullout",
      category: "wild-camping",
      lat: 44.1204,
      lng: -124.1105,
      description: "Overlooking the Pacific. Quiet pullout right off Highway 101. Space for 3 rigs max. Incredible sunsets.",
      author: { name: "Forest Nomad", avatar: "avatar_forest" },
      vouches: 28
    },
    {
      id: "spot-3",
      title: "Baja Beach camp",
      category: "wild-camping",
      lat: 31.0210,
      lng: -114.8320,
      description: "Free beach camping in San Felipe. Flat hard sand, warm breeze. Close to town for supplies. Fish tacos within walking distance.",
      author: { name: "Baja Surfer", avatar: "avatar_surf" },
      vouches: 35
    },
    {
      id: "spot-4",
      title: "Rocky Mountain View",
      category: "wild-camping",
      lat: 39.2508,
      lng: -106.2925,
      description: "10,000ft elevation camp near Leadville. Panoramic views of Mt. Elbert. Cool summer nights. Fire pits available.",
      author: { name: "Solar Explorer", avatar: "avatar_solar" },
      vouches: 19
    },
    {
      id: "spot-5",
      title: "Driveway Host Flagstaff",
      category: "driveway-host",
      lat: 35.1983,
      lng: -111.6513,
      description: "Quiet residential driveway with 15A hookup. Water fill available. Pet friendly. Host is a fellow nomad.",
      author: { name: "Nomad Bob", avatar: "avatar_bob" },
      vouches: 8
    },
    {
      id: "spot-6",
      title: "Trusted Sprinter Repair",
      category: "service-mechanic",
      lat: 40.0150,
      lng: -105.2705,
      description: "Independent mechanic specialized in Mercedes T1N and NCV3 Sprinters. Very honest rates and knows diesel engines inside out.",
      author: { name: "Clara Outdoors", avatar: "avatar_clara" },
      vouches: 12
    }
  ],
  meetups: [
    {
      id: "meetup-1",
      title: "Quartzsite Bonfire Gathering",
      lat: 33.6840,
      lng: -114.2310,
      date: "2026-11-15",
      time: "5:00 PM onwards",
      location: "Quartzsite BLM, AZ",
      description: "Annual desert gathering. Share rig build hacks, swap stories, and enjoy a massive bonfire. Bring your own chair and firewood.",
      host: { name: "Nomad Bob", avatar: "avatar_bob" },
      attendees: ["avatar_bob", "avatar_clara", "avatar_forest", "avatar_solar", "avatar_surf"],
      attendeesCount: 42
    },
    {
      id: "meetup-2",
      title: "Oregon Dunes Caravan",
      lat: 43.7225,
      lng: -124.1780,
      date: "2026-08-10",
      time: "12:00 PM",
      location: "Florence BLM Dunes, OR",
      description: "Caravan along the dunes. Testing solar capacity and enjoying coastal hikes. High-clearance AWD rigs only for beach driving.",
      host: { name: "Clara Outdoors", avatar: "avatar_clara" },
      attendees: ["avatar_clara", "avatar_forest", "avatar_solar"],
      attendeesCount: 18
    },
    {
      id: "meetup-3",
      title: "Baja Surf Campout",
      lat: 26.8900,
      lng: -113.4800,
      date: "2026-12-05",
      time: "All Day",
      location: "Bahia de Concepcion, MX",
      description: "Park directly on the water. Kayaking, paddle boarding, surfing, and local tacos. Families and pets welcome.",
      host: { name: "Baja Surfer", avatar: "avatar_surf" },
      attendees: ["avatar_surf", "avatar_bob", "avatar_solar"],
      attendeesCount: 25
    }
  ],
  posts: [
    {
      id: "post-1",
      author: { name: "Clara Outdoors", avatar: "avatar_clara" },
      time: "2 hours ago",
      content: "Waking up to this in Utah! Dispersed campsite at Pine Ridge. Perfect solar gain today, battery bank already at 90% by noon.",
      image: "image_desert",
      likes: 12,
      likedByUser: false,
      comments: [
        { user: "Nomad Bob", text: "Looks incredible Clara! How is the cell signal out there?" },
        { user: "Clara Outdoors", text: "Pretty solid Bob. 3 bars LTE on Verizon." }
      ]
    },
    {
      id: "post-2",
      author: { name: "Forest Nomad", avatar: "avatar_forest" },
      time: "1 day ago",
      content: "Just finished my custom ceiling panels. Used tongue-and-groove cedar. Added 200W more solar panels on the roof rack today.",
      image: "image_interior",
      likes: 34,
      likedByUser: true,
      comments: [
        { user: "Solar Explorer", text: "Awesome craftsmanship! Cedar smell must be fantastic." }
      ]
    },
    {
      id: "post-3",
      author: { name: "Baja Surfer", avatar: "avatar_surf" },
      time: "3 days ago",
      content: "Moored up right on the beach in San Felipe. Flat sands and warm water. Highly recommend crossing at Calexico, very smooth.",
      image: "image_beach",
      likes: 45,
      likedByUser: false,
      comments: []
    }
  ],
  marketplace: [
    {
      id: "market-1",
      title: "Renogy 100W Solar Panel (Portable)",
      category: "electrical",
      price: 120,
      location: "Moab, UT",
      zip: "84532",
      lat: 38.5733,
      lng: -109.5498,
      condition: "Like New",
      description: "Includes built-in kickstand and 10A charge controller. Great add-on to lay out in the sun while parked in the shade. Anderson connectors.",
      seller: { name: "Solar Explorer", avatar: "avatar_solar" },
      image: "item_solar"
    },
    {
      id: "market-2",
      title: "Dometic CFX3 35 L Portable Fridge",
      category: "gear",
      price: 450,
      location: "Bend, OR",
      zip: "97701",
      lat: 44.0582,
      lng: -121.3153,
      condition: "Used - Good",
      description: "Efficient compressor fridge/freezer. Runs on 12V DC or 110V AC. Minimal power draw, fits easily between front seats of Sprinter or Transit.",
      seller: { name: "Forest Nomad", avatar: "avatar_forest" },
      image: "item_gear"
    },
    {
      id: "market-3",
      title: "MaxxFan Deluxe 7500K Ventilator",
      category: "parts",
      price: 180,
      location: "Flagstaff, AZ",
      zip: "86001",
      lat: 35.1983,
      lng: -111.6513,
      condition: "New in Box",
      description: "Smoke lid. 10-speed motor, intake/exhaust, rain shield. Bought for a build but changed layouts. Retails for $260.",
      seller: { name: "Nomad Bob", avatar: "avatar_bob" },
      image: "item_fan"
    },
    {
      id: "market-4",
      title: "2018 Ford Transit Custom Rig",
      category: "campervan",
      price: 42000,
      location: "Denver, CO",
      zip: "80202",
      lat: 39.7392,
      lng: -104.9903,
      condition: "Excellent",
      description: "148\" wheelbase, mid-roof, eco-boost. Fully insulated with Thinsulate. 300W Solar, 200Ah Lithium, custom birch cabinets, running water. 52,000 miles.",
      seller: { name: "Clara Outdoors", avatar: "avatar_clara" },
      image: "item_van"
    },
    {
      id: "market-skill-1",
      title: "Off-Grid Solar System Design",
      category: "services-offer",
      price: 0,
      location: "Moab, UT",
      zip: "84532",
      lat: 38.5733,
      lng: -109.5498,
      condition: "Service Offered",
      description: "Happy to review wiring schematics, calculate solar sizing, and assist with Victron multiplus setup. Swapping for custom wood panel work.",
      seller: { name: "Solar Explorer", avatar: "avatar_solar" },
      image: "item_solar"
    },
    {
      id: "market-skill-2",
      title: "Engine Diagnostics & Alternator Checks",
      category: "services-offer",
      price: 0,
      location: "Flagstaff, AZ",
      zip: "86001",
      lat: 35.1983,
      lng: -111.6513,
      condition: "Service Offered",
      description: "Have a heavy-duty OBD2 scanner. Can diagnose engine lights, check alternator health, and clear basic codes. Swap for sourdough bread or campfire beer.",
      seller: { name: "Nomad Bob", avatar: "avatar_bob" },
      image: "item_gear"
    },
    {
      id: "market-skill-3",
      title: "Water Plumbing & PEX Install",
      category: "services-want",
      price: 0,
      location: "Bend, OR",
      zip: "97701",
      lat: 44.0582,
      lng: -121.3153,
      condition: "Service Wanted",
      description: "Need help laying out my PEX lines, installing a Shurflo pump and accumulator tank. Have the materials, just nervous about leaks! Can trade solar help.",
      seller: { name: "Forest Nomad", avatar: "avatar_forest" },
      image: "item_fan"
    },
    {
      id: "market-skill-4",
      title: "Remote Web Design & SEO Advice",
      category: "services-offer",
      price: 0,
      location: "Flagstaff, AZ",
      zip: "86001",
      lat: 35.1983,
      lng: -111.6513,
      condition: "Service Offered",
      description: "Offering website audits, setting up landing pages, or SEO advice for digital nomads trying to work from the road. Trade for suspension install help.",
      seller: { name: "Clara Outdoors", avatar: "avatar_clara" },
      image: "item_van"
    }
  ],
  tribes: [
    {
      id: "tribe-1",
      title: "Solitary Solars",
      membersCount: 142,
      banner: "forest",
      iconLetter: "SS",
      description: "For the nomads who value deep silence, off-grid battery capability, and parking miles away from the nearest rig.",
      joined: true
    },
    {
      id: "tribe-2",
      title: "Baja Surf Caravan",
      membersCount: 89,
      banner: "desert",
      iconLetter: "BC",
      description: "Nomads traveling down the peninsula in search of empty point breaks, warm beaches, and local campfires.",
      joined: false
    },
    {
      id: "tribe-3",
      title: "Off-Grid Engineers",
      membersCount: 215,
      banner: "ocean",
      iconLetter: "OE",
      description: "Electrical, mechanical, and software nomads. Swapping schematics, 12V engineering hacks, and coding from the pine trees.",
      joined: true
    },
    {
      id: "tribe-4",
      title: "Sprinter Nomads",
      membersCount: 310,
      banner: "mountain",
      iconLetter: "SN",
      description: "A community for Sprinter van owners. Exchanging tips on maintenance, parts, limp-mode diagnosis, and diesel mechanics.",
      joined: false
    }
  ],
  tribeChats: {
    "tribe-1": [
      { sender: "Solar Explorer", text: "Welcome to Solitary Solars! Let's share some peaceful spots.", time: "10:14 AM" },
      { sender: "Nomad Bob", text: "Moab coordinates 38.573, -109.549 are beautiful right now.", time: "11:22 AM" }
    ],
    "tribe-3": [
      { sender: "Clara Outdoors", text: "Off-grid engineering chat is live. Anyone have tips on 24V setups?", time: "2:05 PM" }
    ]
  },
  tribeThreads: {
    "tribe-1": [
      { id: "tthread-1", title: "Moab Off-Grid Camping with Solar", author: "Solar Explorer", body: "What are your favorite spots around Moab with zero tree obstruction?", time: "1 day ago", replies: [
        { author: "Nomad Bob", body: "Along Willow Springs Road has perfect open exposure, though it can get crowded.", time: "12 hours ago" }
      ]}
    ],
    "tribe-3": [
      { id: "tthread-2", title: "24V vs 12V LiFePO4 Battery Systems", author: "Clara Outdoors", body: "Planning a large build. Is it worth stepping up to 24V for inverter efficiency?", time: "2 days ago", replies: [
        { author: "Baja Surfer", body: "Absolutely! Keeps cable gauge sizes smaller and inverter runs cooler.", time: "1 day ago" }
      ]}
    ]
  },
  forum: [
    {
      id: "thread-1",
      title: "Is 400W solar enough for induction cooking?",
      category: "electrical",
      author: { name: "Forest Nomad", avatar: "avatar_forest" },
      repliesCount: 3,
      viewsCount: 184,
      date: "2 days ago",
      body: "I am planning my electrical build. I want to avoid propane entirely. I have a 300Ah lithium bank and a 3000W inverter. Will 400W solar keep up if I cook twice a day?",
      replies: [
        {
          author: { name: "Solar Explorer", avatar: "avatar_solar" },
          date: "Yesterday",
          body: "It depends heavily on weather. In sunny climates (UT, AZ), 400W is plenty to replenish the draw. In Oregon/PNW, you will struggle. I recommend adding a DC-DC charger to charge from your alternator while driving."
        },
        {
          author: { name: "Nomad Bob", avatar: "avatar_bob" },
          date: "Yesterday",
          body: "Agree with Solar Explorer. Alternator charging is a must for induction. Cooking pulls about 100A at 12V. Twice a day is about 40-50Ah total. Totally doable if you have a way to charge when cloudy."
        },
        {
          author: { name: "Forest Nomad", avatar: "avatar_forest" },
          date: "12 hours ago",
          body: "Thanks! I just ordered a 50A DC-DC charger. Appreciate the peace of mind advice."
        }
      ]
    },
    {
      id: "thread-2",
      title: "Campsite safety tips for remote BLM land parking",
      category: "destinations",
      author: { name: "Clara Outdoors", avatar: "avatar_clara" },
      repliesCount: 2,
      viewsCount: 325,
      date: "4 days ago",
      body: "Safety is a top priority when camping far off grid. Here are my main practices: 1) Always park facing out for quick exit. 2) Keep keys in the exact same spot. 3) Scout the road out first. What do you do?",
      replies: [
        {
          author: { name: "Baja Surfer", avatar: "avatar_surf" },
          date: "3 days ago",
          body: "Also check the weather forecast for flash floods. Getting stuck in muddy BLM clay roads is no joke."
        },
        {
          author: { name: "Nomad Bob", avatar: "avatar_bob" },
          date: "2 days ago",
          body: "Letting someone know your coordinates before you lose signal is a lifesaver. I always send my camp spots via Garmin inReach."
        }
      ]
    },
    {
      id: "thread-3",
      title: "T1N Sprinter limp mode - Code P2002 advice",
      category: "builds",
      author: { name: "Solar Explorer", avatar: "avatar_solar" },
      repliesCount: 1,
      viewsCount: 98,
      date: "1 day ago",
      body: "My 2006 Sprinter just went into limp mode on the highway. OBD reader pulled code P2002 (DPF efficiency). Has anyone cleared this or is a replacement inevitable?",
      replies: [
        {
          author: { name: "Nomad Bob", avatar: "avatar_bob" },
          date: "10 hours ago",
          body: "Could just be a clogged DPF sensor tube. Inspect the rubber hoses going to the pressure sensor first. They rot out and cause false readings. Cleared mine last year by replacing a $5 hose!"
        }
      ]
    }
  ],
  activeTab: "dashboard",
  searchQuery: "",
  activeForumCategory: "all",
  activeThreadId: null,
  leafletMap: null,
  leafletTileLayer: null,
  mapMarkers: [],
  darkMode: false,
  activeChats: [],
  minimizedChats: [],
  chats: {
    "Clara Outdoors": [
      { id: "c1", sender: "Clara Outdoors", text: "Hey Bob! Are you heading to the Quartzsite gather next month?", time: "Wed 11:43 PM", reaction: true },
      { id: "c2", sender: "Nomad Bob", text: "Hey Clara! Yes, planning to be there around the 15th.", time: "Wed 11:45 PM" },
      { id: "c3", sender: "Clara Outdoors", text: "Awesome! Let's save a camp spot together. Off-grid is the only way 🌵", time: "Wed 11:46 PM" }
    ],
    "Forest Nomad": [
      { id: "f1", sender: "Nomad Bob", text: "Hey Forest, loved your cedar tongue-and-groove ceiling build post!", time: "Yesterday" },
      { id: "f2", sender: "Forest Nomad", text: "Thanks Bob! Took three days but the smell of cedar is worth it. 🪵", time: "Yesterday" }
    ]
  }
};

// SVG Assets Generator (dynamic clean SVG templates converted to Base64 at runtime)
const SVG_ASSETS = {
  avatar_bob: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#3B7A57"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="white" text-anchor="middle">NB</text></svg>`,
  avatar_clara: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#A2BEA9"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" text-anchor="middle">CO</text></svg>`,
  avatar_forest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#6E6A5F"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="white" text-anchor="middle">FN</text></svg>`,
  avatar_solar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#2D2D2D"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="#F4F1EA" text-anchor="middle">SE</text></svg>`,
  avatar_surf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#5C8D70"/><text x="50" y="58" font-size="28" font-family="Inter,sans-serif" font-weight="700" fill="white" text-anchor="middle">BS</text></svg>`,
  
  image_desert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#EAE6DC"/><path d="M 0 250 L 100 130 L 220 200 L 350 80 L 400 150 L 400 250 Z" fill="#DCD6C5"/><circle cx="320" cy="60" r="25" fill="#3B7A57" opacity="0.15"/><text x="20" y="40" font-family="Inter,sans-serif" font-weight="700" fill="#6E6A5F" font-size="14">Utah Desert Campsite</text></svg>`,
  image_interior: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#FAF9F6"/><rect x="40" y="60" width="320" height="150" rx="8" fill="#E5E0D4"/><line x1="200" y1="60" x2="200" y2="210" stroke="#DCD6C5" stroke-width="2"/><text x="20" y="40" font-family="Inter,sans-serif" font-weight="700" fill="#6E6A5F" font-size="14">Rig Ceiling Tongue &amp; Groove</text></svg>`,
  image_beach: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#F4F1EA"/><path d="M 0 200 Q 150 180 400 220 L 400 250 L 0 250 Z" fill="#E5E0D4"/><circle cx="100" cy="100" r="40" fill="#3B7A57" opacity="0.08"/><text x="20" y="40" font-family="Inter,sans-serif" font-weight="700" fill="#6E6A5F" font-size="14">San Felipe Surf Check</text></svg>`,

  item_solar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#2D2D2D"/><rect x="20" y="20" width="360" height="210" fill="none" stroke="#FAF9F6" stroke-width="4"/><line x1="200" y1="20" x2="200" y2="230" stroke="#FAF9F6" stroke-width="2"/><line x1="20" y1="125" x2="380" y2="125" stroke="#FAF9F6" stroke-width="2"/><text x="35" y="45" font-family="Inter,sans-serif" font-weight="700" fill="white" font-size="14">Renogy 100W Solar</text></svg>`,
  item_gear: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#FAF9F6"/><rect x="100" y="50" width="200" height="150" rx="10" fill="#6E6A5F"/><rect x="120" y="70" width="160" height="80" rx="4" fill="#FAF9F6"/><circle cx="200" cy="175" r="10" fill="#3B7A57"/><text x="20" y="35" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" font-size="14">Dometic CFX3 Fridge</text></svg>`,
  item_fan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#EAE6DC"/><circle cx="200" cy="125" r="80" fill="none" stroke="#2D2D2D" stroke-width="4"/><circle cx="200" cy="125" r="20" fill="#3B7A57"/><path d="M 200 125 L 140 80 M 200 125 L 260 80 M 200 125 L 200 205" stroke="#2D2D2D" stroke-width="8" stroke-linecap="round"/><text x="20" y="35" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" font-size="14">MaxxFan Roof Ventilator</text></svg>`,
  item_van: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#E5E0D4"/><path d="M 50 160 L 90 90 L 290 90 L 350 120 L 350 180 L 50 180 Z" fill="#FAF9F6" stroke="#2D2D2D" stroke-width="4"/><circle cx="100" cy="180" r="20" fill="#2D2D2D"/><circle cx="300" cy="180" r="20" fill="#2D2D2D"/><rect x="250" y="100" width="80" height="40" rx="4" fill="#3B7A57" opacity="0.3"/><text x="20" y="35" font-family="Inter,sans-serif" font-weight="700" fill="#2D2D2D" font-size="14">Transit 148 Custom Camper</text></svg>`,
};

function getSvgDataUri(svgString) {
  // UTF-8 base64 encoding safe for all browsers
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function getAvatarSrc(key) {
  if (key && key.startsWith('data:')) return key;
  const svg = SVG_ASSETS[key] || SVG_ASSETS.avatar_bob;
  return getSvgDataUri(svg);
}

function getImageSrc(key) {
  if (key && key.startsWith('data:')) return key;
  const svg = SVG_ASSETS[key] || SVG_ASSETS.image_desert;
  return getSvgDataUri(svg);
}

function getUserReputationBadge(name) {
  const user = State.users.find(u => u.name === name);
  const rep = user ? (user.reputation || 0) : 0;
  return ` <span class="user-rep-score" title="Reputation Points" style="color: var(--accent-green); font-weight: 700; font-size: 11px; margin-left: 2px;">★${rep}</span>`;
}

// LocalStorage Synchronization
function saveStateToStorage() {
  localStorage.setItem('vanlyfa_state', JSON.stringify({
    spots: State.spots,
    meetups: State.meetups,
    posts: State.posts,
    marketplace: State.marketplace,
    tribes: State.tribes,
    tribeChats: State.tribeChats,
    tribeThreads: State.tribeThreads,
    forum: State.forum,
    currentUser: State.currentUser,
    users: State.users,
    chats: State.chats,
    activeChats: State.activeChats,
    minimizedChats: State.minimizedChats
  }));
}

function loadStateFromStorage() {
  const saved = localStorage.getItem('vanlyfa_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge with default state
      State.spots = parsed.spots || State.spots;
      State.meetups = parsed.meetups || State.meetups;
      State.posts = parsed.posts || State.posts;
      State.marketplace = parsed.marketplace || State.marketplace;
      State.tribes = parsed.tribes || State.tribes;
      State.tribeChats = parsed.tribeChats || State.tribeChats;
      State.tribeThreads = parsed.tribeThreads || State.tribeThreads;
      State.forum = parsed.forum || State.forum;
      State.currentUser = parsed.currentUser || State.currentUser;
      State.users = parsed.users || State.users;
      State.chats = parsed.chats || State.chats;
      State.activeChats = parsed.activeChats || State.activeChats;
      State.minimizedChats = parsed.minimizedChats || State.minimizedChats;
    } catch(e) {
      console.warn("Could not load stored state, using defaults", e);
    }
  }
}

// Toast Alert System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="check-circle-2"></i> <span>${message}</span>`;
  container.appendChild(toast);
  
  // trigger icons
  lucide.createIcons();
  
  // animate in
  setTimeout(() => toast.classList.add('show'), 50);
  
  // remove after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Unified Backend Client Simulator
 * This helper isolates and abstracts all DDL/DML data layer mutations.
 * To integrate with a real database (e.g. Supabase, Firebase, Node/Express REST API),
 * simply swap out the fetch/save local implementations here with database fetches.
 */
const Backend = {
  // --- SPOTS/MAPS API ---
  async fetchSpots() {
    return Promise.resolve(State.spots || []);
  },
  async saveSpot(spot) {
    if (!State.spots) State.spots = [];
    State.spots.push(spot);
    saveStateToStorage();
    return Promise.resolve(spot);
  },
  async vouchForSpot(spotId, username) {
    const spot = State.spots.find(s => s.id === spotId);
    if (spot) {
      if (!spot.vouchedBy) spot.vouchedBy = [];
      if (!spot.vouchedBy.includes(username)) {
        spot.vouchedBy.push(username);
      } else {
        spot.vouchedBy = spot.vouchedBy.filter(u => u !== username);
      }
      saveStateToStorage();
    }
    return Promise.resolve(spot);
  },

  // --- SOCIAL FEED API ---
  async fetchFeedPosts() {
    return Promise.resolve(State.feedPosts || []);
  },
  async createPost(post) {
    if (!State.feedPosts) State.feedPosts = [];
    State.feedPosts.unshift(post);
    saveStateToStorage();
    return Promise.resolve(post);
  },
  async toggleLikePost(postId, username) {
    const post = State.feedPosts.find(p => p.id === postId);
    if (post) {
      if (!post.likes) post.likes = [];
      if (post.likes.includes(username)) {
        post.likes = post.likes.filter(u => u !== username);
      } else {
        post.likes.push(username);
      }
      saveStateToStorage();
    }
    return Promise.resolve(post);
  },
  async addComment(postId, comment) {
    const post = State.feedPosts.find(p => p.id === postId);
    if (post) {
      if (!post.comments) post.comments = [];
      post.comments.push(comment);
      saveStateToStorage();
    }
    return Promise.resolve(post);
  },

  // --- MARKETPLACE API ---
  async fetchListings() {
    return Promise.resolve(State.marketplace || []);
  },
  async createListing(listing) {
    if (!State.marketplace) State.marketplace = [];
    State.marketplace.unshift(listing);
    saveStateToStorage();
    return Promise.resolve(listing);
  },

  // --- DISCUSSION FORUM API ---
  async fetchForumThreads() {
    return Promise.resolve(State.forumThreads || []);
  },
  async createThread(thread) {
    if (!State.forumThreads) State.forumThreads = [];
    State.forumThreads.unshift(thread);
    saveStateToStorage();
    return Promise.resolve(thread);
  },
  async addReplyToThread(threadId, reply) {
    const thread = State.forumThreads.find(t => t.id === threadId);
    if (thread) {
      if (!thread.replies) thread.replies = [];
      thread.replies.push(reply);
      thread.repliesCount = thread.replies.length;
      thread.lastReply = {
        user: reply.author.name,
        avatar: reply.author.avatar,
        time: reply.time
      };
      saveStateToStorage();
    }
    return Promise.resolve(thread);
  },

  // --- DIRECT MESSAGING (DM) API ---
  async fetchChatHistory(username) {
    if (!State.chats) State.chats = {};
    return Promise.resolve(State.chats[username] || []);
  },
  async sendMessage(recipient, message) {
    if (!State.chats) State.chats = {};
    if (!State.chats[recipient]) State.chats[recipient] = [];
    State.chats[recipient].push(message);
    saveStateToStorage();
    return Promise.resolve(message);
  },

  // --- USER PROFILE & RELATIONSHIPS ---
  async updateProfile(profileDetails) {
    Object.assign(State.currentUser, profileDetails);
    const userInDb = State.users.find(u => u.name === State.currentUser.name);
    if (userInDb) {
      Object.assign(userInDb, profileDetails);
    }
    saveStateToStorage();
    return Promise.resolve(State.currentUser);
  },
  async toggleFriendship(targetUser) {
    const currentName = State.currentUser.name;
    const target = State.users.find(u => u.name === targetUser);
    const self = State.users.find(u => u.name === currentName);
    
    if (target && self) {
      if (!self.friends) self.friends = [];
      if (!target.friends) target.friends = [];
      
      const isFriend = self.friends.includes(targetUser);
      if (isFriend) {
        self.friends = self.friends.filter(name => name !== targetUser);
        target.friends = target.friends.filter(name => name !== currentName);
      } else {
        self.friends.push(targetUser);
        target.friends.push(currentName);
      }
      State.currentUser.friends = self.friends;
      saveStateToStorage();
    }
    return Promise.resolve();
  },
  async toggleReputationScore(targetUser) {
    const currentName = State.currentUser.name;
    const target = State.users.find(u => u.name === targetUser);
    
    if (target && currentName !== targetUser) {
      if (!State.currentUser.givenRepTo) State.currentUser.givenRepTo = [];
      const hasGiven = State.currentUser.givenRepTo.includes(targetUser);
      if (hasGiven) {
        State.currentUser.givenRepTo = State.currentUser.givenRepTo.filter(name => name !== targetUser);
        target.reputation = Math.max(0, (target.reputation || 0) - 1);
      } else {
        State.currentUser.givenRepTo.push(targetUser);
        target.reputation = (target.reputation || 0) + 1;
      }
      saveStateToStorage();
    }
    return Promise.resolve();
  }
};

// App Initialization
function initApp() {
  // Load saved state
  loadStateFromStorage();
  
  // Read saved theme
  const savedDark = localStorage.getItem('vanlyfa_dark_mode') === 'true';
  if (savedDark) {
    State.darkMode = true;
    document.body.classList.add('dark-mode');
  }
  updateThemeToggleUI();
  
  // Render sidebar profile details
  updateSidebarProfileWidget();
  
  // Set up click handlers for Tab navigation
  document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      if (tab === 'profile') {
        State.activeProfileName = null;
      }
      switchTab(tab);
    });
  });
  
  // Set up modal open/close handlers
  setupModalHandlers();
  
  // Setup Search logic
  const searchInput = document.getElementById('global-search');
  searchInput.addEventListener('input', (e) => {
    State.searchQuery = e.target.value.toLowerCase();
    renderCurrentTab();
  });

  // Marketplace Filter Listeners
  const marketCat = document.getElementById('market-filter-category');
  if (marketCat) marketCat.addEventListener('change', renderMarketplaceListings);
  
  const marketSort = document.getElementById('market-sort-price');
  if (marketSort) marketSort.addEventListener('change', renderMarketplaceListings);
  
  const marketZip = document.getElementById('market-filter-zip');
  if (marketZip) marketZip.addEventListener('input', renderMarketplaceListings);
  
  const marketRad = document.getElementById('market-filter-radius');
  if (marketRad) marketRad.addEventListener('change', renderMarketplaceListings);

  // Theme Toggle Button
  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    State.darkMode = !State.darkMode;
    document.body.classList.toggle('dark-mode', State.darkMode);
    localStorage.setItem('vanlyfa_dark_mode', State.darkMode);
    updateThemeToggleUI();
  });
  
  // Map Info Drawer Close
  document.getElementById('drawer-close').addEventListener('click', () => {
    document.getElementById('map-info-drawer').classList.remove('open');
  });
  
  // Drawer Mark Visited Button
  const markVisitedBtn = document.getElementById('drawer-mark-visited-btn');
  if (markVisitedBtn) {
    markVisitedBtn.addEventListener('click', markCurrentSpotAsVisited);
  }
  
  // Main header action button
  document.getElementById('main-action-btn').addEventListener('click', () => {
    triggerMainActionButtonModal();
  });
  
  // Post button inside feed sidebar
  document.getElementById('feed-post-btn').addEventListener('click', () => {
    openModal('modal-add-post');
  });
  
  // Feed shelving toggle listeners
  const shelfBtn = document.getElementById('shelf-feed-btn');
  if (shelfBtn) {
    shelfBtn.addEventListener('click', () => toggleFeedShelf(true));
  }
  
  const unshelfBtn = document.getElementById('unshelf-feed-btn');
  if (unshelfBtn) {
    unshelfBtn.addEventListener('click', () => toggleFeedShelf(false));
  }
  
  // Feed tab post submission
  const feedTabSubmit = document.getElementById('feed-tab-post-submit');
  if (feedTabSubmit) {
    feedTabSubmit.addEventListener('click', saveNewFeedTabPost);
  }

  // Forum categories sidebar event delegation
  const sidebarContainer = document.getElementById('forum-categories-sidebar');
  if (sidebarContainer) {
    sidebarContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.forum-cat-btn');
      if (btn) {
        State.activeForumCategory = btn.getAttribute('data-cat');
        State.activeThreadId = null;
        renderForumView();
      }
    });
  }
  
  // Back to forum button
  document.getElementById('back-to-forum-btn').addEventListener('click', () => {
    State.activeThreadId = null;
    renderForumView();
  });
  
  // Submit Forum Reply
  document.getElementById('forum-submit-reply-btn').addEventListener('click', () => {
    submitForumReply();
  });
  
  // Edit Profile button
  document.getElementById('profile-edit-btn').addEventListener('click', () => {
    openProfileEditModal();
  });

  // Friend actions on profile
  const profileFriendBtn = document.getElementById('profile-friend-btn');
  if (profileFriendBtn) {
    profileFriendBtn.addEventListener('click', toggleFriend);
  }
  
  const profileMsgBtn = document.getElementById('profile-message-btn');
  if (profileMsgBtn) {
    profileMsgBtn.addEventListener('click', () => {
      const user = getActiveUser();
      openDirectChat(user.name);
    });
  }
  const profileRepBtn = document.getElementById('profile-rep-btn');
  if (profileRepBtn) {
    profileRepBtn.addEventListener('click', toggleReputation);
  }

  // File upload inputs
  const avatarUpload = document.getElementById('edit-profile-avatar-upload');
  if (avatarUpload) {
    avatarUpload.addEventListener('change', handleProfilePhotoUpload);
  }
  
  const rigPhotoUpload = document.getElementById('profile-rig-photo-upload');
  if (rigPhotoUpload) {
    rigPhotoUpload.addEventListener('change', handleRigPhotoUpload);
  }

  const listingPhotoUpload = document.getElementById('list-photo-upload');
  if (listingPhotoUpload) {
    listingPhotoUpload.addEventListener('change', handleListingPhotoUpload);
  }

  const listImgSelect = document.getElementById('list-img-select');
  if (listImgSelect) {
    listImgSelect.addEventListener('change', (e) => {
      const container = document.getElementById('list-photo-preview-container');
      if (e.target.value !== 'custom') {
        if (container) container.style.display = 'none';
      } else {
        const preview = document.getElementById('list-photo-preview');
        if (preview && preview.src && preview.src.startsWith('data:') && container) {
          container.style.display = 'block';
        }
      }
    });
  }

  // Contacts Sidebar Drawer Event Listeners
  document.getElementById('contacts-toggle-btn').addEventListener('click', () => {
    document.getElementById('contacts-sidebar').classList.toggle('open');
    renderContactsSidebar();
  });
  
  document.getElementById('contacts-close-btn').addEventListener('click', () => {
    document.getElementById('contacts-sidebar').classList.remove('open');
  });

  // Mobile Hamburger Menu Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      openMobileDrawer();
    });
  }

  // Mobile Action Centered FAB toggle
  const mobileActionFab = document.getElementById('mobile-action-fab');
  if (mobileActionFab) {
    mobileActionFab.addEventListener('click', () => {
      openMobileActionMenu();
    });
  }

  // Action Menu backdrop click closes the sheet
  const mobileActionMenu = document.getElementById('mobile-action-menu');
  if (mobileActionMenu) {
    mobileActionMenu.addEventListener('click', (e) => {
      if (e.target === mobileActionMenu) {
        closeMobileActionMenu();
      }
    });
  }

  // Sidebar profile click goes to profile tab
  document.getElementById('sidebar-profile-btn').addEventListener('click', () => {
    State.activeProfileName = null;
    switchTab('profile');
  });
  
  // Initial render
  switchTab('dashboard');
  renderContactsSidebar();
  renderActiveChats();

  // Onboarding Welcome Modal Dismiss
  const welcomeDismissBtn = document.getElementById('welcome-dismiss-btn');
  const welcomeModal = document.getElementById('welcome-modal');
  if (welcomeDismissBtn && welcomeModal) {
    welcomeDismissBtn.addEventListener('click', () => {
      welcomeModal.classList.add('fading');
      setTimeout(() => {
        welcomeModal.classList.remove('active', 'fading');
        welcomeModal.style.display = 'none';
      }, 300);
    });
  }
  
  // Initialize Leaflet Map
  initLeafletMap();

  // Top-bar scroll disappear/re-appear listener for mobile
  let lastScrollTop = 0;
  document.querySelectorAll('.tab-content-pane').forEach(pane => {
    pane.addEventListener('scroll', (e) => {
      if (window.innerWidth <= 768) {
        const scrollTop = e.target.scrollTop;
        const topBar = document.querySelector('.top-bar');
        if (!topBar) return;
        
        // Threshold to prevent bounce artifacts
        if (Math.abs(lastScrollTop - scrollTop) <= 5) return;
        
        if (scrollTop > lastScrollTop && scrollTop > 64) {
          // Scroll Down - hide top-bar
          topBar.classList.add('hide-top-bar');
        } else {
          // Scroll Up - show top-bar
          topBar.classList.remove('hide-top-bar');
        }
        lastScrollTop = scrollTop;
      }
    });
  });

  // Visual Viewport resize handler to support keyboard under mobile chat box
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (typeof adjustChatContainerForVisualViewport === 'function') {
        adjustChatContainerForVisualViewport();
      }
    });
  }

  // Setup baseline history state
  history.replaceState({ tab: 'dashboard' }, '');

  // Popstate event handler for Android back swipe/gestures
  window.addEventListener('popstate', (event) => {
    // 1. If mobile drawer is open, close it
    const drawer = document.getElementById('mobile-drawer');
    if (drawer && drawer.classList.contains('open')) {
      closeMobileDrawer();
      return;
    }
    
    // 2. If DMs are open on mobile, close them
    if (window.innerWidth <= 768 && State.activeChats && State.activeChats.length > 0) {
      State.activeChats = [];
      State.minimizedChats = [];
      saveStateToStorage();
      renderActiveChats();
      renderContactsSidebar();
      return;
    }
    
    // 3. Otherwise switch tab based on history state
    if (event.state && event.state.tab) {
      switchTab(event.state.tab, true);
    } else {
      switchTab('dashboard', true);
    }
  });

  // Chat Backdrop click to close chats
  const chatBackdrop = document.getElementById('chat-backdrop');
  if (chatBackdrop) {
    chatBackdrop.addEventListener('click', () => {
      State.activeChats = [];
      State.minimizedChats = [];
      saveStateToStorage();
      renderActiveChats();
      renderContactsSidebar();
    });
  }
}

function updateThemeToggleUI() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    if (State.darkMode) {
      icon.setAttribute('data-lucide', 'sun');
    } else {
      icon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
  }
}

function updateSidebarProfileWidget() {
  document.getElementById('sidebar-user-avatar').src = getAvatarSrc(State.currentUser.avatar);
  document.getElementById('sidebar-user-name').innerText = State.currentUser.name;
  document.getElementById('sidebar-user-handle').innerText = State.currentUser.handle;
  
  // Update Feed tab avatar if it exists
  const feedTabAvatar = document.getElementById('feed-tab-user-avatar');
  if (feedTabAvatar) {
    feedTabAvatar.src = getAvatarSrc(State.currentUser.avatar);
  }
}

// Tab view switcher
function switchTab(tabName, isPopState = false) {
  State.activeTab = tabName;
  State.activeThreadId = null; // Reset forum viewing state
  
  // Reset top-bar scroll hide class
  const topBar = document.querySelector('.top-bar');
  if (topBar) topBar.classList.remove('hide-top-bar');
  
  // Update sidebar active class
  document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Update display containers
  document.querySelectorAll('.tab-content-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  const activePane = document.getElementById(`pane-${tabName}`);
  if (activePane) activePane.classList.add('active');
  
  // Update Page Title
  const titles = {
    dashboard: "Dashboard",
    feed: "Community Feed",
    marketplace: "Marketplace",
    tribes: "Tribes",
    meetups: "Meetups",
    forum: "Forum Board",
    messages: "Direct Messages",
    profile: "Rig Profile"
  };
  document.getElementById('page-display-title').innerText = titles[tabName] || "Vanlyfa";
  
  // Update search bar context / placeholder
  const placeholders = {
    dashboard: "Search vouched spots or posts...",
    feed: "Search feed posts...",
    marketplace: "Search rigs, items, services...",
    tribes: "Search caravaneer groups...",
    meetups: "Search fireside gatherings...",
    forum: "Search discussion topics...",
    messages: "Search direct messages...",
    profile: "Search profile specs..."
  };
  document.getElementById('global-search').placeholder = placeholders[tabName] || "Search...";
  
  // Render views & Update main action buttons
  updateHeaderActionButton();
  renderCurrentTab();
  
  // Relayout map if transitioning back to dashboard
  if (tabName === 'dashboard' && State.leafletMap) {
    setTimeout(() => {
      State.leafletMap.invalidateSize();
    }, 100);
  }
  if (tabName === 'profile' && State.profileMap) {
    setTimeout(() => {
      State.profileMap.invalidateSize();
    }, 100);
  }

  // Manage History API state for back buttons
  if (!isPopState) {
    if (tabName === 'dashboard') {
      history.replaceState({ tab: 'dashboard' }, '');
    } else {
      history.pushState({ tab: tabName }, '');
    }
  }

  // Disappear mobile action FAB on Feed or Marketplace type tabs
  const mobileActionFab = document.getElementById('mobile-action-fab');
  if (mobileActionFab) {
    if (['feed', 'marketplace', 'tribes', 'meetups', 'forum'].includes(tabName)) {
      mobileActionFab.classList.add('hide-fab');
    } else {
      mobileActionFab.classList.remove('hide-fab');
    }
  }
}

function toggleMobileFeedTab() {
  if (State.activeTab === 'feed') {
    switchTab('dashboard');
  } else {
    switchTab('feed');
  }
}

// Set header buttons dynamically depending on active tab
function updateHeaderActionButton() {
  const btn = document.getElementById('main-action-btn');
  const searchBar = document.getElementById('search-bar-container');
  
  if (State.activeTab === 'profile') {
    btn.style.display = 'none';
    searchBar.style.visibility = 'hidden';
    return;
  }
  
  btn.style.display = 'inline-flex';
  searchBar.style.visibility = 'visible';
  
  const configs = {
    dashboard: { text: "Add Spot", icon: "plus" },
    feed: { text: "Share Update", icon: "edit-3" },
    marketplace: { text: "Add Listing", icon: "plus" },
    tribes: { text: "Form Tribe", icon: "users" },
    meetups: { text: "Host Meetup", icon: "calendar" },
    forum: { text: "New Thread", icon: "plus" }
  };
  
  const conf = configs[State.activeTab];
  if (conf) {
    btn.innerHTML = `<i data-lucide="${conf.icon}"></i> <span>${conf.text}</span>`;
  }
  lucide.createIcons();
}

function triggerMainActionButtonModal() {
  const modals = {
    dashboard: 'modal-add-spot',
    feed: 'modal-add-post',
    marketplace: 'modal-add-listing',
    tribes: 'modal-add-tribe',
    meetups: 'modal-add-meetup',
    forum: 'modal-add-thread'
  };
  const modalId = modals[State.activeTab];
  if (modalId) openModal(modalId);
}

// Render tabs logic
function renderCurrentTab() {
  switch (State.activeTab) {
    case "dashboard":
      renderDashboardFeed();
      if (State.leafletMap) {
        renderLeafletMarkers();
      }
      break;
    case "feed":
      renderFeedTabPosts();
      break;
    case "marketplace":
      renderMarketplaceListings();
      break;
    case "tribes":
      renderTribesList();
      break;
    case "meetups":
      renderMeetupsList();
      break;
    case "forum":
      renderForumView();
      break;
    case "messages":
      renderContactsSidebar();
      break;
    case "profile":
      renderUserProfile();
      break;
  }
}

/* ==========================================================================
   RENDERERS
   ========================================================================== */

// 1. Social Feed Renderer (Shared between Dashboard Sidebar & Feed Tab)
function renderSocialFeed(containerId, isSidebar = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  const query = State.searchQuery;
  const filtered = State.posts.filter(p => {
    return p.content.toLowerCase().includes(query) || 
           p.author.name.toLowerCase().includes(query);
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:32px 0; color:var(--muted-text); font-size:13px;">No posts match your search.</div>`;
    return;
  }
  
  filtered.forEach(post => {
    const card = document.createElement('div');
    card.className = 'feed-post-card';
    if (!isSidebar) {
      card.style.backgroundColor = 'var(--card-bg)';
    }
    
    // image markup if exists
    let imgMarkup = '';
    if (post.image && post.image !== 'none') {
      imgMarkup = `<img src="${getImageSrc(post.image)}" alt="Post Media" class="post-image">`;
    }
    
    // comments markup
    let commentsMarkup = '';
    if (post.comments && post.comments.length > 0) {
      commentsMarkup = `
        <div class="thread-replies-list">
          ${post.comments.map(c => {
            // Find commenter's avatar from users list
            const commenter = State.users ? State.users.find(u => u.name === c.user) : null;
            const avatar = commenter ? commenter.avatar : 'solar';
            return `
              <div class="thread-reply-item">
                <img src="${getAvatarSrc(avatar)}" alt="${c.user}" class="reply-avatar" onclick="viewUserProfile('${c.user}')">
                <div class="reply-content-box">
                  <div class="reply-user-meta">
                    <span class="reply-username" onclick="viewUserProfile('${c.user}')">${c.user}${getUserReputationBadge(c.user)}</span>
                    <span class="reply-time">1h</span>
                  </div>
                  <p class="reply-text">${c.text}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="thread-post-layout">
        <!-- Left Column: Avatar & Connector line -->
        <div class="thread-left-col">
          <div class="thread-avatar-container">
            <img src="${getAvatarSrc(post.author.avatar)}" alt="${post.author.name}" onclick="viewUserProfile('${post.author.name}')" class="thread-avatar">
            <button class="thread-avatar-follow-btn"><i data-lucide="plus"></i></button>
          </div>
          ${post.comments && post.comments.length > 0 ? '<div class="thread-line"></div>' : ''}
        </div>
        
        <!-- Right Column: User details, post body, attachments, actions, replies -->
        <div class="thread-right-col">
          <div class="thread-header">
            <div class="thread-user-meta">
              <span class="thread-author-name" onclick="viewUserProfile('${post.author.name}')">${post.author.name}${getUserReputationBadge(post.author.name)}</span>
              ${post.author.name === 'Solar Explorer' || post.author.name === 'Nomad Bob' ? '<i data-lucide="badge-check" class="verified-badge" style="width:14px; height:14px; color:#1D9BF0; fill:#1D9BF0; display:inline-block; margin-left:2px; vertical-align:middle;"></i>' : ''}
              <span class="thread-dot">•</span>
              <span class="thread-time">${post.time}</span>
            </div>
            <button class="thread-options-btn"><i data-lucide="more-horizontal"></i></button>
          </div>
          
          <div class="thread-body">
            <p class="thread-content">${post.content}</p>
            ${imgMarkup}
          </div>
          
          <div class="thread-actions-bar">
            <button class="thread-action-icon-btn ${post.likedByUser ? 'liked' : ''}" onclick="toggleLike('${post.id}')" title="Like">
              <i data-lucide="heart"></i>
              <span>${post.likes || 0}</span>
            </button>
            <button class="thread-action-icon-btn" onclick="focusCommentInput('${post.id}')" title="Comment">
              <i data-lucide="message-circle"></i>
              <span>${post.comments ? post.comments.length : 0}</span>
            </button>
            <button class="thread-action-icon-btn" onclick="sharePost('${post.id}')" title="Repost">
              <i data-lucide="repeat"></i>
              <span>${post.reposts || Math.floor(Math.random() * 5) + 1}</span>
            </button>
            <button class="thread-action-icon-btn" onclick="sendPostDirect('${post.id}')" title="Send">
              <i data-lucide="send"></i>
              <span>${post.shares || Math.floor(Math.random() * 3) + 1}</span>
            </button>
          </div>
          
          ${commentsMarkup}
          
          <!-- Reply form -->
          <form class="thread-reply-form" onsubmit="submitComment(event, '${post.id}')">
            <img src="${getAvatarSrc(State.currentUser.avatar)}" alt="Me" class="thread-reply-avatar">
            <div class="thread-reply-input-wrapper">
              <input type="text" placeholder="Reply to ${post.author.name}..." id="comment-input-${post.id}" class="thread-reply-input">
              <button type="submit" class="thread-reply-submit-btn"><i data-lucide="corner-down-left"></i></button>
            </div>
          </form>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

function sharePost(postId) {
  const post = State.posts.find(p => p.id === postId);
  if (post) {
    if (!post.reposts) post.reposts = 0;
    post.reposts++;
    saveStateToStorage();
    renderDashboardFeed();
    renderFeedTabPosts();
    showToast("Shared update to your connections!", "success");
  }
}

function sendPostDirect(postId) {
  const post = State.posts.find(p => p.id === postId);
  if (post) {
    if (!post.shares) post.shares = 0;
    post.shares++;
    saveStateToStorage();
    renderDashboardFeed();
    renderFeedTabPosts();
    showToast("Post link copied to clipboard!", "success");
  }
}

window.sharePost = sharePost;
window.sendPostDirect = sendPostDirect;

function renderDashboardFeed() {
  renderSocialFeed('social-feed-list', true);
}

function renderFeedTabPosts() {
  renderSocialFeed('feed-tab-posts-list', false);
}

function toggleLike(postId) {
  const post = State.posts.find(p => p.id === postId);
  if (post) {
    if (post.likedByUser) {
      post.likes--;
      post.likedByUser = false;
    } else {
      post.likes++;
      post.likedByUser = true;
    }
    saveStateToStorage();
    renderDashboardFeed();
    renderFeedTabPosts();
  }
}

function focusCommentInput(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  if (input) input.focus();
}

function submitComment(e, postId) {
  e.preventDefault();
  const input = document.getElementById(`comment-input-${postId}`);
  if (input && input.value.trim() !== '') {
    const post = State.posts.find(p => p.id === postId);
    if (post) {
      post.comments.push({
        user: State.currentUser.name,
        text: input.value.trim()
      });
      input.value = '';
      saveStateToStorage();
      renderDashboardFeed();
      renderFeedTabPosts();
    }
  }
}

const ZIP_DATABASE = {
  "84532": { lat: 38.5733, lng: -109.5498, city: "Moab, UT" },
  "97701": { lat: 44.0582, lng: -121.3153, city: "Bend, OR" },
  "86001": { lat: 35.1983, lng: -111.6513, city: "Flagstaff, AZ" },
  "80202": { lat: 39.7392, lng: -104.9903, city: "Denver, CO" },
  "90210": { lat: 34.0736, lng: -118.4004, city: "Beverly Hills, CA" },
  "10001": { lat: 40.7501, lng: -73.9996, city: "New York, NY" },
  "85281": { lat: 33.4255, lng: -111.9400, city: "Tempe, AZ" }
};

function resolveZipCoordinates(zip) {
  if (ZIP_DATABASE[zip]) return ZIP_DATABASE[zip];
  if (/^\d{5}$/.test(zip)) {
    let hash = 0;
    for (let i = 0; i < zip.length; i++) {
      hash = zip.charCodeAt(i) + ((hash << 5) - hash);
    }
    const mockLat = 30 + (Math.abs(hash % 1000) / 1000) * 18;
    const mockLng = -124 + (Math.abs((hash >> 3) % 1000) / 1000) * 55;
    return { lat: mockLat, lng: mockLng, city: `Zip ${zip}` };
  }
  return null;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 2. Marketplace
function renderMarketplaceListings() {
  const grid = document.getElementById('marketplace-grid');
  grid.innerHTML = '';
  
  const catFilter = document.getElementById('market-filter-category').value;
  const priceSort = document.getElementById('market-sort-price').value;
  const zipFilter = document.getElementById('market-filter-zip').value.trim();
  const radiusFilter = document.getElementById('market-filter-radius').value;
  const query = State.searchQuery;
  
  let searchCoords = null;
  if (zipFilter) {
    searchCoords = resolveZipCoordinates(zipFilter);
  }
  
  let filtered = State.marketplace.filter(item => {
    const matchesCat = catFilter === 'all' || item.category === catFilter;
    const matchesQuery = item.title.toLowerCase().includes(query) || 
                         item.description.toLowerCase().includes(query) ||
                         item.location.toLowerCase().includes(query);
                         
    // Radius filtering
    if (searchCoords && radiusFilter !== 'any') {
      if (item.lat !== undefined && item.lng !== undefined) {
        const distance = calculateHaversineDistance(searchCoords.lat, searchCoords.lng, item.lat, item.lng);
        item.currentDistance = distance;
        return matchesCat && matchesQuery && distance <= parseFloat(radiusFilter);
      }
      return false;
    } else if (searchCoords) {
      if (item.lat !== undefined && item.lng !== undefined) {
        item.currentDistance = calculateHaversineDistance(searchCoords.lat, searchCoords.lng, item.lat, item.lng);
      } else {
        item.currentDistance = null;
      }
    } else {
      item.currentDistance = null;
    }
    
    return matchesCat && matchesQuery;
  });
  
  // Sort
  if (priceSort === 'low-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (priceSort === 'high-low') {
    filtered.sort((a, b) => b.price - a.price);
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 4; text-align:center; padding:64px; color:var(--muted-text);">No marketplace items match your filters.</div>`;
    return;
  }
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'market-card';
    
    const distanceText = item.currentDistance !== null ? ` • ${Math.round(item.currentDistance)} mi away` : '';
    const zipText = item.zip ? ` (${item.zip})` : '';
    
    const isService = item.category === 'services-offer' || item.category === 'services-want';
    const displayPrice = (isService || item.price === 0) ? 'Trade / Barter' : `$${item.price}`;
    
    const badgeClass = item.category === 'services-offer' ? 'badge-service-offer' : 
                       (item.category === 'services-want' ? 'badge-service-want' : '');
    
    card.innerHTML = `
      <div class="market-img-wrapper">
        <img src="${getImageSrc(item.image)}" alt="${item.title}" class="market-img">
        <span class="market-badge ${badgeClass}">${item.condition}</span>
      </div>
      <div class="market-details">
        <h3 class="market-title">${item.title}</h3>
        <div class="market-price">${displayPrice}</div>
        <div class="market-location">
          <i data-lucide="map-pin"></i>
          <span>${item.location}${zipText}${distanceText}</span>
        </div>
        <p style="font-size:12px; color:var(--muted-text); line-height:1.4;">${item.description.substring(0, 80)}...</p>
        <div class="market-footer">
          <div class="market-seller" onclick="viewUserProfile('${item.seller.name}')" style="cursor:pointer;">
            <img src="${getAvatarSrc(item.seller.avatar)}" alt="${item.seller.name}">
            <span>By ${item.seller.name}${getUserReputationBadge(item.seller.name)}</span>
          </div>
          <button class="btn btn-sm btn-primary" onclick="contactSeller('${item.seller.name}', '${item.title}')">Message</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  lucide.createIcons();
}

function contactSeller(sellerName, itemTitle) {
  openDirectChat(sellerName);
  if (itemTitle) {
    setTimeout(() => {
      const chatKey = sellerName;
      if (State.chats) {
        if (!State.chats[chatKey]) State.chats[chatKey] = [];
        const alreadyAsked = State.chats[chatKey].some(m => m.text.includes(itemTitle));
        if (!alreadyAsked) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            sender: State.currentUser.name,
            text: `Hi ${sellerName}! I'm interested in your listing: "${itemTitle}". Is it still available?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reaction: false
          };
          State.chats[chatKey].push(newMsg);
          saveStateToStorage();
          renderActiveChats();
          renderContactsSidebar();
          
          setTimeout(() => {
            simulateAutoReply(sellerName, `Hi Bob! Yes, it's still available. I'm currently parked near Flagstaff if you want to check it out.`, 1200);
          }, 800);
        }
      }
    }, 150);
  }
}


// 4. Tribes
function renderTribesList() {
  const grid = document.getElementById('tribes-grid');
  const yourGrid = document.getElementById('your-tribes-grid');
  const yourSection = document.getElementById('your-tribes-section');
  
  if (!grid) return;
  grid.innerHTML = '';
  if (yourGrid) yourGrid.innerHTML = '';
  
  const query = State.searchQuery;
  const filtered = State.tribes.filter(t => {
    return t.title.toLowerCase().includes(query) || 
           t.description.toLowerCase().includes(query);
  });
  
  const bannerColors = {
    forest: "linear-gradient(to right, #3B7A57, #5C8D70)",
    desert: "linear-gradient(to right, #DCD6C5, #6E6A5F)",
    ocean: "linear-gradient(to right, #2D2D2D, #3B7A57)",
    mountain: "linear-gradient(to right, #A6A194, #2D2D2D)"
  };
  
  // Populate "Your Tribes"
  const joinedTribes = State.tribes.filter(t => t.joined);
  if (joinedTribes.length > 0 && yourSection && yourGrid) {
    yourSection.style.display = 'block';
    joinedTribes.forEach(tribe => {
      const card = document.createElement('div');
      card.className = 'tribe-card';
      card.style.cursor = 'pointer';
      card.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') openTribeHub(tribe.id);
      };
      
      const bgGrad = bannerColors[tribe.banner] || bannerColors.forest;
      card.innerHTML = `
        <div class="tribe-banner" style="background: ${bgGrad}; height: 60px;">
          <div class="tribe-icon-overlap" style="width:36px; height:36px; font-size:14px; bottom:-12px; left:12px;">${tribe.iconLetter}</div>
        </div>
        <div class="tribe-details" style="padding: 16px 12px 12px 12px;">
          <h3 class="tribe-title" style="margin-top: 4px; font-size: 13px;">${tribe.title}</h3>
          <div class="tribe-meta" style="font-size:11px; margin-bottom:8px;">
            <span>${tribe.membersCount} Members</span>
          </div>
          <button class="btn btn-sm" style="width:100%; font-size:11px;" onclick="toggleTribeMembership('${tribe.id}')">Leave</button>
        </div>
      `;
      yourGrid.appendChild(card);
    });
  } else if (yourSection) {
    yourSection.style.display = 'none';
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:64px; color:var(--muted-text);">No tribes found matching your search.</div>`;
    return;
  }
  
  filtered.forEach(tribe => {
    const card = document.createElement('div');
    card.className = 'tribe-card';
    card.style.cursor = 'pointer';
    card.onclick = (e) => {
      if (e.target.tagName !== 'BUTTON') openTribeHub(tribe.id);
    };
    
    const bgGrad = bannerColors[tribe.banner] || bannerColors.forest;
    
    card.innerHTML = `
      <div class="tribe-banner" style="background: ${bgGrad}">
        <div class="tribe-icon-overlap">${tribe.iconLetter}</div>
      </div>
      <div class="tribe-details">
        <h3 class="tribe-title" style="margin-top: 12px;">${tribe.title}</h3>
        <div class="tribe-meta">
          <span>${tribe.membersCount} Members</span>
        </div>
        <p class="tribe-description">${tribe.description}</p>
        <div class="tribe-footer">
          <button class="btn btn-sm ${tribe.joined ? '' : 'btn-primary'}" onclick="toggleTribeMembership('${tribe.id}')">
            ${tribe.joined ? 'Leave Tribe' : 'Join Tribe'}
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  lucide.createIcons();
}

function openTribeHub(tribeId) {
  State.activeTribeId = tribeId;
  
  // Hide main list, show hub
  document.getElementById('tribes-main-view').style.display = 'none';
  document.getElementById('tribe-detail-view').style.display = 'block';
  
  // Render hub header
  renderTribeHubHeader(tribeId);
  
  // Default tab
  switchTribeHubTab('chat');
}

function closeTribeHub() {
  State.activeTribeId = null;
  document.getElementById('tribe-detail-view').style.display = 'none';
  document.getElementById('tribes-main-view').style.display = 'block';
  renderTribesList();
}

function renderTribeHubHeader(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  const container = document.getElementById('tribe-hub-header-card');
  if (!tribe || !container) return;
  
  const bannerColors = {
    forest: "linear-gradient(to right, #3B7A57, #5C8D70)",
    desert: "linear-gradient(to right, #DCD6C5, #6E6A5F)",
    ocean: "linear-gradient(to right, #2D2D2D, #3B7A57)",
    mountain: "linear-gradient(to right, #A6A194, #2D2D2D)"
  };
  const bgGrad = bannerColors[tribe.banner] || bannerColors.forest;

  container.innerHTML = `
    <div class="tribe-banner" style="background: ${bgGrad}; height: 120px; position: relative;">
      <button class="btn btn-sm" onclick="closeTribeHub()" style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; padding: 6px; display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="arrow-left"></i></button>
      <div class="tribe-icon-overlap" style="position: absolute; bottom: -20px; left: 24px; width: 64px; height: 64px; border-radius: 12px; background-color: var(--accent-green); color: white; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 4px solid var(--card-bg); box-shadow: var(--shadow-md);">${tribe.iconLetter}</div>
    </div>
    <div style="padding: 32px 24px 24px 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text-charcoal);">${tribe.title}</h2>
          <span style="font-size: 13px; color: var(--muted-text); font-weight: 600;">${tribe.membersCount} members</span>
        </div>
        <button class="btn ${tribe.joined ? 'btn-outline' : 'btn-primary'}" onclick="toggleTribeHubMembership('${tribe.id}')">
          ${tribe.joined ? 'Leave Tribe' : 'Join Tribe'}
        </button>
      </div>
      <p style="font-size: 14px; color: var(--text-charcoal); margin-top: 12px; line-height: 1.5;">${tribe.description}</p>
    </div>
  `;
  lucide.createIcons();
}

function toggleTribeHubMembership(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  if (tribe) {
    if (tribe.joined) {
      tribe.joined = false;
      tribe.membersCount--;
      showToast(`Left the "${tribe.title}" tribe.`);
    } else {
      tribe.joined = true;
      tribe.membersCount++;
      showToast(`Joined the "${tribe.title}" tribe!`, 'success');
    }
    saveStateToStorage();
    renderTribeHubHeader(tribeId);
    
    // Re-render chat/forum to apply join/leave lock overlays
    const activeTab = document.querySelector('.tribe-hub-tabs .tab-btn.active').id.includes('chat') ? 'chat' : 'forum';
    switchTribeHubTab(activeTab);
  }
}

function switchTribeHubTab(tabName) {
  const chatBtn = document.getElementById('tribe-tab-chat-btn');
  const forumBtn = document.getElementById('tribe-tab-forum-btn');
  
  const chatPane = document.getElementById('tribe-pane-chat');
  const forumPane = document.getElementById('tribe-pane-forum');
  
  if (tabName === 'chat') {
    chatBtn.classList.add('active');
    forumBtn.classList.remove('active');
    chatPane.style.display = 'block';
    forumPane.style.display = 'none';
    renderTribeHubChat(State.activeTribeId);
  } else {
    chatBtn.classList.remove('active');
    forumBtn.classList.add('active');
    chatPane.style.display = 'none';
    forumPane.style.display = 'block';
    renderTribeHubForum(State.activeTribeId);
  }
}

function renderTribeHubChat(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  const container = document.getElementById('tribe-chat-messages-area');
  const form = document.getElementById('tribe-chat-form');
  if (!tribe || !container) return;
  
  if (!tribe.joined) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; padding:32px; color:var(--muted-text);">
        <i data-lucide="lock" style="width:36px; height:36px; margin-bottom:12px; color:var(--muted-text);"></i>
        <h4 style="font-weight:700; color:var(--text-charcoal); margin-bottom:4px;">Join this Tribe</h4>
        <p style="font-size:13px; max-width:280px; line-height:1.4;">Only members of this tribe can read and participate in the live group chat.</p>
      </div>
    `;
    form.style.opacity = '0.5';
    form.querySelector('input').disabled = true;
    form.querySelector('button').disabled = true;
    lucide.createIcons();
    return;
  }
  
  form.style.opacity = '1';
  form.querySelector('input').disabled = false;
  form.querySelector('button').disabled = false;
  
  const chats = (State.tribeChats && State.tribeChats[tribeId]) || [];
  container.innerHTML = '';
  
  if (chats.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:32px 0; color:var(--muted-text); font-size:13px; font-style:italic;">No messages in this chat room yet. Send the first message!</div>`;
    return;
  }
  
  chats.forEach(msg => {
    const isMe = msg.sender === State.currentUser.name;
    const msgDiv = document.createElement('div');
    msgDiv.style.display = 'flex';
    msgDiv.style.flexDirection = 'column';
    msgDiv.style.alignItems = isMe ? 'flex-end' : 'flex-start';
    msgDiv.style.gap = '2px';
    
    const senderObj = State.users.find(u => u.name === msg.sender);
    const avatar = senderObj ? senderObj.avatar : 'solar';
    
    msgDiv.innerHTML = `
      <div style="font-size:10px; color:var(--muted-text); font-weight:600; display:flex; align-items:center; gap:4px;">
        ${!isMe ? `<img src="${getAvatarSrc(avatar)}" style="width:14px; height:14px; border-radius:50%; object-fit:cover;" />` : ''}
        <span>${msg.sender}</span>
        <span style="font-size:8px;">${msg.time}</span>
      </div>
      <div style="max-width:70%; padding:8px 12px; font-size:13px; line-height:1.4; border-radius:16px; background-color:${isMe ? 'var(--accent-green)' : 'var(--card-bg)'}; color:${isMe ? 'white' : 'var(--text-charcoal)'}; border:${isMe ? 'none' : '1px solid var(--border-light)'}; margin-top:2px;">
        ${msg.text}
      </div>
    `;
    container.appendChild(msgDiv);
  });
  
  container.scrollTop = container.scrollHeight;
}

function sendTribeChatMessage(e) {
  e.preventDefault();
  const tribeId = State.activeTribeId;
  const input = document.getElementById('tribe-chat-input');
  if (!tribeId || !input || input.value.trim() === '') return;
  
  if (!State.tribeChats) State.tribeChats = {};
  if (!State.tribeChats[tribeId]) State.tribeChats[tribeId] = [];
  
  State.tribeChats[tribeId].push({
    sender: State.currentUser.name,
    text: input.value.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  input.value = '';
  saveStateToStorage();
  renderTribeHubChat(tribeId);
  
  setTimeout(() => {
    if (State.activeTribeId === tribeId) {
      const responses = [
        "That sounds awesome! Totally agree.",
        "Good tip, thanks for sharing!",
        "Has anyone camped near there recently?",
        "Swapping solar power is the way to go.",
        "Perfect day for an off-grid build update!"
      ];
      const randomMsg = responses[Math.floor(Math.random() * responses.length)];
      const senders = ["Clara Outdoors", "Forest Nomad", "Baja Surfer", "Solar Explorer"];
      const randomSender = senders[Math.floor(Math.random() * senders.length)];
      
      State.tribeChats[tribeId].push({
        sender: randomSender,
        text: randomMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      saveStateToStorage();
      renderTribeHubChat(tribeId);
    }
  }, 1500);
}

function renderTribeHubForum(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  const container = document.getElementById('tribe-forum-list');
  if (!tribe || !container) return;
  
  if (!tribe.joined) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:64px 32px; color:var(--muted-text);">
        <i data-lucide="lock" style="width:36px; height:36px; margin-bottom:12px; color:var(--muted-text);"></i>
        <h4 style="font-weight:700; color:var(--text-charcoal); margin-bottom:4px;">Join this Tribe</h4>
        <p style="font-size:13px; max-width:280px; line-height:1.4;">Only members of this tribe can read and start discussion forum threads.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  const threads = (State.tribeThreads && State.tribeThreads[tribeId]) || [];
  container.innerHTML = '';
  
  if (threads.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:48px 0; color:var(--muted-text); font-size:13px; background-color:var(--card-bg); border:1px solid var(--border-color); border-radius:8px;">
        No discussion threads in this tribe yet. Start the conversation!
      </div>
    `;
    return;
  }
  
  threads.forEach(thread => {
    const row = document.createElement('div');
    row.style.backgroundColor = 'var(--card-bg)';
    row.style.border = '1px solid var(--border-color)';
    row.style.borderRadius = 'var(--radius-md)';
    row.style.padding = '16px';
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.gap = '8px';
    
    let repliesHtml = '';
    if (thread.replies && thread.replies.length > 0) {
      repliesHtml = `
        <div style="margin-top:12px; border-top:1px solid var(--border-light); padding-top:8px; display:flex; flex-direction:column; gap:8px;">
          ${thread.replies.map(r => `
            <div style="background-color:var(--bg-sand); padding:8px 12px; border-radius:8px; font-size:12px;">
              <span style="font-weight:700; color:var(--text-charcoal);">${r.author}:</span>
              <span style="color:var(--muted-text); margin-left:4px;">${r.body}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h4 style="font-size:14px; font-weight:700; color:var(--text-charcoal);">${thread.title}</h4>
          <span style="font-size:11px; color:var(--muted-text);">Posted by ${thread.author} • ${thread.time}</span>
        </div>
      </div>
      <p style="font-size:13px; color:var(--text-charcoal); line-height:1.4; margin-top:4px;">${thread.body}</p>
      
      ${repliesHtml}
      
      <!-- Quick reply form -->
      <form style="display:flex; gap:8px; margin-top:8px;" onsubmit="submitTribeThreadReply(event, '${tribeId}', '${thread.id}')">
        <input type="text" placeholder="Add to the discussion..." style="flex-grow:1; background-color:var(--bg-sand); border:1px solid var(--border-color); border-radius:16px; padding:6px 12px; font-size:11px; outline:none;" required />
        <button type="submit" class="btn btn-sm btn-primary" style="border-radius:16px; padding:4px 12px; font-size:10px;">Reply</button>
      </form>
    `;
    container.appendChild(row);
  });
}

function submitTribeThreadReply(e, tribeId, threadId) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (!input || input.value.trim() === '') return;
  
  const thread = State.tribeThreads[tribeId].find(t => t.id === threadId);
  if (thread) {
    if (!thread.replies) thread.replies = [];
    thread.replies.push({
      author: State.currentUser.name,
      body: input.value.trim()
    });
    input.value = '';
    saveStateToStorage();
    renderTribeHubForum(tribeId);
    showToast("Reply published!", "success");
  }
}

function openTribeNewThreadModal() {
  const title = prompt("Enter Discussion Title:");
  if (!title || title.trim() === '') return;
  const question = prompt("Enter Question or Message:");
  if (!question || question.trim() === '') return;
  
  const tribeId = State.activeTribeId;
  if (!tribeId) return;
  
  if (!State.tribeThreads) State.tribeThreads = {};
  if (!State.tribeThreads[tribeId]) State.tribeThreads[tribeId] = [];
  
  State.tribeThreads[tribeId].push({
    id: 'tthread-' + Date.now(),
    title: title.trim(),
    body: question.trim(),
    author: State.currentUser.name,
    time: 'Just now',
    replies: []
  });
  
  saveStateToStorage();
  renderTribeHubForum(tribeId);
  showToast("Discussion thread posted!", "success");
}

window.openTribeHub = openTribeHub;
window.closeTribeHub = closeTribeHub;
window.switchTribeHubTab = switchTribeHubTab;
window.toggleTribeHubMembership = toggleTribeHubMembership;
window.sendTribeChatMessage = sendTribeChatMessage;
window.submitTribeThreadReply = submitTribeThreadReply;
window.openTribeNewThreadModal = openTribeNewThreadModal;

function toggleTribeMembership(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  if (tribe) {
    if (tribe.joined) {
      tribe.joined = false;
      tribe.membersCount--;
      showToast(`Left the "${tribe.title}" tribe.`);
    } else {
      tribe.joined = true;
      tribe.membersCount++;
      showToast(`Joined the "${tribe.title}" tribe!`, 'success');
    }
    saveStateToStorage();
    renderTribesList();
  }
}

// 5. Meetups
function renderMeetupsList() {
  const container = document.getElementById('meetup-list-container');
  container.innerHTML = '';
  
  const query = State.searchQuery;
  const filtered = State.meetups.filter(m => {
    return m.title.toLowerCase().includes(query) || 
           m.description.toLowerCase().includes(query) ||
           m.location.toLowerCase().includes(query);
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:64px; color:var(--muted-text);">No caravan meetups match your search.</div>`;
    return;
  }
  
  filtered.forEach(meetup => {
    // Parse Date for Badge
    const d = new Date(meetup.date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()] || "Nov";
    const day = d.getDate() || "15";
    
    // User RSVP status
    const hasRsvped = meetup.attendees.includes('avatar_bob');
    
    const card = document.createElement('div');
    card.className = 'meetup-card';
    card.innerHTML = `
      <div class="meetup-date-badge">
        <span class="meetup-date-month">${month}</span>
        <span class="meetup-date-day">${day}</span>
      </div>
      <div class="meetup-info">
        <h3 class="meetup-title">${meetup.title}</h3>
        <div class="meetup-meta-items">
          <div class="meetup-meta-item">
            <i data-lucide="map-pin"></i>
            <span>${meetup.location}</span>
          </div>
          <div class="meetup-meta-item">
            <i data-lucide="clock"></i>
            <span>${meetup.time}</span>
          </div>
        </div>
        <p class="meetup-description">${meetup.description}</p>
      </div>
      <div class="meetup-actions">
        <div class="meetup-attendees">
          ${meetup.attendees.slice(0, 4).map(a => `<img src="${getAvatarSrc(a)}" alt="Attendee" class="attendee-img">`).join('')}
          ${meetup.attendees.length > 4 ? `<div class="attendee-img" style="background:#6E6A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">+${meetup.attendees.length - 4}</div>` : ''}
          <span class="attendee-count">${meetup.attendeesCount} RSVP'd</span>
        </div>
        <button class="btn btn-sm ${hasRsvped ? '' : 'btn-primary'}" onclick="toggleMeetupRsvp('${meetup.id}')">
          ${hasRsvped ? 'Going' : 'RSVP'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

function toggleMeetupRsvp(meetupId) {
  const meetup = State.meetups.find(m => m.id === meetupId);
  if (meetup) {
    const idx = meetup.attendees.indexOf('avatar_bob');
    if (idx > -1) {
      // cancel
      meetup.attendees.splice(idx, 1);
      meetup.attendeesCount--;
      showToast("Cancelled your RSVP.");
    } else {
      // rsvp
      meetup.attendees.push('avatar_bob');
      meetup.attendeesCount++;
      showToast("RSVP confirmed! See you at camp.", "success");
    }
    saveStateToStorage();
    renderMeetupsList();
  }
}

// 6. Forum board
function renderForumSidebar() {
  const sidebar = document.getElementById('forum-categories-sidebar');
  if (!sidebar) return;
  
  // Extract unique categories from threads, ignoring empty or undefined ones
  const categories = new Set();
  State.forum.forEach(thread => {
    if (thread.category) {
      const cat = thread.category.trim();
      if (cat) categories.add(cat.toLowerCase());
    }
  });
  
  // Convert set to sorted array
  const sortedCats = Array.from(categories).sort();
  
  // Start building the HTML.
  // The first button is "All Topics"
  let html = `
    <button class="forum-cat-btn ${State.activeForumCategory === 'all' ? 'active' : ''}" data-cat="all">
      <i data-lucide="message-square"></i>
      <span>All Topics</span>
    </button>
  `;
  
  // Add a button for each category
  sortedCats.forEach(cat => {
    // Capitalize category name for display
    const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
    
    // Select an icon based on category name if we want, or just use a default hash icon
    let icon = "hash";
    if (cat === "electrical") icon = "zap";
    else if (cat === "destinations" || cat === "spots") icon = "map-pin";
    else if (cat === "builds" || cat === "campervan") icon = "wrench";
    else if (cat === "cooking" || cat === "food") icon = "utensils";
    else if (cat === "pets" || cat === "dog") icon = "heart";
    
    html += `
      <button class="forum-cat-btn ${State.activeForumCategory === cat ? 'active' : ''}" data-cat="${cat}">
        <i data-lucide="${icon}"></i>
        <span style="text-transform: capitalize;">${displayName}</span>
      </button>
    `;
  });
  
  sidebar.innerHTML = html;
  lucide.createIcons();
}

function renderForumView() {
  const mainView = document.getElementById('forum-main-view');
  const detailView = document.getElementById('forum-thread-detail');
  
  if (State.activeThreadId) {
    mainView.style.display = 'none';
    detailView.style.display = 'block';
    renderThreadDetail();
  } else {
    mainView.style.display = 'grid';
    detailView.style.display = 'none';
    renderForumSidebar();
    renderThreadsList();
  }
}

function renderThreadsList() {
  const container = document.getElementById('forum-thread-list');
  container.innerHTML = '';
  
  const category = State.activeForumCategory;
  const query = State.searchQuery;
  
  const filtered = State.forum.filter(t => {
    const threadCat = (t.category || '').trim().toLowerCase();
    const matchesCat = category === 'all' || threadCat === category.toLowerCase();
    const matchesQuery = t.title.toLowerCase().includes(query) || 
                         t.body.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:64px; color:var(--muted-text);">No forum threads found matching your criteria.</div>`;
    return;
  }
  
  filtered.forEach(thread => {
    const lastReply = thread.replies.length > 0 ? thread.replies[thread.replies.length - 1] : null;
    
    const card = document.createElement('div');
    card.className = 'forum-thread-card';
    card.addEventListener('click', () => {
      viewThreadDetail(thread.id);
    });
    
    let lastPostMarkup = `<div class="thread-last-post"><span class="thread-last-user" onclick="event.stopPropagation(); viewUserProfile('${thread.author.name}')" style="cursor:pointer;">${thread.author.name}${getUserReputationBadge(thread.author.name)}</span><span style="font-size:9px;">OP</span></div>`;
    if (lastReply) {
      lastPostMarkup = `
        <div class="thread-last-post">
          <span class="thread-last-user" onclick="event.stopPropagation(); viewUserProfile('${lastReply.author.name}')" style="cursor:pointer;">${lastReply.author.name}${getUserReputationBadge(lastReply.author.name)}</span>
          <span style="font-size:9px;">Yesterday</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="thread-main">
        <h3 class="thread-title">${thread.title}</h3>
        <div class="thread-meta">
          <span>Started by <strong onclick="event.stopPropagation(); viewUserProfile('${thread.author.name}')" style="cursor:pointer; hover:underline;">${thread.author.name}${getUserReputationBadge(thread.author.name)}</strong></span>
          <span>•</span>
          <span style="text-transform: capitalize; color:var(--accent-green); font-weight:600;">${thread.category}</span>
        </div>
      </div>
      <div class="thread-stats">
        <div class="thread-stat-item">
          <span class="thread-stat-val">${thread.repliesCount}</span>
          <span>Replies</span>
        </div>
        <div class="thread-stat-item">
          <span class="thread-stat-val">${thread.viewsCount}</span>
          <span>Views</span>
        </div>
      </div>
      ${lastPostMarkup}
    `;
    container.appendChild(card);
  });
}

function viewThreadDetail(threadId) {
  const thread = State.forum.find(t => t.id === threadId);
  if (thread) {
    thread.viewsCount++;
    State.activeThreadId = threadId;
    saveStateToStorage();
    renderForumView();
  }
}

function renderThreadDetail() {
  const thread = State.forum.find(t => t.id === State.activeThreadId);
  if (!thread) return;
  
  const opContainer = document.getElementById('thread-op-container');
  const repliesContainer = document.getElementById('thread-replies-list');
  
  // Render OP
  opContainer.innerHTML = `
    <div class="post-user-info">
      <img src="${getAvatarSrc(thread.author.avatar)}" alt="${thread.author.name}" onclick="viewUserProfile('${thread.author.name}')" style="cursor:pointer;">
      <div class="post-meta">
        <span class="post-username" onclick="viewUserProfile('${thread.author.name}')" style="cursor:pointer;">${thread.author.name}${getUserReputationBadge(thread.author.name)}</span>
        <span class="post-time">${thread.date}</span>
      </div>
    </div>
    <h3 style="font-size:18px; font-weight:800; margin-top:8px;">${thread.title}</h3>
    <p class="post-content" style="font-size:14px; line-height:1.6;">${thread.body}</p>
  `;
  
  // Render Replies
  repliesContainer.innerHTML = '';
  if (thread.replies.length === 0) {
    repliesContainer.innerHTML = `<p style="color:var(--muted-text); font-size:12px; font-style:italic;">No replies yet. Be the first to answer!</p>`;
  } else {
    thread.replies.forEach(reply => {
      const card = document.createElement('div');
      card.className = 'reply-card';
      card.innerHTML = `
        <div class="post-user-info">
          <img src="${getAvatarSrc(reply.author.avatar)}" alt="${reply.author.name}" onclick="viewUserProfile('${reply.author.name}')" style="cursor:pointer;">
          <div class="post-meta">
            <span class="post-username" onclick="viewUserProfile('${reply.author.name}')" style="cursor:pointer;">${reply.author.name}${getUserReputationBadge(reply.author.name)}</span>
            <span class="post-time">${reply.date}</span>
          </div>
        </div>
        <p class="post-content" style="font-size:13px; line-height:1.5;">${reply.body}</p>
      `;
      repliesContainer.appendChild(card);
    });
  }
  
  lucide.createIcons();
}

function submitForumReply() {
  const textInput = document.getElementById('forum-reply-text');
  const body = textInput.value.trim();
  if (body === '') return;
  
  const thread = State.forum.find(t => t.id === State.activeThreadId);
  if (thread) {
    thread.replies.push({
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      date: "Just now",
      body: body
    });
    thread.repliesCount++;
    textInput.value = '';
    saveStateToStorage();
    renderThreadDetail();
    showToast("Reply published!", "success");
  }
}

// 7. My Profile
function renderUserProfile() {
  const user = getActiveUser();
  const isOwner = user.name === State.currentUser.name;
  
  // Update left column details
  document.getElementById('profile-user-avatar').src = getAvatarSrc(user.avatar);
  document.getElementById('profile-user-name').innerText = user.name;
  document.getElementById('profile-user-handle').innerText = user.handle || `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
  document.getElementById('profile-reputation-score').innerText = `Reputation: ${user.reputation || 0}`;
  document.getElementById('profile-user-bio').innerText = user.bio;
  
  // Show edit button for owner, show visitor actions for visitor
  const editBtn = document.getElementById('profile-edit-btn');
  const visitorActions = document.getElementById('profile-visitor-actions');
  const friendBtn = document.getElementById('profile-friend-btn');
  const repBtn = document.getElementById('profile-rep-btn');
  
  if (isOwner) {
    if (editBtn) editBtn.style.display = 'inline-flex';
    if (visitorActions) visitorActions.style.display = 'none';
  } else {
    if (editBtn) editBtn.style.display = 'none';
    if (visitorActions) visitorActions.style.display = 'flex';
    
    // Update Friend button text based on relationship
    const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
    const isFriend = currentUserObj && currentUserObj.friends && currentUserObj.friends.includes(user.name);
    if (friendBtn) {
      if (isFriend) {
        friendBtn.innerHTML = `<i data-lucide="user-minus"></i> <span>Remove Friend</span>`;
        friendBtn.classList.remove('btn-primary');
      } else {
        friendBtn.innerHTML = `<i data-lucide="user-plus"></i> <span>Add Friend</span>`;
        friendBtn.classList.add('btn-primary');
      }
    }

    // Update Reputation button text based on vote state
    const hasGivenRep = currentUserObj && currentUserObj.givenRepTo && currentUserObj.givenRepTo.includes(user.name);
    if (repBtn) {
      if (hasGivenRep) {
        repBtn.innerHTML = `<i data-lucide="thumbs-up"></i> <span>Reputation Given</span>`;
        repBtn.style.backgroundColor = 'var(--accent-green)';
        repBtn.style.color = 'white';
      } else {
        repBtn.innerHTML = `<i data-lucide="thumbs-up"></i> <span>Give Reputation</span>`;
        repBtn.style.backgroundColor = 'var(--accent-green-light)';
        repBtn.style.color = 'var(--accent-green)';
      }
    }
  }
  
  // Render vehicle specs
  document.getElementById('profile-rig-model').innerText = user.rig || "N/A";
  document.getElementById('profile-rig-solar').innerText = user.solar || "N/A";
  document.getElementById('profile-rig-power').innerText = user.power || "N/A";
  document.getElementById('profile-rig-water').innerText = user.water || "N/A";
  
  // Render Friends List
  const friendsCountSpan = document.getElementById('profile-friends-title');
  const friendsListContainer = document.getElementById('profile-friends-list');
  if (friendsListContainer) {
    friendsListContainer.innerHTML = '';
    const friends = user.friends || [];
    if (friendsCountSpan) {
      friendsCountSpan.innerText = `Friends (${friends.length})`;
    }
    
    if (friends.length === 0) {
      friendsListContainer.innerHTML = `<span style="font-size:11px; font-style:italic;">No friends added yet.</span>`;
    } else {
      friends.forEach(friendName => {
        const friendObj = State.users.find(u => u.name === friendName);
        if (friendObj) {
          const img = document.createElement('img');
          img.src = getAvatarSrc(friendObj.avatar);
          img.alt = friendObj.name;
          img.title = friendObj.name;
          img.className = 'mini-friend-avatar';
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => {
            viewUserProfile(friendObj.name);
          });
          friendsListContainer.appendChild(img);
        }
      });
    }
  }
  
  // Render Gallery
  const galleryGrid = document.getElementById('profile-gallery-grid');
  const uploadBtn = document.getElementById('profile-gallery-upload-btn');
  
  // Hide upload button if not owner
  if (uploadBtn) {
    uploadBtn.style.display = isOwner ? 'inline-flex' : 'none';
  }
  
  if (galleryGrid) {
    galleryGrid.innerHTML = '';
    const gallery = user.gallery || [];
    if (gallery.length === 0) {
      galleryGrid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:24px; color:var(--muted-text); font-size:12px; font-style:italic;">No photos in gallery.</div>`;
    } else {
      gallery.forEach(imgKey => {
        const img = document.createElement('img');
        img.className = 'profile-gallery-item';
        img.src = getImageSrc(imgKey);
        img.alt = "Rig photo";
        galleryGrid.appendChild(img);
      });
    }
  }
  
  // Render Visited Places List
  const visitedList = document.getElementById('profile-visited-spots-list');
  if (visitedList) {
    visitedList.innerHTML = '';
    const visitedIds = user.visitedSpots || [];
    const spots = State.spots.filter(s => visitedIds.includes(s.id));
    
    if (spots.length === 0) {
      visitedList.innerHTML = `<div style="font-size:12px; color:var(--muted-text); font-style:italic;">No spots visited yet.</div>`;
    } else {
      spots.forEach(spot => {
        const row = document.createElement('div');
        row.className = 'visited-spot-row';
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid var(--border-color); font-size:13px;";
        
        let typeName = 'Wild Camping';
        if (spot.category === 'driveway-host') typeName = 'Driveway Host';
        else if (spot.category === 'water-station') typeName = 'Water Station';
        else if (spot.category === 'service-mechanic') typeName = 'Van Mechanic';
        
        row.innerHTML = `
          <div>
            <strong style="color:var(--text-charcoal); cursor:pointer;" onclick="viewSpotFromProfile('${spot.id}')">${spot.title}</strong>
            <span style="font-size:11px; color:var(--muted-text); margin-left:8px;">(${typeName})</span>
          </div>
          <span style="font-size:11px; color:var(--muted-text);">${spot.lat.toFixed(2)}, ${spot.lng.toFixed(2)}</span>
        `;
        visitedList.appendChild(row);
      });
    }
  }
  
  // Initialize Profile Map
  initProfileMap(user);
  
  lucide.createIcons();
}

function getActiveUser() {
  const name = State.activeProfileName || State.currentUser.name;
  let user = State.users.find(u => u.name === name);
  if (!user && name === State.currentUser.name) {
    user = {
      name: State.currentUser.name,
      handle: State.currentUser.handle,
      avatar: State.currentUser.avatar,
      bio: State.currentUser.bio,
      rig: State.currentUser.rig,
      solar: State.currentUser.solar,
      power: State.currentUser.power,
      water: State.currentUser.water,
      gallery: [],
      visitedSpots: [],
      friends: []
    };
    State.users.push(user);
    saveStateToStorage();
  }
  return user;
}

function viewUserProfile(username) {
  if (!username || username === State.currentUser.name) {
    State.activeProfileName = null;
  } else {
    State.activeProfileName = username;
  }
  switchTab('profile');
}
window.viewUserProfile = viewUserProfile;

function initProfileMap(user) {
  const container = document.getElementById('profile-map');
  if (!container) return;
  
  if (!State.profileMap) {
    State.profileMap = L.map('profile-map', {
      zoomControl: true
    }).setView([37.0, -112.0], 5);
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
      maxZoom: 20
    }).addTo(State.profileMap);
  }
  
  if (State.profileMarkers) {
    State.profileMarkers.forEach(m => State.profileMap.removeLayer(m));
  }
  State.profileMarkers = [];
  
  const visitedSpots = State.spots.filter(s => user.visitedSpots && user.visitedSpots.includes(s.id));
  
  if (visitedSpots.length > 0) {
    const latLngs = [];
    visitedSpots.forEach(spot => {
      let markerColor = '#3B7A57';
      if (spot.category === 'driveway-host') markerColor = '#6E6A5F';
      else if (spot.category === 'water-station') markerColor = '#A2BEA9';
      else if (spot.category === 'service-mechanic') markerColor = '#2D2D2D';
      
      const customIcon = L.divIcon({
        html: `<div style="background-color:${markerColor}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
                <div style="background-color:white; width:4px; height:4px; border-radius:50%;"></div>
               </div>`,
        className: 'custom-map-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(State.profileMap);
      marker.bindPopup(`<strong>${spot.title}</strong><br>${spot.description.substring(0, 50)}...`);
      State.profileMarkers.push(marker);
      latLngs.push([spot.lat, spot.lng]);
    });
    
    if (latLngs.length > 0) {
      State.profileMap.fitBounds(latLngs, { padding: [30, 30] });
    }
  } else {
    State.profileMap.setView([37.0, -112.0], 5);
  }
}

function toggleFriend() {
  const user = getActiveUser();
  if (user.name === State.currentUser.name) return;
  
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  if (!currentUserObj) return;
  
  if (!currentUserObj.friends) currentUserObj.friends = [];
  if (!user.friends) user.friends = [];
  
  const isFriend = currentUserObj.friends.includes(user.name);
  
  if (isFriend) {
    currentUserObj.friends = currentUserObj.friends.filter(name => name !== user.name);
    user.friends = user.friends.filter(name => name !== currentUserObj.name);
    showToast(`Removed ${user.name} from friends.`, "info");
  } else {
    currentUserObj.friends.push(user.name);
    user.friends.push(currentUserObj.name);
    showToast(`Added ${user.name} as a friend!`, "success");
  }
  
  saveStateToStorage();
  renderUserProfile();
}

function toggleReputation() {
  const user = getActiveUser();
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  if (!currentUserObj || !user || user.name === currentUserObj.name) return;
  
  if (!currentUserObj.givenRepTo) currentUserObj.givenRepTo = [];
  
  if (currentUserObj.givenRepTo.includes(user.name)) {
    // Remove reputation
    currentUserObj.givenRepTo = currentUserObj.givenRepTo.filter(name => name !== user.name);
    user.reputation = Math.max(0, (user.reputation || 0) - 1);
    showToast(`Removed reputation point from ${user.name}`, 'info');
  } else {
    // Give reputation
    currentUserObj.givenRepTo.push(user.name);
    user.reputation = (user.reputation || 0) + 1;
    showToast(`Gave 1 reputation point to ${user.name}!`, 'success');
  }
  
  // Sync currentUser properties
  if (currentUserObj.name === State.currentUser.name) {
    State.currentUser.givenRepTo = currentUserObj.givenRepTo;
  }
  
  saveStateToStorage();
  renderUserProfile();
}

function markCurrentSpotAsVisited() {
  if (!State.currentViewedSpotId) return;
  
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  if (currentUserObj) {
    if (!currentUserObj.visitedSpots) currentUserObj.visitedSpots = [];
    if (!currentUserObj.visitedSpots.includes(State.currentViewedSpotId)) {
      currentUserObj.visitedSpots.push(State.currentViewedSpotId);
      saveStateToStorage();
      showToast("Spot marked as visited!", "success");
      
      const btn = document.getElementById('drawer-mark-visited-btn');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> <span>Visited</span>`;
        btn.classList.remove('btn-primary');
        lucide.createIcons();
      }
    } else {
      currentUserObj.visitedSpots = currentUserObj.visitedSpots.filter(id => id !== State.currentViewedSpotId);
      saveStateToStorage();
      showToast("Spot removed from visited list.", "info");
      
      const btn = document.getElementById('drawer-mark-visited-btn');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check-square" style="width: 14px; height: 14px;"></i> <span>Mark as Visited</span>`;
        btn.classList.add('btn-primary');
        lucide.createIcons();
      }
    }
  }
}

function handleProfilePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const statusSpan = document.getElementById('profile-photo-upload-status');
    if (statusSpan) statusSpan.innerText = "Photo uploaded and ready to save!";
    
    State.currentUser.avatar = dataUrl;
    showToast("Profile photo loaded! Click Save to apply.", "success");
  };
  reader.readAsDataURL(file);
}

function handleRigPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    
    const user = getActiveUser();
    if (!user.gallery) user.gallery = [];
    user.gallery.push(dataUrl);
    
    saveStateToStorage();
    renderUserProfile();
    showToast("Rig photo added to gallery!", "success");
  };
  reader.readAsDataURL(file);
}

function handleListingPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const preview = document.getElementById('list-photo-preview');
    const container = document.getElementById('list-photo-preview-container');
    const select = document.getElementById('list-img-select');
    
    if (preview && container && select) {
      preview.src = dataUrl;
      container.style.display = 'block';
      select.value = 'custom';
      showToast("Listing photo loaded successfully!", "success");
    }
  };
  reader.readAsDataURL(file);
}

window.viewSpotFromProfile = function(spotId) {
  const spot = State.spots.find(s => s.id === spotId);
  if (spot) {
    switchTab('dashboard');
    if (State.leafletMap) {
      State.leafletMap.setView([spot.lat, spot.lng], 12);
      openInfoDrawerForSpot(spot);
    }
  }
};

/* ==========================================================================
   2D LEAFLET MAP INTEGRATION
   ========================================================================== */
function initLeafletMap() {
  const container = document.getElementById('leaflet-map');
  if (!container) return;
  
  // Initialize map centered on SW USA (Moab area)
  State.leafletMap = L.map('leaflet-map', {
    zoomControl: true
  }).setView([37.0, -112.0], 5);
  
  // Load Esri World Topo Map tile layer with light terrain colors
  const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
  State.leafletTileLayer = L.tileLayer(url, {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
    maxZoom: 20
  }).addTo(State.leafletMap);
  
  renderLeafletMarkers();
}

function renderLeafletMarkers() {
  if (!State.leafletMap) return;
  
  // Clear existing markers
  State.mapMarkers.forEach(m => State.leafletMap.removeLayer(m));
  State.mapMarkers = [];
  
  const pins = [...State.spots, ...State.meetups];
  
  pins.forEach(pin => {
    // Check if pins match global search query
    const query = State.searchQuery;
    const matchesQuery = pin.title.toLowerCase().includes(query) || 
                         (pin.description && pin.description.toLowerCase().includes(query));
    if (!matchesQuery) return;
    
    // Choose marker color
    let markerColor = '#3B7A57'; // Camp spots
    let typeName = 'Wild Camping';
    
    if (pin.category === 'driveway-host') {
      markerColor = '#6E6A5F';
      typeName = 'Driveway Host';
    } else if (pin.category === 'water-station') {
      markerColor = '#A2BEA9';
      typeName = 'Water Station';
    } else if (pin.category === 'service-mechanic') {
      markerColor = '#2D2D2D';
      typeName = 'Van Mechanic';
    } else if (!pin.category) {
      markerColor = '#D55E00'; // Meetup
      typeName = 'Nomad Meetup';
    }
    
    // Custom DIV icon for nice vector aesthetics matching Inter typography
    const customIcon = L.divIcon({
      html: `<div style="background-color:${markerColor}; width:20px; height:20px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
              <div style="background-color:white; width:6px; height:6px; border-radius:50%;"></div>
             </div>`,
      className: 'custom-map-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(State.leafletMap);
    
    // Custom popup
    const popupHtml = `
      <div class="custom-map-popup-badge" style="background:${markerColor}1A; color:${markerColor};">${typeName}</div>
      <div class="custom-map-popup-header">${pin.title}</div>
      <div class="custom-map-popup-desc">${pin.description ? pin.description.substring(0, 70) : 'Gathering at campsite details...'}...</div>
      <div class="custom-map-popup-footer">
        <span class="custom-map-popup-user">
          <i data-lucide="user" style="width:10px; height:10px;"></i>
          <span>${pin.author ? pin.author.name : pin.host.name}</span>
        </span>
        <span class="custom-map-popup-btn" onclick="triggerInfoDrawerFromMap('${pin.id}')">Details &rarr;</span>
      </div>
    `;
    
    if (window.innerWidth > 768) {
      marker.bindPopup(popupHtml, {
        closeButton: false,
        minWidth: 200
      });
    }
    
    // Drawer opener on click
    marker.on('click', () => {
      openInfoDrawerForSpot(pin);
    });
    
    State.mapMarkers.push(marker);
  });
}

// Global scope binder to trigger info drawer inside popup string template
window.triggerInfoDrawerFromMap = function(pinId) {
  const allPoints = [...State.spots, ...State.meetups];
  const pin = allPoints.find(p => p.id === pinId);
  if (pin) openInfoDrawerForSpot(pin);
};

function openInfoDrawerForSpot(pin) {
  const drawer = document.getElementById('map-info-drawer');
  
  let typeName = 'Wild Camping';
  let categoryColor = 'var(--accent-green)';
  if (pin.category === 'driveway-host') { typeName = 'Driveway Host'; categoryColor = 'var(--muted-text)'; }
  if (pin.category === 'water-station') { typeName = 'Water Station'; categoryColor = '#5C8D70'; }
  if (pin.category === 'service-mechanic') { typeName = 'Van Mechanic'; categoryColor = 'var(--text-charcoal)'; }
  if (!pin.category) { typeName = 'Nomad Meetup'; categoryColor = '#D55E00'; }
  
  document.getElementById('drawer-category').innerText = typeName;
  document.getElementById('drawer-category').style.color = categoryColor;
  document.getElementById('drawer-title').innerText = pin.title;
  
  const author = pin.author || pin.host;
  document.getElementById('drawer-author-img').src = getAvatarSrc(author.avatar);
  document.getElementById('drawer-author-name').innerText = author.name;
  document.getElementById('drawer-author-img').onclick = () => {
    document.getElementById('map-info-drawer').classList.remove('open');
    viewUserProfile(author.name);
  };
  document.getElementById('drawer-author-img').style.cursor = 'pointer';
  document.getElementById('drawer-author-name').onclick = () => {
    document.getElementById('map-info-drawer').classList.remove('open');
    viewUserProfile(author.name);
  };
  document.getElementById('drawer-author-name').style.cursor = 'pointer';
  
  document.getElementById('drawer-description').innerText = pin.description;
  document.getElementById('drawer-coords').innerText = `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`;
  
  if (!pin.category) {
    document.getElementById('drawer-vouch-count').innerText = `${pin.attendeesCount} Nomads Going`;
  } else {
    document.getElementById('drawer-vouch-count').innerText = `${pin.vouches} Vanlifers Vouched`;
  }
  
  State.currentViewedSpotId = pin.id;
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  const isVisited = currentUserObj && currentUserObj.visitedSpots && currentUserObj.visitedSpots.includes(pin.id);
  const btn = document.getElementById('drawer-mark-visited-btn');
  if (btn) {
    if (isVisited) {
      btn.innerHTML = `<i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> <span>Visited</span>`;
      btn.classList.remove('btn-primary');
    } else {
      btn.innerHTML = `<i data-lucide="check-square" style="width: 14px; height: 14px;"></i> <span>Mark as Visited</span>`;
      btn.classList.add('btn-primary');
    }
  }
  
  // Pan map to clicked pin (with vertical offset on mobile to center above bottom sheet)
  if (State.leafletMap) {
    const isMobile = window.innerWidth <= 768;
    const offsetLat = isMobile ? pin.lat - 0.015 : pin.lat;
    State.leafletMap.setView([offsetLat, pin.lng], 13);
  }
  
  // slide in
  drawer.classList.add('open');
  lucide.createIcons();
}

/* ==========================================================================
   MODALS OPEN/CLOSE CONTROL SYSTEM
   ========================================================================== */
function setupModalHandlers() {
  // Closes all modals on overlay click or cancel button
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
    
    const cancelBtn = overlay.querySelector('.btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => closeModal(overlay.id));
    }
    
    const closeBtn = overlay.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(overlay.id));
    }
  });
  
  // Custom action bindings for each modal save button
  document.getElementById('save-profile-btn').addEventListener('click', saveUserProfileEdit);
  document.getElementById('save-spot-btn').addEventListener('click', saveNewSpot);
  document.getElementById('save-post-btn').addEventListener('click', saveNewPost);
  document.getElementById('save-listing-btn').addEventListener('click', saveNewListing);
  document.getElementById('save-tribe-btn').addEventListener('click', saveNewTribe);
  document.getElementById('save-meetup-btn').addEventListener('click', saveNewMeetup);
  document.getElementById('save-thread-btn').addEventListener('click', saveNewForumThread);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

/* ==========================================================================
   FORM ACTION HANDLERS
   ========================================================================== */

// 1. Edit profile
function openProfileEditModal() {
  document.getElementById('edit-profile-name').value = State.currentUser.name;
  document.getElementById('edit-profile-bio').value = State.currentUser.bio;
  document.getElementById('edit-profile-rig').value = State.currentUser.rig;
  document.getElementById('edit-profile-solar').value = State.currentUser.solar;
  document.getElementById('edit-profile-power').value = State.currentUser.power;
  document.getElementById('edit-profile-water').value = State.currentUser.water;
  openModal('modal-edit-profile');
}

function saveUserProfileEdit() {
  const oldName = State.currentUser.name;
  const newName = document.getElementById('edit-profile-name').value.trim() || oldName;
  
  let user = State.users.find(u => u.name === oldName);
  if (!user) {
    user = { name: oldName };
    State.users.push(user);
  }
  
  user.name = newName;
  user.bio = document.getElementById('edit-profile-bio').value.trim() || user.bio;
  user.rig = document.getElementById('edit-profile-rig').value.trim() || user.rig;
  user.solar = document.getElementById('edit-profile-solar').value.trim() || user.solar;
  user.power = document.getElementById('edit-profile-power').value.trim() || user.power;
  user.water = document.getElementById('edit-profile-water').value.trim() || user.water;
  user.avatar = State.currentUser.avatar;
  
  State.currentUser.name = newName;
  State.currentUser.bio = user.bio;
  State.currentUser.rig = user.rig;
  State.currentUser.solar = user.solar;
  State.currentUser.power = user.power;
  State.currentUser.water = user.water;
  
  if (oldName !== newName) {
    State.posts.forEach(p => {
      if (p.author.name === oldName) p.author.name = newName;
      if (p.comments) {
        p.comments.forEach(c => {
          if (c.user === oldName) c.user = newName;
        });
      }
    });
    State.spots.forEach(s => {
      if (s.author.name === oldName) s.author.name = newName;
    });
    State.meetups.forEach(m => {
      if (m.host.name === oldName) m.host.name = newName;
    });
    State.marketplace.forEach(m => {
      if (m.seller.name === oldName) m.seller.name = newName;
    });
    State.forum.forEach(t => {
      if (t.author.name === oldName) t.author.name = newName;
      if (t.replies) {
        t.replies.forEach(r => {
          if (r.author.name === oldName) r.author.name = newName;
        });
      }
    });
    State.users.forEach(u => {
      if (u.friends) {
        u.friends = u.friends.map(f => f === oldName ? newName : f);
      }
    });
  }
  
  saveStateToStorage();
  updateSidebarProfileWidget();
  renderUserProfile();
  closeModal('modal-edit-profile');
  
  const statusSpan = document.getElementById('profile-photo-upload-status');
  if (statusSpan) statusSpan.innerText = "";
  
  showToast("Profile details updated!", "success");
}

// 2. Add Spot
function saveNewSpot() {
  const title = document.getElementById('spot-title').value.trim();
  const category = document.getElementById('spot-category').value;
  const lat = parseFloat(document.getElementById('spot-lat').value);
  const lng = parseFloat(document.getElementById('spot-lng').value);
  const description = document.getElementById('spot-desc').value.trim();
  
  if (!title || isNaN(lat) || isNaN(lng) || !description) {
    showToast("Please fill all coordinates and name parameters.", "error");
    return;
  }
  
  const newSpot = {
    id: `spot-${Date.now()}`,
    title,
    category,
    lat,
    lng,
    description,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    vouches: 1
  };
  
  State.spots.push(newSpot);
  saveStateToStorage();
  
  // Reload maps
  renderLeafletMarkers();
  
  // Clean inputs
  document.getElementById('spot-title').value = '';
  document.getElementById('spot-lat').value = '';
  document.getElementById('spot-lng').value = '';
  document.getElementById('spot-desc').value = '';
  
  closeModal('modal-add-spot');
  showToast("Campsite vouched successfully!", "success");
}

// 3. Add Post
function saveNewPost() {
  const content = document.getElementById('post-text').value.trim();
  const imgVal = document.getElementById('post-img-select').value;
  
  if (!content) {
    showToast("Post content cannot be empty.", "error");
    return;
  }
  
  const newPost = {
    id: `post-${Date.now()}`,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    time: "Just now",
    content,
    image: imgVal === 'none' ? null : `image_${imgVal}`,
    likes: 0,
    likedByUser: false,
    comments: []
  };
  
  State.posts.unshift(newPost);
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('post-text').value = '';
  document.getElementById('post-img-select').value = 'none';
  
  closeModal('modal-add-post');
  renderDashboardFeed();
  showToast("Update shared with community feed!", "success");
}

// 4. Add Listing
function saveNewListing() {
  const title = document.getElementById('list-title').value.trim();
  const priceVal = document.getElementById('list-price').value.trim();
  const category = document.getElementById('list-category').value;
  const price = priceVal === '' ? 0 : parseInt(priceVal);
  const location = document.getElementById('list-location').value.trim();
  const zip = document.getElementById('list-zip').value.trim();
  const description = document.getElementById('list-desc').value.trim();
  const imgVal = document.getElementById('list-img-select').value;
  
  if (!title || isNaN(price) || !location || !zip || !description) {
    showToast("Please fill out all listing fields, including Zip Code.", "error");
    return;
  }
  
  let finalImage = `item_${imgVal}`;
  if (imgVal === 'custom') {
    const preview = document.getElementById('list-photo-preview');
    if (preview && preview.src && preview.src.startsWith('data:')) {
      finalImage = preview.src;
    } else {
      showToast("Please upload a custom photo first, or choose a mockup template.", "error");
      return;
    }
  }
  
  const coords = resolveZipCoordinates(zip) || { lat: 39.0, lng: -105.0 };
  
  const condition = category === 'services-offer' ? 'Service Offered' : 
                    (category === 'services-want' ? 'Service Wanted' : 'Good');
  
  const newListing = {
    id: `market-${Date.now()}`,
    title,
    price,
    category,
    location,
    zip,
    lat: coords.lat,
    lng: coords.lng,
    condition,
    description,
    seller: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    image: finalImage
  };
  
  // Save listing using Backend Client Simulator
  Backend.createListing(newListing).then(() => {
    // Clean inputs
    document.getElementById('list-title').value = '';
    document.getElementById('list-price').value = '';
    document.getElementById('list-location').value = '';
    document.getElementById('list-zip').value = '';
    document.getElementById('list-desc').value = '';
    
    const preview = document.getElementById('list-photo-preview');
    if (preview) preview.src = '';
    const container = document.getElementById('list-photo-preview-container');
    if (container) container.style.display = 'none';
    const fileInput = document.getElementById('list-photo-upload');
    if (fileInput) fileInput.value = '';
    const select = document.getElementById('list-img-select');
    if (select) select.value = 'solar';
    
    closeModal('modal-add-listing');
    renderMarketplaceListings();
    showToast("Marketplace listing published!", "success");
  });
}



// 6. Form Tribe
function saveNewTribe() {
  const title = document.getElementById('tribe-name-input').value.trim();
  const iconLetter = document.getElementById('tribe-icon-input').value.trim().toUpperCase();
  const banner = document.getElementById('tribe-banner-select').value;
  const description = document.getElementById('tribe-desc-input').value.trim();
  
  if (!title || !iconLetter || !description) {
    showToast("Please fill all tribe fields.", "error");
    return;
  }
  
  const newTribe = {
    id: `tribe-${Date.now()}`,
    title,
    membersCount: 1,
    banner,
    iconLetter,
    description,
    joined: true
  };
  
  State.tribes.push(newTribe);
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('tribe-name-input').value = '';
  document.getElementById('tribe-icon-input').value = '';
  document.getElementById('tribe-desc-input').value = '';
  
  closeModal('modal-add-tribe');
  renderTribesList();
  showToast(`"${title}" Tribe formed! You are the first member.`, "success");
}

// 7. Host Meetup
function saveNewMeetup() {
  const title = document.getElementById('meetup-title-input').value.trim();
  const date = document.getElementById('meetup-date-input').value;
  const time = document.getElementById('meetup-time-input').value.trim();
  const location = document.getElementById('meetup-loc-name').value.trim();
  const lat = parseFloat(document.getElementById('meetup-lat').value);
  const lng = parseFloat(document.getElementById('meetup-lng').value);
  const description = document.getElementById('meetup-desc-input').value.trim();
  
  if (!title || !date || !time || !location || isNaN(lat) || isNaN(lng) || !description) {
    showToast("Please fill all meetup coordinates, schedule and description parameters.", "error");
    return;
  }
  
  const newMeetup = {
    id: `meetup-${Date.now()}`,
    title,
    lat,
    lng,
    date,
    time,
    location,
    description,
    host: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    attendees: ['avatar_bob'],
    attendeesCount: 1
  };
  
  State.meetups.push(newMeetup);
  saveStateToStorage();
  
  // Reload maps
  renderLeafletMarkers();
  
  // Clean inputs
  document.getElementById('meetup-title-input').value = '';
  document.getElementById('meetup-date-input').value = '';
  document.getElementById('meetup-time-input').value = '';
  document.getElementById('meetup-loc-name').value = '';
  document.getElementById('meetup-lat').value = '';
  document.getElementById('meetup-lng').value = '';
  document.getElementById('meetup-desc-input').value = '';
  
  closeModal('modal-add-meetup');
  renderMeetupsList();
  showToast("Meetup hosted and pinned on global map!", "success");
}

// 8. Create Thread
function saveNewForumThread() {
  const title = document.getElementById('thread-title-input').value.trim();
  const category = document.getElementById('thread-cat-input').value.trim() || "General";
  const body = document.getElementById('thread-body-input').value.trim();
  
  if (!title || !body) {
    showToast("Please fill out thread title and body content.", "error");
    return;
  }
  
  const newThread = {
    id: `thread-${Date.now()}`,
    title,
    category,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    repliesCount: 0,
    viewsCount: 1,
    date: "Just now",
    body,
    replies: []
  };
  
  State.forum.unshift(newThread);
  State.activeForumCategory = 'all'; // reset to all to see the new thread
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('thread-title-input').value = '';
  document.getElementById('thread-cat-input').value = '';
  document.getElementById('thread-body-input').value = '';
  
  closeModal('modal-add-thread');
  renderForumView();
  showToast("Thread published to discussion board!", "success");
}

// Feed shelving helper
function toggleFeedShelf(shelf) {
  const layout = document.querySelector('.dashboard-layout');
  if (layout) {
    layout.classList.toggle('feed-shelved', shelf);
    
    // Invalidate map size so it redraws to fill the new container width
    if (State.leafletMap) {
      setTimeout(() => {
        State.leafletMap.invalidateSize();
      }, 150);
    }
  }
}

// Save post from Feed tab
function saveNewFeedTabPost() {
  const content = document.getElementById('feed-tab-post-text').value.trim();
  const imgVal = document.getElementById('feed-tab-post-img-select').value;
  
  if (!content) {
    showToast("Post content cannot be empty.", "error");
    return;
  }
  
  const newPost = {
    id: `post-${Date.now()}`,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    time: "Just now",
    content,
    image: imgVal === 'none' ? null : `image_${imgVal}`,
    likes: 0,
    likedByUser: false,
    comments: []
  };
  
  State.posts.unshift(newPost);
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('feed-tab-post-text').value = '';
  document.getElementById('feed-tab-post-img-select').value = 'none';
  
  renderDashboardFeed();
  renderFeedTabPosts();
  showToast("Update shared with community feed!", "success");
}

/* ==========================================================================
   DIRECT MESSAGING & CHAT SYSTEM HELPERS
   ========================================================================== */

function renderContactsSidebar() {
  const sidebarContainer = document.getElementById('contacts-list-scroll');
  const tabContainer = document.getElementById('messages-tab-contacts-list');
  
  const contacts = State.users.filter(u => u.name !== State.currentUser.name);
  
  const populate = (container) => {
    if (!container) return;
    container.innerHTML = '';
    
    contacts.forEach(contact => {
      const row = document.createElement('div');
      row.className = 'contact-item-row';
      row.onclick = () => openDirectChat(contact.name);
      
      const isOnline = contact.name === "Clara Outdoors" || contact.name === "Forest Nomad" || contact.name === "Baja Surfer";
      
      const messages = State.chats[contact.name] || [];
      let lastMsgText = "No messages yet";
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        lastMsgText = (lastMsg.sender === State.currentUser.name ? "You: " : "") + lastMsg.text;
      }
      
      row.innerHTML = `
        <div class="contact-item-avatar-wrap">
          <img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="contact-item-avatar">
          <div class="contact-status-dot ${isOnline ? 'online' : ''}"></div>
        </div>
        <div class="contact-item-details">
          <div class="contact-item-name">${contact.name}</div>
          <div class="contact-item-preview">${lastMsgText}</div>
        </div>
      `;
      container.appendChild(row);
    });
  };
  
  populate(sidebarContainer);
  populate(tabContainer);
  
  // Compute unread count based on active chats that are closed or seed
  const unreadCount = 2; // Clara and Forest have seeded messages
  const openActive = State.activeChats.length > 0;
  
  const badges = [
    document.getElementById('contacts-unread-badge'),
    document.getElementById('nav-messages-badge'),
    document.getElementById('mobile-feed-unread-badge')
  ];
  
  badges.forEach(badge => {
    if (badge) {
      if (unreadCount > 0 && !openActive) {
        badge.innerText = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  });
}

function openDirectChat(username) {
  const sidebar = document.getElementById('contacts-sidebar');
  if (sidebar) sidebar.classList.remove('open');
  
  if (!State.chats) State.chats = {};
  if (!State.chats[username]) {
    State.chats[username] = [];
  }
  
  if (!State.activeChats.includes(username)) {
    const isMobile = window.innerWidth <= 768;
    const limit = isMobile ? 1 : 3;
    
    if (State.activeChats.length >= limit) {
      State.activeChats.shift();
    }
    State.activeChats.push(username);
    if (isMobile) {
      history.pushState({ chat: true }, '');
    }
  }
  
  State.minimizedChats = State.minimizedChats.filter(name => name !== username);
  
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  setTimeout(() => {
    const chatArea = document.querySelector(`.chat-window[data-username="${username}"] .chat-messages-area`);
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    
    const inputEl = document.querySelector(`.chat-window[data-username="${username}"] .chat-input-field`);
    if (inputEl) inputEl.focus();
  }, 100);
}

function toggleChatMinimize(username, event) {
  if (event) event.stopPropagation();
  
  if (State.minimizedChats.includes(username)) {
    State.minimizedChats = State.minimizedChats.filter(name => name !== username);
  } else {
    State.minimizedChats.push(username);
  }
  
  saveStateToStorage();
  renderActiveChats();
}

function closeDirectChat(username, event) {
  if (event) event.stopPropagation();
  
  State.activeChats = State.activeChats.filter(name => name !== username);
  State.minimizedChats = State.minimizedChats.filter(name => name !== username);
  
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
}

function renderActiveChats() {
  const container = document.getElementById('chat-windows-container');
  if (!container) return;

  const isMobile = window.innerWidth <= 768;
  const chatBackdrop = document.getElementById('chat-backdrop');
  if (chatBackdrop) {
    const hasActiveOpenChat = isMobile && State.activeChats.length > 0 && !State.minimizedChats.includes(State.activeChats[State.activeChats.length - 1]);
    if (hasActiveOpenChat) {
      chatBackdrop.classList.add('active');
      chatBackdrop.style.display = 'block';
    } else {
      chatBackdrop.classList.remove('active');
      setTimeout(() => {
        if (!chatBackdrop.classList.contains('active')) {
          chatBackdrop.style.display = 'none';
        }
      }, 300);
    }
  }
  
  // Set body class for hiding bottom navigation drawer on mobile when chat is active
  const hasOpenChat = isMobile && State.activeChats.length > 0 && !State.minimizedChats.includes(State.activeChats[State.activeChats.length - 1]);
  if (hasOpenChat) {
    document.body.classList.add('mobile-chat-open');
  } else {
    document.body.classList.remove('mobile-chat-open');
  }
  
  container.innerHTML = '';
  if (State.activeChats.length === 0) {
    container.style.height = '';
  }
  
  State.activeChats.forEach(username => {
    const contact = State.users.find(u => u.name === username);
    if (!contact) return;
    
    const isMinimized = State.minimizedChats.includes(username);
    
    const chatBox = document.createElement('div');
    chatBox.className = `chat-window ${isMinimized ? 'minimized' : ''}`;
    chatBox.setAttribute('data-username', username);
    
    const isOnline = username === "Clara Outdoors" || username === "Forest Nomad" || username === "Baja Surfer";
    const statusText = isOnline ? "Active now" : "Active 2h ago";
    
    const messages = State.chats[username] || [];
    let messagesHtml = '';
    
    if (messages.length === 0) {
      messagesHtml = `<div style="text-align:center; color:var(--muted-text); font-size:11px; margin-top:20px; font-style:italic;">No messages yet. Say hi!</div>`;
    } else {
      let lastTime = '';
      messages.forEach(msg => {
        if (msg.time && msg.time !== lastTime && (msg.time.includes('PM') || msg.time.includes('AM') || msg.time === 'Yesterday')) {
          messagesHtml += `<div class="chat-date-divider">${msg.time}</div>`;
          lastTime = msg.time;
        }
        
        const isMe = msg.sender === State.currentUser.name;
        
        messagesHtml += `
          <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
            ${!isMe ? `<img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="chat-msg-avatar" onclick="viewUserProfile('${contact.name}')" style="cursor:pointer;">` : ''}
            <div class="chat-msg-bubble-wrap">
              <div class="chat-msg-bubble" style="cursor:pointer;" onclick="toggleHeartReaction('${username}', '${msg.id}')" title="Click to react with Heart">
                ${msg.text}
              </div>
              ${msg.reaction ? `<div class="chat-bubble-reaction" onclick="toggleHeartReaction('${username}', '${msg.id}')">❤️</div>` : ''}
            </div>
          </div>
        `;
      });
    }
    
    const backBtnHtml = isMobile ? `
      <button class="chat-header-back-btn" onclick="closeDirectChat('${username}', event)" title="Back">
        <i data-lucide="arrow-left"></i>
      </button>
    ` : '';
    
    chatBox.innerHTML = `
      <div class="chat-header" ${!isMobile ? `onclick="toggleChatMinimize('${username}')"` : ''}>
        <div class="chat-header-left">
          ${backBtnHtml}
          <div class="chat-header-info">
            <img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="chat-header-avatar" onclick="event.stopPropagation(); viewUserProfile('${contact.name}')" style="cursor:pointer;">
            <div class="chat-header-meta">
              <span class="chat-header-name">${contact.name}</span>
              <span class="chat-header-status">${statusText}</span>
            </div>
          </div>
        </div>
        <div class="chat-header-controls">
          ${!isMobile ? `<button class="chat-header-control-btn" title="Minimize" onclick="toggleChatMinimize('${username}', event)"><i data-lucide="minus"></i></button>` : ''}
          <button class="chat-header-control-btn chat-close-btn" title="Close" onclick="closeDirectChat('${username}', event)"><i data-lucide="x"></i></button>
        </div>
      </div>
      
      <div class="chat-messages-area">
        ${messagesHtml}
      </div>
      
      <div class="chat-footer">
        <div class="chat-footer-top">
          <button class="chat-footer-action-btn" title="Photos" onclick="showToast('Media attachment not supported in chat.', 'info')"><i data-lucide="image"></i></button>
          <button class="chat-footer-action-btn" title="Stickers" onclick="showToast('Stickers not loaded.', 'info')"><i data-lucide="smile"></i></button>
          <button class="chat-footer-action-btn" title="GIF" onclick="showToast('GIF search not loaded.', 'info')"><i data-lucide="image-play"></i></button>
          
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input-field" placeholder="Aa" onkeypress="handleChatKeyPress(event, '${username}')" onfocus="setTimeout(adjustChatContainerForVisualViewport, 300)" onblur="setTimeout(adjustChatContainerForVisualViewport, 100)">
            <button class="chat-input-emoji-btn" title="Emoji" onclick="insertSampleEmoji('${username}')">
              <i data-lucide="smile-plus"></i>
            </button>
          </div>
          
          <button class="chat-footer-action-btn chat-send-btn" title="Like" onclick="sendPlantSticker('${username}')"><i data-lucide="thumbs-up"></i></button>
        </div>
      </div>
    `;
    container.appendChild(chatBox);
    
    if (!isMinimized) {
      const messagesArea = chatBox.querySelector('.chat-messages-area');
      if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  });
  
  lucide.createIcons();
  adjustChatContainerForVisualViewport();
}

function adjustChatContainerForVisualViewport() {
  const container = document.getElementById('chat-windows-container');
  if (!container) return;
  
  if (window.innerWidth <= 768) {
    if (State.activeChats.length === 0) {
      container.style.height = '';
      container.style.top = '';
      return;
    }
    if (window.visualViewport) {
      container.style.top = `${window.visualViewport.offsetTop}px`;
      container.style.height = `${window.visualViewport.height}px`;
    } else {
      container.style.top = '0';
      container.style.height = '100vh';
    }
    
    // Scroll active chat messages to bottom
    const activeMsgArea = container.querySelector('.chat-messages-area');
    if (activeMsgArea) {
      activeMsgArea.scrollTop = activeMsgArea.scrollHeight;
    }
  } else {
    container.style.height = '';
    container.style.top = '';
  }
}

function handleChatKeyPress(e, username) {
  if (e.key === 'Enter') {
    const input = e.target;
    const text = input.value.trim();
    if (!text) return;
    
    sendChatMessage(username, text);
    input.value = '';
  }
}

function sendChatMessage(username, text) {
  if (!State.chats[username]) State.chats[username] = [];
  
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const newMsg = {
    id: `msg-${Date.now()}`,
    sender: State.currentUser.name,
    text: text,
    time: timeString,
    reaction: false
  };
  
  State.chats[username].push(newMsg);
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  setTimeout(() => {
    triggerMockReply(username, text);
  }, 1500);
}

function sendPlantSticker(username) {
  sendChatMessage(username, "🌵 (Sent a plant sticker!)");
}

function insertSampleEmoji(username) {
  const input = document.querySelector(`.chat-window[data-username="${username}"] .chat-input-field`);
  if (input) {
    input.value += " 👍";
    input.focus();
  }
}

function toggleHeartReaction(username, msgId) {
  const messages = State.chats[username] || [];
  const msg = messages.find(m => m.id === msgId);
  if (msg) {
    msg.reaction = !msg.reaction;
    saveStateToStorage();
    renderActiveChats();
  }
}

function triggerMockReply(username, userText) {
  const replies = {
    "Clara Outdoors": [
      "That sounds great! I'm currently driving through Utah, cell signal is spotty but I'll check in when I camp.",
      "Awesome Bob! Let's save a camp spot together at Quartzsite.",
      "Haha definitely! Off-grid is the only way 🌲",
      "I'm actually testing out some solar upgrades today, will send pictures soon!"
    ],
    "Forest Nomad": [
      "Thanks Bob! Cedars are perfect for van ceilings.",
      "Hey! Glad you liked it. Let me know if you need any cabinetry dimensions.",
      "Totally agree! Standard plywood just doesn't compare.",
      "I'm working on a sliding bed platform build this week, woodwork takes patience!"
    ],
    "Solar Explorer": [
      "Hey Bob! Yeah, Victron parts are pricey but the reliability is worth it.",
      "I always suggest fuses directly off the busbars. Safety first!",
      "Are you looking at lithium or AGM? AGM is cheaper but lithium lasts 10x longer.",
      "Just got back from mapping some dry camping spots, will vouch them on the map soon."
    ],
    "Baja Surfer": [
      "Baja camp has been perfect, swell is looking clean tomorrow!",
      "Calexico is definitely the easiest crossing, very quiet.",
      "Fish tacos here are like $1 each, living the dream!",
      "Catch you around camp Bob!"
    ]
  };
  
  const list = replies[username] || ["Hey Bob! Good talking to you. Let's catch up at the next camp spot!"];
  const text = list[Math.floor(Math.random() * list.length)];
  
  simulateAutoReply(username, text, 1000);
}

function simulateAutoReply(username, text, delay) {
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const replyMsg = {
    id: `msg-${Date.now()}`,
    sender: username,
    text: text,
    time: timeString,
    reaction: false
  };
  
  if (!State.chats[username]) State.chats[username] = [];
  State.chats[username].push(replyMsg);
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  showToast(`New message from ${username}`);
}

window.openDirectChat = openDirectChat;
window.toggleChatMinimize = toggleChatMinimize;
window.closeDirectChat = closeDirectChat;
window.handleChatKeyPress = handleChatKeyPress;
window.toggleHeartReaction = toggleHeartReaction;
window.insertSampleEmoji = insertSampleEmoji;
window.sendPlantSticker = sendPlantSticker;
window.contactSeller = contactSeller;
window.adjustChatContainerForVisualViewport = adjustChatContainerForVisualViewport;

function openMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) {
    drawer.style.display = 'flex';
    setTimeout(() => {
      drawer.classList.add('open');
    }, 50);
  }
  // Sync profile details inside drawer
  const drawerAvatar = document.getElementById('mobile-drawer-user-avatar');
  const drawerName = document.getElementById('mobile-drawer-user-name');
  const drawerHandle = document.getElementById('mobile-drawer-user-handle');
  if (drawerAvatar) drawerAvatar.src = getAvatarSrc(State.currentUser.avatar);
  if (drawerName) drawerName.innerText = State.currentUser.name;
  if (drawerHandle) drawerHandle.innerText = State.currentUser.handle;
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) {
    drawer.classList.remove('open');
    setTimeout(() => {
      if (!drawer.classList.contains('open')) {
        drawer.style.display = 'none';
      }
    }, 300);
  }
}

function openMobileActionMenu() {
  const menu = document.getElementById('mobile-action-menu');
  if (menu) {
    menu.style.display = 'flex';
    setTimeout(() => {
      menu.classList.add('open');
    }, 50);
  }
}

function closeMobileActionMenu() {
  const menu = document.getElementById('mobile-action-menu');
  if (menu) {
    menu.classList.remove('open');
    setTimeout(() => {
      if (!menu.classList.contains('open')) {
        menu.style.display = 'none';
      }
    }, 300);
  }
}

window.openMobileDrawer = openMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;
window.openMobileActionMenu = openMobileActionMenu;
window.closeMobileActionMenu = closeMobileActionMenu;
window.toggleMobileFeedTab = toggleMobileFeedTab;
