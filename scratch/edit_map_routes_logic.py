filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\components\map-pins.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Target for toggle button binding inside initMapLayers()
toggle_target = """  const toggleBtn = document.getElementById('map-layers-toggle-btn');
  const panel = document.getElementById('map-layers-panel');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      const isVisible = panel.style.display === 'flex';
      panel.style.display = isVisible ? 'none' : 'flex';
    });
  }"""

toggle_replacement = """  const toggleBtn = document.getElementById('map-layers-toggle-btn');
  const panel = document.getElementById('map-layers-panel');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      const isVisible = panel.style.display === 'flex';
      panel.style.display = isVisible ? 'none' : 'flex';
      // Hide routes panel if open
      const rPanel = document.getElementById('map-routes-panel');
      if (rPanel) rPanel.style.display = 'none';
    });
  }

  const routesToggleBtn = document.getElementById('map-routes-toggle-btn');
  const routesPanel = document.getElementById('map-routes-panel');
  if (routesToggleBtn && routesPanel) {
    routesToggleBtn.addEventListener('click', () => {
      const isVisible = routesPanel.style.display === 'flex';
      routesPanel.style.display = isVisible ? 'none' : 'flex';
      // Hide layers panel if open
      const lPanel = document.getElementById('map-layers-panel');
      if (lPanel) lPanel.style.display = 'none';
    });
  }"""

# 2. Append route functions to the end of the file
route_functions = """
/* ==========================================================================
   FEATURED ROUTES DRAWING & SHARING LOGIC
   ========================================================================== */
let activeRoutePolyline = null;

function drawRouteOnMap(routeId) {
  if (!State.leafletMap) return;
  
  // Clear existing route polyline
  if (activeRoutePolyline) {
    State.leafletMap.removeLayer(activeRoutePolyline);
  }
  
  const routesData = {
    "moab-loop": {
      title: "Moab Overland Loop",
      color: "#f59e0b",
      waypoints: [
        [38.5733, -109.5498], // Moab
        [38.6500, -109.6300], // Gemini Bridges
        [38.7800, -109.6800], // Dead Horse Point
        [38.5080, -109.8000], // Shafer Trail
        [38.4500, -109.6000], // Hurrah Pass
        [38.5733, -109.5498]  // Moab
      ],
      desc: "An incredible 150-mile scenic dirt loop crossing iconic red rocks, Shafer Trail switchbacks, and Gemini Bridges boondocking areas."
    },
    "baja-trek": {
      title: "Baja Pacific Highway Trek",
      color: "#3b82f6",
      waypoints: [
        [32.5149, -117.0382], // Tijuana
        [31.8667, -116.6000], // Ensenada
        [30.8667, -115.7000], // San Quintin
        [28.9833, -113.9333], // Bahia de los Angeles
        [27.3333, -113.2833], // Guerrero Negro
        [26.0167, -111.3500], // Loreto
        [24.1422, -110.3128]  // La Paz
      ],
      desc: "The ultimate offgrid vanlife adventure. 1000 miles down Mexico Route 1 through cardon cactus forests and isolated surf spots."
    },
    "pch-route": {
      title: "Pacific Crest Coast Highway",
      color: "#10b981",
      waypoints: [
        [34.0194, -118.4912], // Santa Monica, CA
        [34.4208, -119.6982], // Santa Barbara, CA
        [35.3658, -120.8499], // Morro Bay, CA
        [36.3615, -121.9018], // Big Sur, CA
        [36.9741, -122.0308], // Santa Cruz, CA
        [37.7749, -122.4194]  // San Francisco, CA
      ],
      desc: "Breathtaking coastal cliffs and redwoods. Drive past Big Sur, state parks, and beautiful coastal wild spots."
    }
  };

  const route = routesData[routeId];
  if (!route) return;

  activeRoutePolyline = L.polyline(route.waypoints, {
    color: route.color,
    weight: 5,
    opacity: 0.85,
    dashArray: '10, 10'
  }).addTo(State.leafletMap);

  // Fit bounds to route
  State.leafletMap.fitBounds(activeRoutePolyline.getBounds(), { padding: [40, 40] });

  // Bind popup at middle point
  const midPoint = route.waypoints[Math.floor(route.waypoints.length / 2)];
  activeRoutePolyline.bindPopup(`
    <div style="font-family:Inter,sans-serif; padding:4px; max-width:200px; color:var(--text-charcoal);">
      <strong style="font-size:13px; display:block; margin-bottom:4px;">${route.title}</strong>
      <p style="font-size:11px; color:var(--muted-text); margin:6px 0; line-height:1.4;">${route.desc}</p>
      <button class="btn btn-sm btn-primary" onclick="shareRouteToFeed('${routeId}')" style="width:100%; justify-content:center; padding: 4px 8px; font-size:10px; cursor:pointer;">
        <i data-lucide="share-2" style="width:11px; height:11px; margin-right:4px;"></i> Share to Feed
      </button>
    </div>
  `).openPopup(midPoint);
  
  if (window.lucide) lucide.createIcons();
}

function clearActiveRoute() {
  if (activeRoutePolyline && State.leafletMap) {
    State.leafletMap.removeLayer(activeRoutePolyline);
    activeRoutePolyline = null;
    showToast("Cleared active route line from map.", "info");
  }
}

function shareRouteToFeed(routeId) {
  const routesData = {
    "moab-loop": "Moab Overland Loop (150mi)",
    "baja-trek": "Baja Pacific Highway Trek (1000mi)",
    "pch-route": "Pacific Coast Highway (950mi)"
  };
  const title = routesData[routeId];
  if (!title) return;
  
  if (!State.isSignedIn) {
    showToast("Please sign in to share routes to the community feed.", "error");
    openModal('modal-auth-required');
    return;
  }
  
  const newPost = {
    id: `post-route-${Date.now()}`,
    content: `🗺️ Recommended Route: Check out "${title}" on the map! An incredible scenic trip for boondocking vanlifers.`,
    image: 'none',
    author: {
      name: State.currentUser.name,
      avatar: State.currentUser.avatar
    },
    likes: 0,
    likedByUser: false,
    reposts: 0,
    shares: 0,
    time: "Just now",
    comments: [],
    status: "approved"
  };
  
  State.posts.unshift(newPost);
  saveStateToStorage();
  
  if (State.leafletMap) State.leafletMap.closePopup();
  showToast("Shared route details to the community feed!", "success");
  
  // Redraw feeds
  State._cachedFeeds = {};
  renderDashboardFeed();
  renderFeedTabPosts();
  
  switchTab('feed');
}
"""

if toggle_target not in content:
    print("Error: toggle_target not found in map-pins.js")
    exit(1)

content = content.replace(toggle_target, toggle_replacement, 1)
content += route_functions

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("components/map-pins.js updated with routes toggle and draw logic successfully!")
