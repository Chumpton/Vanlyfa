/* ==========================================================================
   VANLYFA COMPONENT: MAP-PINS.JS
   ========================================================================== */

function updateVouchUI(spot) {
  const vouchCountEl = document.getElementById('drawer-vouch-count');
  if (vouchCountEl) {
    const dataSource = spot.seeded ? ' (from Public Lands Database)' : ' (Community Contributed)';
    vouchCountEl.innerText = `${spot.vouches || 0} Vanlifers Vouched${dataSource}`;
  }
  const vouchBtn = document.getElementById('drawer-vouch-btn');
  if (vouchBtn) {
    const alreadyVouched = spot.vouchedBy && spot.vouchedBy.includes(State.currentUser.name);
    if (alreadyVouched) {
      vouchBtn.innerHTML = `<i data-lucide="shield-check" style="width: 14px; height: 14px;"></i> <span>Vouched</span>`;
      vouchBtn.classList.add('btn-primary');
    } else {
      vouchBtn.innerHTML = `<i data-lucide="shield" style="width: 14px; height: 14px;"></i> <span>Vouch Spot</span>`;
      vouchBtn.classList.remove('btn-primary');
    }
    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function getMapTileUrl() {
  return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
}

window.getMapTileUrl = getMapTileUrl;

window.updateMapTheme = function() {
  if (State.leafletTileLayer && State.leafletTileLayer.setUrl) {
    State.leafletTileLayer.setUrl(getMapTileUrl());
  }
  
  if (State.profileMap && State.profileTileLayer && State.profileTileLayer.setUrl) {
    State.profileTileLayer.setUrl(getMapTileUrl());
  }
};

function initLeafletMap() {
  const container = document.getElementById('leaflet-map');
  if (!container) return;
  
  // Initialize map centered on SW USA (Moab area)
  State.leafletMap = L.map('leaflet-map', {
    zoomControl: true,
    preferCanvas: true // CRITICAL: Forces Leaflet to draw vector overlays on standard Canvas instead of thousands of SVG DOM components
  }).setView([37.0, -112.0], 5);
  
  // Load high-contrast base tiles
  State.leafletTileLayer = L.tileLayer(getMapTileUrl(), {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
    maxZoom: 20,
    keepBuffer: 2 // Limits off-screen mobile memory tile allocation caching
  }).addTo(State.leafletMap);
  
  renderLeafletMarkers();
  initMapLayers();
  
  // GPS Locate Button click handler
  const locateBtn = document.getElementById('map-locate-btn');
  const setupGpsMarker = (latitude, longitude) => {
    if (State.leafletMap) {
      State.leafletMap.flyTo([latitude, longitude], 13);
    }
    if (State.gpsMarker) {
      State.gpsMarker.setLatLng([latitude, longitude]);
    } else {
      const gpsIcon = L.divIcon({
        className: 'gps-location-pin',
        html: '<div class="gps-pin-dot"></div><div class="gps-pin-pulse"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      State.gpsMarker = L.marker([latitude, longitude], { icon: gpsIcon })
        .addTo(State.leafletMap)
        .bindPopup("<strong>Your Location</strong>");
    }
  };

  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        showToast("Locating your position...", "info");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setupGpsMarker(latitude, longitude);
            cacheLocationPresent(latitude, longitude);
            showToast("Centered on your location!", "success");
          },
          (error) => {
            console.warn(error);
            cacheLocationNotPresent();
            showToast("GPS access blocked/failed. Enter coordinates manually.", "warning");
            openModal('modal-gps-input');
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      } else {
        cacheLocationNotPresent();
        showToast("Geolocation unsupported. Enter coordinates manually.", "warning");
        openModal('modal-gps-input');
      }
    });

    const cachedLocation = getCachedLocation();
    if (cachedLocation && cachedLocation.status === 'present') {
      setupGpsMarker(cachedLocation.lat, cachedLocation.lng);
    }
  }

  // Handle Map Show All (Reset view to entire US)
  const showAllBtn = document.getElementById('map-show-all-btn');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      if (State.leafletMap) {
        State.leafletMap.setView([37.8, -96.0], 4);
        showToast("Zoomed out to show all of America!", "info");
      }
    });
  }

  // Re-render markers on map pan/zoom (for clustering)
  State.leafletMap.on('moveend', () => {
    renderLeafletMarkers();
  });

  State.leafletMap.on('popupopen', () => {
    if (window.lucide) {
      lucide.createIcons();
    }
  });

  State.leafletMap.on('click', (e) => {
    if (typeof State !== 'undefined' && State.isSelectingMeetupLocation) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      const latInput = document.getElementById('meetup-lat');
      const lngInput = document.getElementById('meetup-lng');
      if (latInput && lngInput) {
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
      }
      
      State.isSelectingMeetupLocation = false;
      if (typeof openModal === 'function') {
        openModal('modal-add-meetup');
      }
      showToast(`Campsite pin set to: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, "success");
    } else if (typeof State !== 'undefined' && State.isSelectingSpotLocation) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      const latInput = document.getElementById('spot-lat');
      const lngInput = document.getElementById('spot-lng');
      if (latInput && lngInput) {
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
      }
      
      State.isSelectingSpotLocation = false;
      if (typeof openModal === 'function') {
        openModal('modal-add-spot');
      }
      showToast(`Spot location set to: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, "success");
    }
  });

  // Wire Coordinate Helpers Buttons in Add Spot Modal
  const selectSpotMapBtn = document.getElementById('btn-select-spot-map');
  if (selectSpotMapBtn) {
    selectSpotMapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      State.isSelectingSpotLocation = true;
      closeModal('modal-add-spot');
      showToast("Click on the map to place your spot pin.", "info");
    });
  }

  const autofillSpotGpsBtn = document.getElementById('btn-autofill-spot-gps');
  if (autofillSpotGpsBtn) {
    autofillSpotGpsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (navigator.geolocation) {
        showToast("Fetching GPS coordinates...", "info");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const latInput = document.getElementById('spot-lat');
            const lngInput = document.getElementById('spot-lng');
            if (latInput && lngInput) {
              latInput.value = latitude.toFixed(6);
              lngInput.value = longitude.toFixed(6);
            }
            showToast("GPS coordinates filled successfully!", "success");
          },
          (error) => {
            console.warn(error);
            showToast("GPS lookup failed. Enter coordinates manually.", "warning");
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        showToast("Geolocation unsupported. Enter coordinates manually.", "warning");
      }
    });
  }
}

function initMapLayers() {
  if (!State.leafletMap) return;

  // Toggle Panel Display
  const toggleBtn = document.getElementById('map-layers-toggle-btn');
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
  }

  // Create Layer Groups
  State.mapOverlays = {
    verizon: L.layerGroup(),
    att: L.layerGroup(),
    tmobile: L.layerGroup(),
    blm: L.layerGroup(),
    usfs: L.layerGroup()
  };

  // Populate Cellular Layers (Verizon, AT&T, T-Mobile) based on non-seeded spots only
  const userSpots = State.spots.filter(s => !s.seeded);
  userSpots.forEach((spot, idx) => {
    // Verizon (Red) - wide coverage
    L.circle([spot.lat, spot.lng], {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.12,
      weight: 1,
      radius: 20000 + (idx * 5000)
    }).bindPopup(`<strong>Verizon coverage</strong>: Strong LTE`).addTo(State.mapOverlays.verizon);

    // AT&T (Blue) - medium coverage
    L.circle([spot.lat + 0.02, spot.lng - 0.02], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 1,
      radius: 18000 + (idx * 3000)
    }).bindPopup(`<strong>AT&T coverage</strong>: Moderate 5G/LTE`).addTo(State.mapOverlays.att);

    // T-Mobile (Pink) - dense coverage
    L.circle([spot.lat - 0.02, spot.lng + 0.02], {
      color: '#ec4899',
      fillColor: '#ec4899',
      fillOpacity: 0.12,
      weight: 1,
      radius: 15000 + (idx * 4000)
    }).bindPopup(`<strong>T-Mobile coverage</strong>: Strong 5G Ultra Capacity`).addTo(State.mapOverlays.tmobile);
  });

  // Populate BLM (Yellow-Orange) land boundaries around Utah/Arizona spots
  const blmPoly1 = L.polygon([
    [37.30, -112.65],
    [37.32, -112.50],
    [37.20, -112.45],
    [37.18, -112.60]
  ], {
    color: '#f59e0b',
    fillColor: '#f59e0b',
    fillOpacity: 0.25,
    weight: 2
  }).bindPopup('<strong>Bureau of Land Management (BLM)</strong><br>Public land - dispersed camping allowed up to 14 days.');
  blmPoly1.addTo(State.mapOverlays.blm);

  const blmPoly2 = L.polygon([
    [33.75, -114.30],
    [33.72, -114.15],
    [33.60, -114.18],
    [33.62, -114.35]
  ], {
    color: '#f59e0b',
    fillColor: '#f59e0b',
    fillOpacity: 0.25,
    weight: 2
  }).bindPopup('<strong>BLM Quartzsite Land</strong><br>LTVA permits required in designated areas, free dispersed camping in standard areas.');
  blmPoly2.addTo(State.mapOverlays.blm);

  // Populate USFS (Green) land boundaries
  const usfsPoly1 = L.polygon([
    [37.50, -112.30],
    [37.60, -112.20],
    [37.45, -112.00],
    [37.35, -112.15]
  ], {
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.25,
    weight: 2
  }).bindPopup('<strong>Dixie National Forest (USFS)</strong><br>National Forest Land. Practice Leave No Trace.');
  usfsPoly1.addTo(State.mapOverlays.usfs);

  const usfsPoly2 = L.polygon([
    [39.35, -106.40],
    [39.38, -106.20],
    [39.18, -106.18],
    [39.20, -106.38]
  ], {
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.25,
    weight: 2
  }).bindPopup('<strong>San Isabel National Forest (USFS)</strong><br>National Forest Land. Dispersed camping permitted.');
  usfsPoly2.addTo(State.mapOverlays.usfs);

  // Bind UI Checkboxes to Leaflet Layers
  const layersConfig = [
    { id: 'layer-verizon', group: 'verizon' },
    { id: 'layer-att', group: 'att' },
    { id: 'layer-tmobile', group: 'tmobile' },
    { id: 'layer-blm', group: 'blm' },
    { id: 'layer-usfs', group: 'usfs' }
  ];

  layersConfig.forEach(conf => {
    const el = document.getElementById(conf.id);
    if (el) {
      el.addEventListener('change', (e) => {
        const group = State.mapOverlays[conf.group];
        if (e.target.checked) {
          group.addTo(State.leafletMap);
        } else {
          State.leafletMap.removeLayer(group);
        }
      });
    }
  });
  
  // Bind Campsite & Overnight layer filters
  const layerFilterConfig = [
    { id: 'layer-dispersed', key: 'dispersed' },
    { id: 'layer-overnight', key: 'overnight' },
    { id: 'layer-services', key: 'services' },
    { id: 'layer-hosts', key: 'hosts' },
    { id: 'layer-mechanics', key: 'mechanics' },
    { id: 'layer-meetups', key: 'meetups' }
  ];
  layerFilterConfig.forEach(conf => {
    const el = document.getElementById(conf.id);
    if (el) {
      el.checked = State.layerFilters[conf.key] !== undefined ? State.layerFilters[conf.key] : true;
      el.addEventListener('change', (e) => {
        State.layerFilters[conf.key] = e.target.checked;
        
        // If any category checkbox is unchecked, uncheck the toggle-all master checkbox
        const toggleAll = document.getElementById('layer-toggle-all-categories');
        if (toggleAll && !e.target.checked) {
          toggleAll.checked = false;
        }
        
        saveStateToStorage();
        renderLeafletMarkers();
      });
    }
  });

  // Bind Master Category Toggle All
  const toggleAllBtn = document.getElementById('layer-toggle-all-categories');
  if (toggleAllBtn) {
    toggleAllBtn.checked = layerFilterConfig.every(conf => State.layerFilters[conf.key] !== false);
    toggleAllBtn.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      layerFilterConfig.forEach(conf => {
        State.layerFilters[conf.key] = isChecked;
        const el = document.getElementById(conf.id);
        if (el) el.checked = isChecked;
      });
      saveStateToStorage();
      renderLeafletMarkers();
    });
  }

  // Bind Personal Travel Log Filters
  const travelFilters = [
    { id: 'layer-visited', key: 'visitedOnly' },
    { id: 'layer-favorites', key: 'favoritesOnly' },
    { id: 'layer-saved', key: 'savedOnly' },
    { id: 'layer-togo', key: 'togoOnly' }
  ];
  travelFilters.forEach(conf => {
    const el = document.getElementById(conf.id);
    if (el) {
      el.checked = State.layerFilters[conf.key] || false;
      el.addEventListener('change', (e) => {
        State.layerFilters[conf.key] = e.target.checked;
        saveStateToStorage();
        renderLeafletMarkers();
      });
    }
  });
}

function getMarkerMeta(pin) {
  let markerColor = '#8b5cf6'; // Default purple
  let typeName = 'Wild Camping';
  let iconSvg = '<div style="background-color:white; width:6px; height:6px; border-radius:50%;"></div>';
  
  const tentSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-10 18h20L12 2Z"></path></svg>`;
  const houseSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`;
  const dropSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 11 5 15a7 7 0 0 0 7 7z"></path></svg>`;
  const flameSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`;
  const bedSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9M10 8V11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8"></path></svg>`;
  const wrenchSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
  const usersSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`;

  const isVerified = pin.verified === true;
  
  if (pin.category === 'dispersed_campsite' || pin.category === 'wild-camping') {
    markerColor = isVerified ? '#10b981' : '#9ca3af'; // Green vs Grey
    typeName = 'Dispersed Campsite';
    iconSvg = tentSvg;
  }
  else if (pin.category === 'driveway-host') {
    markerColor = isVerified ? '#d97706' : '#9ca3af'; // Gold/Tan vs Grey
    typeName = 'Driveway Host';
    iconSvg = houseSvg;
  }
  else if (pin.category === 'water-station') {
    markerColor = isVerified ? '#0284c7' : '#9ca3af'; // Blue vs Grey
    typeName = 'Water Station';
    iconSvg = dropSvg;
  }
  else if (pin.category === 'service-mechanic') {
    markerColor = isVerified ? '#ea580c' : '#9ca3af'; // Orange vs Grey
    typeName = 'Van Mechanic';
    iconSvg = wrenchSvg;
  }
  else if (pin.category === 'walmart') {
    markerColor = isVerified ? '#0f172a' : '#9ca3af'; // Dark vs Grey
    typeName = 'Walmart Overnight';
    iconSvg = bedSvg;
  }
  else if (pin.category === 'cracker_barrel') {
    markerColor = isVerified ? '#854d0e' : '#9ca3af'; // Brown vs Grey
    typeName = 'Cracker Barrel';
    iconSvg = bedSvg;
  }
  else if (pin.category === 'rest_area') {
    markerColor = isVerified ? '#64748b' : '#9ca3af'; // Slate vs Grey
    typeName = 'Rest Area';
    iconSvg = bedSvg;
  }
  else if (pin.category === 'propane') {
    markerColor = isVerified ? '#b91c1c' : '#9ca3af'; // Red vs Grey
    typeName = 'Propane Refill';
    iconSvg = flameSvg;
  }
  else if (pin.category === 'cluster') {
    markerColor = '#8b5cf6';
    typeName = 'Cluster';
  }
  else if (!pin.category) {
    // Meetup
    markerColor = '#ea580c';
    typeName = 'Nomad Meetup';
    iconSvg = usersSvg;
  }
  return { markerColor, typeName, iconSvg };
}

function shouldShowByLayerFilter(pin) {
  if (!State.layerFilters) return true;
  
  let showByCat = false;
  const cat = pin.category;
  if (cat === 'dispersed_campsite' || cat === 'wild-camping') showByCat = State.layerFilters.dispersed;
  else if (cat === 'walmart' || cat === 'cracker_barrel' || cat === 'rest_area') showByCat = State.layerFilters.overnight;
  else if (cat === 'water-station' || cat === 'propane') showByCat = State.layerFilters.services;
  else if (cat === 'driveway-host') showByCat = State.layerFilters.hosts;
  else if (cat === 'service-mechanic') showByCat = State.layerFilters.mechanics;
  else if (!cat || cat === 'meetup') showByCat = State.layerFilters.meetups;
  else showByCat = true;
  
  if (!showByCat) return false;
  
  // Custom travel filters
  if (State.layerFilters.visitedOnly && (!State.currentUser.visitedSpots || !State.currentUser.visitedSpots.includes(pin.id))) {
    return false;
  }
  if (State.layerFilters.favoritesOnly) {
    const isFav = pin.vouches > 0 || (State.currentUser.givenRepTo && State.currentUser.givenRepTo.includes(pin.id));
    if (!isFav) return false;
  }
  if (State.layerFilters.savedOnly && (!State.currentUser.savedSpots || !State.currentUser.savedSpots.includes(pin.id))) {
    return false;
  }
  if (State.layerFilters.togoOnly && !pin.togo) {
    return false;
  }
  
  return true;
}

const StateBboxes = {
  'California': { code: 'CA', center: [36.7783, -119.4179], bbox: [[32.5, -124.5], [42.0, -114.1]] },
  'Oregon': { code: 'OR', center: [43.8041, -120.5542], bbox: [[42.0, -124.6], [46.3, -116.5]] },
  'Washington': { code: 'WA', center: [47.7511, -120.7401], bbox: [[46.3, -124.8], [49.0, -117.0]] },
  'Utah': { code: 'UT', center: [39.3210, -111.0937], bbox: [[37.0, -114.0], [42.0, -109.0]] },
  'Arizona': { code: 'AZ', center: [34.0489, -111.0937], bbox: [[31.3, -114.8], [37.0, -109.0]] },
  'Colorado': { code: 'CO', center: [39.5501, -105.7821], bbox: [[37.0, -109.0], [41.0, -102.0]] },
  'New Mexico': { code: 'NM', center: [34.5199, -105.8701], bbox: [[31.3, -109.0], [37.0, -103.0]] },
  'Wyoming': { code: 'WY', center: [42.7560, -107.3025], bbox: [[41.0, -111.0], [45.0, -104.0]] },
  'Idaho': { code: 'ID', center: [44.0682, -114.7420], bbox: [[42.0, -117.2], [49.0, -111.0]] },
  'Montana': { code: 'MT', center: [46.8797, -110.3626], bbox: [[44.3, -116.0], [49.0, -104.0]] },
  'Nevada': { code: 'NV', center: [38.8026, -116.4194], bbox: [[35.0, -120.0], [42.0, -114.0]] },
  'Texas': { code: 'TX', center: [31.9686, -99.9018] },
  'North Dakota': { code: 'ND', center: [47.5515, -101.0020] },
  'South Dakota': { code: 'SD', center: [44.2998, -99.4388] },
  'Nebraska': { code: 'NE', center: [41.4925, -99.9018] },
  'Kansas': { code: 'KS', center: [38.5266, -96.7265] },
  'Oklahoma': { code: 'OK', center: [35.0078, -97.0929] },
  'Minnesota': { code: 'MN', center: [46.7296, -94.6859] },
  'Iowa': { code: 'IA', center: [41.8780, -93.0977] },
  'Missouri': { code: 'MO', center: [37.9643, -91.8318] },
  'Arkansas': { code: 'AR', center: [34.9697, -92.3731] },
  'Louisiana': { code: 'LA', center: [31.1695, -91.8678] },
  'Wisconsin': { code: 'WI', center: [44.2563, -89.6385] },
  'Illinois': { code: 'IL', center: [40.6331, -89.3985] },
  'Michigan': { code: 'MI', center: [44.3148, -85.6024] },
  'Indiana': { code: 'IN', center: [40.2672, -86.1349] },
  'Ohio': { code: 'OH', center: [40.4173, -82.9071] },
  'Kentucky': { code: 'KY', center: [37.8393, -84.2700] },
  'Tennessee': { code: 'TN', center: [35.5175, -86.5804] },
  'Mississippi': { code: 'MS', center: [32.7416, -89.6787] },
  'Alabama': { code: 'AL', center: [32.3182, -86.9023] },
  'Georgia': { code: 'GA', center: [32.1656, -82.9001] },
  'Florida': { code: 'FL', center: [27.6648, -81.5158] },
  'South Carolina': { code: 'SC', center: [33.8361, -81.1637] },
  'North Carolina': { code: 'NC', center: [35.7596, -79.0193] },
  'Virginia': { code: 'VA', center: [37.4316, -78.6569] },
  'West Virginia': { code: 'WV', center: [38.5976, -80.4549] },
  'Maryland': { code: 'MD', center: [39.0458, -76.6413] },
  'Delaware': { code: 'DE', center: [38.9108, -75.5277] },
  'New Jersey': { code: 'NJ', center: [40.0583, -74.4057] },
  'Pennsylvania': { code: 'PA', center: [40.8781, -77.7996] },
  'New York': { code: 'NY', center: [43.0000, -75.0000] },
  'Connecticut': { code: 'CT', center: [41.6032, -73.0877] },
  'Rhode Island': { code: 'RI', center: [41.5801, -71.4774] },
  'Massachusetts': { code: 'MA', center: [42.4072, -71.3824] },
  'Vermont': { code: 'VT', center: [44.5588, -72.5778] },
  'New Hampshire': { code: 'NH', center: [43.1939, -71.5724] },
  'Maine': { code: 'ME', center: [45.2538, -69.4455] },
  'Alaska': { code: 'AK', center: [63.5887, -154.4931] },
  'Hawaii': { code: 'HI', center: [19.8968, -155.5828] },
  'East Coast': { code: 'EC', center: [38.5, -78.5] }
};

// All 50 states centroids list for nearest distance matching
const US_STATES_DATA = [
  { name: 'Alabama', code: 'AL', center: [32.3182, -86.9023] },
  { name: 'Alaska', code: 'AK', center: [63.5887, -154.4931] },
  { name: 'Arizona', code: 'AZ', center: [34.0489, -111.0937] },
  { name: 'Arkansas', code: 'AR', center: [34.9697, -92.3731] },
  { name: 'California', code: 'CA', center: [36.7783, -119.4179] },
  { name: 'Colorado', code: 'CO', center: [39.5501, -105.7821] },
  { name: 'Connecticut', code: 'CT', center: [41.6032, -73.0877] },
  { name: 'Delaware', code: 'DE', center: [38.9108, -75.5277] },
  { name: 'Florida', code: 'FL', center: [27.6648, -81.5158] },
  { name: 'Georgia', code: 'GA', center: [32.1656, -82.9001] },
  { name: 'Hawaii', code: 'HI', center: [19.8968, -155.5828] },
  { name: 'Idaho', code: 'ID', center: [44.0682, -114.7420] },
  { name: 'Illinois', code: 'IL', center: [40.6331, -89.3985] },
  { name: 'Indiana', code: 'IN', center: [40.2672, -86.1349] },
  { name: 'Iowa', code: 'IA', center: [41.8780, -93.0977] },
  { name: 'Kansas', code: 'KS', center: [38.5266, -96.7265] },
  { name: 'Kentucky', code: 'KY', center: [37.8393, -84.2700] },
  { name: 'Louisiana', code: 'LA', center: [31.1695, -91.8678] },
  { name: 'Maine', code: 'ME', center: [45.2538, -69.4455] },
  { name: 'Maryland', code: 'MD', center: [39.0458, -76.6413] },
  { name: 'Massachusetts', code: 'MA', center: [42.4072, -71.3824] },
  { name: 'Michigan', code: 'MI', center: [44.3148, -85.6024] },
  { name: 'Minnesota', code: 'MN', center: [46.7296, -94.6859] },
  { name: 'Mississippi', code: 'MS', center: [32.7416, -89.6787] },
  { name: 'Missouri', code: 'MO', center: [37.9643, -91.8318] },
  { name: 'Montana', code: 'MT', center: [46.8797, -110.3626] },
  { name: 'Nebraska', code: 'NE', center: [41.4925, -99.9018] },
  { name: 'Nevada', code: 'NV', center: [38.8026, -116.4194] },
  { name: 'New Hampshire', code: 'NH', center: [43.1939, -71.5724] },
  { name: 'New Jersey', code: 'NJ', center: [40.0583, -74.4057] },
  { name: 'New Mexico', code: 'NM', center: [34.5199, -105.8701] },
  { name: 'New York', code: 'NY', center: [43.0000, -75.0000] },
  { name: 'North Carolina', code: 'NC', center: [35.7596, -79.0193] },
  { name: 'North Dakota', code: 'ND', center: [47.5515, -101.0020] },
  { name: 'Ohio', code: 'OH', center: [40.4173, -82.9071] },
  { name: 'Oklahoma', code: 'OK', center: [35.0078, -97.0929] },
  { name: 'Oregon', code: 'OR', center: [43.8041, -120.5542] },
  { name: 'Pennsylvania', code: 'PA', center: [40.8781, -77.7996] },
  { name: 'Rhode Island', code: 'RI', center: [41.5801, -71.4774] },
  { name: 'South Carolina', code: 'SC', center: [33.8361, -81.1637] },
  { name: 'South Dakota', code: 'SD', center: [44.2998, -99.4388] },
  { name: 'Tennessee', code: 'TN', center: [35.5175, -86.5804] },
  { name: 'Texas', code: 'TX', center: [31.9686, -99.9018] },
  { name: 'Utah', code: 'UT', center: [39.3210, -111.0937] },
  { name: 'Vermont', code: 'VT', center: [44.5588, -72.5778] },
  { name: 'Virginia', code: 'VA', center: [37.4316, -78.6569] },
  { name: 'Washington', code: 'WA', center: [47.7511, -120.7401] },
  { name: 'West Virginia', code: 'WV', center: [38.5976, -80.4549] },
  { name: 'Wisconsin', code: 'WI', center: [44.2563, -89.6385] },
  { name: 'Wyoming', code: 'WY', center: [42.7560, -107.3025] }
];

function getStateFromLatLng(lat, lng) {
  // Simple check for general US boundaries
  if (lat < 24.0 || lat > 50.0 || lng < -125.0 || lng > -66.0) {
    return 'Other';
  }
  
  // Find the closest state by center coordinate
  let minDist = Infinity;
  let closestState = 'Other';
  
  US_STATES_DATA.forEach(state => {
    const dLat = lat - state.center[0];
    const dLng = lng - state.center[1];
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      closestState = state.name;
    }
  });
  
  return closestState;
}

let renderTimeout = null;
function renderLeafletMarkers() {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    safeguardedRenderLeafletMarkers();
  }, 80);
}

function safeguardedRenderLeafletMarkers() {
  if (!State.leafletMap) return;
  
  const zoom = State.leafletMap.getZoom();
  const bounds = State.leafletMap.getBounds();
  const isMobile = window.innerWidth <= 768;
  
  let pins = [];
  
  // High efficiency filter pass
  if (zoom <= 6) {
    const allSeeded = (typeof ClusterEngine !== 'undefined') ? ClusterEngine.allSpots : [];
    const userSpots = State.spots.filter(s => !s.seeded && s.status !== 'hidden_flagged');
    const rawPins = [...userSpots, ...allSeeded, ...State.meetups];
    
    const stateGroups = {};
    
    rawPins.forEach(pin => {
      if (!shouldShowByLayerFilter(pin)) return;
      
      // Early search query match check
      if (State.searchQuery) {
        const query = State.searchQuery.toLowerCase();
        if (!pin.title.toLowerCase().includes(query) && (!pin.description || !pin.description.toLowerCase().includes(query))) return;
      }
      
      // Fast hardcoded bounding box calculation for major points on mobile viewports
      let stateName = 'Other';
      if (pin.lat >= 31.3 && pin.lat <= 37.0 && pin.lng >= -114.8 && pin.lng <= -109.0) stateName = 'Arizona';
      else if (pin.lat >= 32.5 && pin.lat <= 42.0 && pin.lng >= -124.5 && pin.lng <= -114.1) stateName = 'California';
      else if (pin.lat >= 31.3 && pin.lat <= 37.0 && pin.lng >= -109.0 && pin.lng <= -103.0) stateName = 'New Mexico';
      else if (pin.lat >= 37.0 && pin.lat <= 42.0 && pin.lng >= -114.0 && pin.lng <= -109.0) stateName = 'Utah';
      else if (pin.lat >= 37.0 && pin.lat <= 41.0 && pin.lng >= -109.0 && pin.lng <= -102.0) stateName = 'Colorado';
      else {
        // Fall back to centroid calculation if outside high-probability project areas
        stateName = getStateFromLatLng(pin.lat, pin.lng);
      }
      
      if (zoom <= 6 && pin.lng > -100 && stateName !== 'Other') {
        stateName = 'East Coast';
      }
      
      if (!stateGroups[stateName]) stateGroups[stateName] = [];
      stateGroups[stateName].push(pin);
    });
    
    for (const [stateName, statePins] of Object.entries(stateGroups)) {
      if (stateName === 'Other') continue;
      const stateInfo = StateBboxes[stateName] || { code: 'US', center: [37.0902, -95.7129] };
      
      // Only render state cluster if the state has pins within the visible bounds
      const hasVisiblePins = statePins.some(pin => bounds.contains([pin.lat, pin.lng]));
      if (hasVisiblePins) {
        pins.push({
          id: `state-cluster-${stateName}`,
          title: `${statePins.length} Spots in ${stateName}`,
          category: 'cluster',
          lat: stateInfo.center[0],
          lng: stateInfo.center[1],
          _isCluster: true,
          _isStateCluster: true,
          _stateCode: stateInfo.code,
          _clusterCount: statePins.length,
          _stateName: stateName
        });
      }
    }
  } else {
    // Zoom levels > 4: Bound checking limits the processing queue on mobile screen heights
    let visibleSeeded = [];
    if (typeof ClusterEngine !== 'undefined' && ClusterEngine.allSpots.length > 0) {
      visibleSeeded = ClusterEngine.getVisibleSpots(bounds, zoom);
    }
    const userSpots = State.spots.filter(s => !s.seeded && s.status !== 'hidden_flagged' && typeof s.lat === 'number' && typeof s.lng === 'number' && bounds.contains([s.lat, s.lng]));
    pins = [...userSpots, ...visibleSeeded, ...State.meetups.filter(m => typeof m.lat === 'number' && typeof m.lng === 'number' && bounds.contains([m.lat, m.lng]))];
  }
  
  // Maintain Map State allocations cleanly
  const seen = new Set();
  const nextPinsMap = new Map();
  
  pins.forEach(pin => {
    if (seen.has(pin.id)) return;
    seen.add(pin.id);
    if (!pin._isStateCluster && !shouldShowByLayerFilter(pin)) return;
    
    if (!pin._isStateCluster && State.searchQuery) {
      const query = State.searchQuery.toLowerCase();
      if (!pin.title.toLowerCase().includes(query) && (!pin.description || !pin.description.toLowerCase().includes(query))) return;
    }
    
    if (!pin._isCluster && (typeof pin.lat !== 'number' || typeof pin.lng !== 'number' || isNaN(pin.lat) || isNaN(pin.lng))) {
      return;
    }
    
    nextPinsMap.set(pin.id, pin);
  });

  if (!State.leafletMarkersMap) State.leafletMarkersMap = new Map();

  // Safely detach unseen entities to release layout contexts instantly
  for (const [pinId, marker] of State.leafletMarkersMap.entries()) {
    if (!nextPinsMap.has(pinId)) {
      State.leafletMap.removeLayer(marker);
      State.leafletMarkersMap.delete(pinId);
    }
  }

  // Pre-calculate offsets for standard nodes that share coordinates
  const coordGroups = new Map();
  nextPinsMap.forEach((pin, pinId) => {
    if (pin._isCluster) return;
    const key = `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}`;
    if (!coordGroups.has(key)) {
      coordGroups.set(key, []);
    }
    coordGroups.get(key).push(pinId);
  });

  const pinOffsets = new Map();
  coordGroups.forEach((pinIds, key) => {
    if (pinIds.length > 1) {
      const radius = 0.0006 * Math.pow(2, 12 - zoom);
      pinIds.forEach((pinId, index) => {
        const angle = (index * 2 * Math.PI) / pinIds.length;
        pinOffsets.set(pinId, {
          latOffset: radius * Math.cos(angle),
          lngOffset: radius * Math.sin(angle)
        });
      });
    }
  });

  // Generate newly registered markers natively
  for (const [pinId, pin] of nextPinsMap.entries()) {
    if (State.leafletMarkersMap.has(pinId)) continue; // Keep instances alive instead of cycling layers

    const { markerColor, typeName, iconSvg } = getMarkerMeta(pin);
    let marker;

    if (pin._isCluster) {
      const count = pin._clusterCount;
      let size = pin._isStateCluster ? 52 : Math.min(18 + Math.log2(count) * 6, 44);
      let customIcon;
      
      if (pin._isStateCluster) {
        customIcon = L.divIcon({
          html: `<div style="background:linear-gradient(135deg, #3B7A57, #1b681b); width:52px; height:52px; border-radius:50%; border:3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:Outfit,Inter,sans-serif; line-height:1.1;"><span style="font-weight:800; font-size:14px; letter-spacing:0.5px;">${pin._stateCode}</span><span style="font-weight:600; font-size:10px; opacity:0.9;">${count}</span></div>`,
          className: 'custom-map-icon cluster-icon state-cluster-icon',
          iconSize: [52, 52],
          iconAnchor: [26, 26]
        });
      } else {
        customIcon = L.divIcon({
          html: `<div style="background:linear-gradient(135deg, #3B7A57, #10b981); width:${size}px; height:${size}px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-weight:800; font-size:${Math.max(10, size/3.2)}px; font-family:Inter,sans-serif;">${count}</div>`,
          className: 'custom-map-icon cluster-icon',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
      }
      
      marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(State.leafletMap);
      marker.on('click', () => {
        if (pin._isStateCluster) {
          const stateInfo = StateBboxes[pin._stateName];
          if (stateInfo) {
            if (stateInfo.bbox) {
              State.leafletMap.fitBounds(stateInfo.bbox);
            } else {
              const c = stateInfo.center;
              const padLat = pin._stateName === 'East Coast' ? 5.0 : 1.5;
              const padLng = pin._stateName === 'East Coast' ? 9.0 : 2.0;
              State.leafletMap.fitBounds([[c[0] - padLat, c[1] - padLng], [c[0] + padLat, c[1] + padLng]]);
            }
          } else {
            State.leafletMap.setView([pin.lat, pin.lng], 6);
          }
        } else {
          State.leafletMap.setView([pin.lat, pin.lng], zoom + 2);
        }
      });
    } else {
      // Standard Node handling matching native attributes
      let lat = pin.lat;
      let lng = pin.lng;
      const offset = pinOffsets.get(pinId);
      if (offset) {
        lat += offset.latOffset;
        lng += offset.lngOffset;
      }

      const borderStyle = pin.pendingSync ? '2px dashed var(--accent-red)' : '2px solid white';
      const opacityStyle = pin.pendingSync ? '0.7' : '1.0';
      const verifiedDot = pin.verified ? '<div style="position:absolute;top:-2px;right:-2px;width:7px;height:7px;background:#10b981;border-radius:50%;border:1px solid white;"></div>' : '';
      const customIcon = L.divIcon({
        html: `<div style="position:relative;background-color:${markerColor}; width:24px; height:24px; border-radius:50%; border:${borderStyle}; opacity:${opacityStyle}; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
                ${iconSvg}
                ${verifiedDot}
               </div>`,
        className: 'custom-map-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      marker = L.marker([lat, lng], { icon: customIcon }).addTo(State.leafletMap);
      
      if (!isMobile) {
        marker.bindPopup(getDetailedPopupHtml(pin), { closeButton: true, minWidth: 300, maxWidth: 340 });
        marker.on('click', () => {
          marker.openPopup();
        });
      } else {
        marker.on('click', () => { openInfoDrawerForSpot(pin); });
      }
    }
    State.leafletMarkersMap.set(pinId, marker);
  }
  State.mapMarkers = Array.from(State.leafletMarkersMap.values());
}

function openInfoDrawerForSpot(pin) {
  const drawer = document.getElementById('map-info-drawer');
  
  const { markerColor, typeName: typeLabel } = getMarkerMeta(pin);
  let typeName = typeLabel;
  let categoryColor = markerColor;
  
  document.getElementById('drawer-category').innerText = typeName;
  document.getElementById('drawer-category').style.color = categoryColor;
  document.getElementById('drawer-title').innerText = pin.title + (pin.pendingSync ? ' (Pending Sync)' : '');
  
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
  
  const copyBtn = document.getElementById('btn-coords-copy');
  const exportBtn = document.getElementById('btn-coords-export');
  if (pin.privateLocation) {
    document.getElementById('drawer-coords').innerText = "Location coordinates are private";
    if (copyBtn) copyBtn.style.display = 'none';
    if (exportBtn) exportBtn.style.display = 'none';
  } else {
    document.getElementById('drawer-coords').innerText = `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`;
    if (copyBtn) copyBtn.style.display = 'inline-flex';
    if (exportBtn) exportBtn.style.display = 'inline-flex';
  }
  
  // Extended metadata for seed data (land_manager, overnight_rule, verified)
  let metaEl = document.getElementById('drawer-extended-meta');
  if (!metaEl) {
    metaEl = document.createElement('div');
    metaEl.id = 'drawer-extended-meta';
    metaEl.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:4px;';
    const coordsEl = document.getElementById('drawer-coords');
    if (coordsEl && coordsEl.parentNode) coordsEl.parentNode.insertBefore(metaEl, coordsEl.nextSibling);
  }
  if (pin.land_manager || pin.overnight_rule || pin.verified !== undefined) {
    let metaHtml = '';
    if (pin.verified) {
      metaHtml += `<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;"><span style="display:inline-flex;align-items:center;gap:3px;background:rgba(16,185,129,0.15);color:#10b981;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:0.5px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> VERIFIED SOURCE</span></div>`;
    }
    if (pin.land_manager) {
      metaHtml += `<div style="font-size:11px;color:var(--muted-text);"><strong style="color:var(--text-main);font-weight:600;">Manager:</strong> ${pin.land_manager}</div>`;
    }
    if (pin.overnight_rule) {
      const ruleColor = pin.overnight_rule === 'Allowed' ? '#10b981' : pin.overnight_rule === '14-day limit' ? '#f59e0b' : 'var(--muted-text)';
      metaHtml += `<div style="font-size:11px;color:var(--muted-text);"><strong style="color:var(--text-main);font-weight:600;">Overnight:</strong> <span style="color:${ruleColor};font-weight:600;">${pin.overnight_rule}</span></div>`;
    }
    metaEl.innerHTML = metaHtml;
    metaEl.style.display = 'flex';
  } else {
    metaEl.innerHTML = '';
    metaEl.style.display = 'none';
  }
  
  if (!pin.category) {
    document.getElementById('drawer-vouch-count').innerText = `${pin.attendeesCount} Nomads Going`;
  } else {
    const dataSource = pin.seeded ? ' (from Public Lands Database)' : ' (Community Contributed)';
    document.getElementById('drawer-vouch-count').innerText = `${pin.vouches || 0} Vanlifers Vouched${dataSource}`;
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

  // Initialize vouch button state in drawer
  const vouchBtn = document.getElementById('drawer-vouch-btn');
  if (vouchBtn) {
    if (!pin.category) {
      vouchBtn.style.display = 'none';
    } else {
      vouchBtn.style.display = 'inline-flex';
      const alreadyVouched = pin.vouchedBy && pin.vouchedBy.includes(State.currentUser.name);
      if (alreadyVouched) {
        vouchBtn.innerHTML = `<i data-lucide="shield-check" style="width: 14px; height: 14px;"></i> <span>Vouched</span>`;
        vouchBtn.classList.add('btn-primary');
      } else {
        vouchBtn.innerHTML = `<i data-lucide="shield" style="width: 14px; height: 14px;"></i> <span>Vouch Spot</span>`;
        vouchBtn.classList.remove('btn-primary');
      }
    }
  }

  // --- Map Coordinates Actions ---
  document.getElementById('btn-coords-copy').onclick = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`);
    showToast("Coordinates copied to clipboard!", "success");
  };
  document.getElementById('btn-coords-export').onclick = (e) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`, '_blank');
  };

  // --- Action Button Group ---
  document.getElementById('drawer-directions-btn').onclick = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`, '_blank');
  };
  document.getElementById('drawer-share-btn').onclick = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?spot=${pin.id}`;
    navigator.clipboard.writeText(shareUrl);
    showToast("Share link copied to clipboard!", "success");
  };

  // --- Star Ratings & Reviews Render ---
  const ratingContainer = document.getElementById('drawer-rating-container');
  const reviewsSection = document.getElementById('drawer-reviews-section');
  const reviewForm = document.getElementById('review-composer');
  
  if (reviewForm) reviewForm.style.display = 'none'; // reset form display

  if (pin.category && pin.category !== 'service-mechanic') {
    ratingContainer.style.display = 'flex';
    reviewsSection.style.display = 'block';
    
    // Wire Write Review button toggle
    document.getElementById('btn-write-review').onclick = () => {
      if (!requireAuth()) return;
      reviewForm.style.display = reviewForm.style.display === 'none' ? 'flex' : 'none';
    };
    
    // Render review items
    const reviewsList = document.getElementById('drawer-reviews-list');
    reviewsList.innerHTML = '';
    const reviews = pin.reviews || [];
    
    if (reviews.length > 0) {
      let totalRating = 0;
      reviews.forEach(r => {
        totalRating += Number(r.rating);
        const reviewEl = document.createElement('div');
        reviewEl.style.cssText = 'padding:8px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-sm);font-size:11px;';
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
          starsHtml += i <= r.rating ? '★' : '☆';
        }
        
        reviewEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="color:var(--text-main);">${r.author.name}</strong>
            <span style="color:#F59E0B;font-weight:700;">${starsHtml}</span>
          </div>
          <p style="margin:2px 0 0 0;color:var(--text-charcoal);line-height:1.3;">${r.text}</p>
          <span style="font-size:9px;color:var(--muted-text);display:block;margin-top:4px;text-align:right;">${r.time}</span>
        `;
        reviewsList.appendChild(reviewEl);
      });
      
      const avg = (totalRating / reviews.length).toFixed(1);
      let avgStars = '';
      for (let i = 1; i <= 5; i++) {
        avgStars += i <= Math.round(avg) ? '★' : '☆';
      }
      
      document.getElementById('drawer-stars').innerText = avgStars;
      document.getElementById('drawer-stars').style.color = '#F59E0B';
      document.getElementById('drawer-rating-text').innerText = `${avg} (${reviews.length} review${reviews.length > 1 ? 's' : ''})`;
    } else {
      document.getElementById('drawer-stars').innerText = '☆☆☆☆☆';
      document.getElementById('drawer-stars').style.color = 'var(--muted-text)';
      document.getElementById('drawer-rating-text').innerText = 'No reviews yet';
      reviewsList.innerHTML = `<div style="font-size:11px;color:var(--muted-text);text-align:center;padding:12px 0;">Be the first to review this spot!</div>`;
    }
  } else {
    if (ratingContainer) ratingContainer.style.display = 'none';
    if (reviewsSection) reviewsSection.style.display = 'none';
  }

  // --- Driveway Booking Section Render ---
  const bookingSection = document.getElementById('drawer-booking-section');
  if (pin.category === 'driveway-host') {
    bookingSection.style.display = 'block';
    const price = pin.price || 15;
    document.getElementById('drawer-driveway-price').innerText = `$${price} / night`;
    
    // Parse amenities
    let amenitiesStr = '';
    if (pin.amenities) {
      if (pin.amenities.power) amenitiesStr += '⚡ Power ';
      if (pin.amenities.water) amenitiesStr += '💧 Water ';
      if (pin.amenities.wifi) amenitiesStr += '📶 WiFi ';
      if (pin.amenities.pets) amenitiesStr += '🐾 Pets ';
    }
    if (!amenitiesStr) amenitiesStr = 'Driveway Access only';
    document.getElementById('drawer-driveway-amenities').innerText = amenitiesStr;
    
    // Wire book button
    document.getElementById('btn-book-driveway').onclick = () => {
      if (!requireAuth()) return;
      
      document.getElementById('book-driveway-title').innerText = pin.title;
      document.getElementById('book-driveway-rate').innerText = `Rate: $${price}/night`;
      document.getElementById('book-nights').value = 1;
      
      // Calculate initial cost
      document.getElementById('book-total-cost').innerText = `$${price}.00`;
      
      openModal('modal-book-driveway');
    };
  } else {
    if (bookingSection) bookingSection.style.display = 'none';
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

function toggleSpotHostingFields() {
  const category = document.getElementById('spot-category').value;
  const hostingFields = document.getElementById('spot-hosting-fields');
  if (hostingFields) {
    hostingFields.style.display = category === 'driveway-host' ? 'flex' : 'none';
  }
}

function saveSpotReview(event) {
  event.preventDefault();
  if (!requireAuth()) return;
  const ratingVal = document.getElementById('review-rating').value;
  const textVal = document.getElementById('review-text').value.trim();
  
  if (!textVal) return;
  
  const spot = State.spots.find(s => s.id === State.currentViewedSpotId);
  if (spot) {
    if (!spot.reviews) spot.reviews = [];
    
    const newReview = {
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      rating: Number(ratingVal),
      text: textVal,
      time: new Date().toISOString().split('T')[0]
    };
    
    spot.reviews.push(newReview);
    saveStateToStorage();
    showToast("Review submitted successfully!", "success");
    
    // Reset inputs
    document.getElementById('review-text').value = '';
    document.getElementById('review-composer').style.display = 'none';
    
    // Refresh view
    openInfoDrawerForSpot(spot);
  }
}

function plotRouteToSpot(spot) {
  if (activeRoutePolyline && State.leafletMap) {
    State.leafletMap.removeLayer(activeRoutePolyline);
    activeRoutePolyline = null;
  }
  
  // Remove existing directions card
  const oldCard = document.getElementById('directions-info-card');
  if (oldCard) oldCard.remove();
  
  if (!State.leafletMap) return;
  
  // Create a realistic path starting ~12 miles away
  const startLat = spot.lat + 0.082;
  const startLng = spot.lng - 0.095;
  
  const points = [
    [startLat, startLng],
    [startLat - 0.02, startLng + 0.015],
    [startLat - 0.04, startLng + 0.05],
    [startLat - 0.065, startLng + 0.07],
    [startLat - 0.075, spot.lng - 0.01],
    [spot.lat, spot.lng]
  ];
  
  activeRoutePolyline = L.polyline(points, {
    color: '#3B82F6',
    weight: 5,
    opacity: 0.9,
    dashArray: '8, 8',
    lineCap: 'round'
  }).addTo(State.leafletMap);
  
  State.leafletMap.fitBounds(activeRoutePolyline.getBounds(), { padding: [40, 40] });
  showToast("Simulated GPS path drawn!", "info");
  
  // Append a directions directions box inside the map drawer
  const drawer = document.getElementById('map-info-drawer');
  if (drawer) {
    const card = document.createElement('div');
    card.id = 'directions-info-card';
    card.style.cssText = 'margin-top:16px;background:var(--bg-sand);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:10px;font-size:11px;';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;border-bottom:1px solid var(--border-color);padding-bottom:4px;">
        <strong style="color:var(--accent-green);display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg> GPS Routing Steps</strong>
        <button class="btn btn-sm" onclick="clearActiveMapRoute()" style="padding:0;background:transparent;border:none;color:var(--muted-text);font-weight:700;cursor:pointer;">Clear</button>
      </div>
      <ol style="margin:0;padding-left:14px;color:var(--text-charcoal);line-height:1.4;display:flex;flex-direction:column;gap:3px;">
        <li>Head South toward main access road (4.5 mi)</li>
        <li>Turn left onto forest service unpaved wash (2.8 mi - high clearance)</li>
        <li>Arrive at spot coordinates on the right.</li>
      </ol>
    `;
    drawer.appendChild(card);
  }
}

function clearActiveMapRoute() {
  if (activeRoutePolyline && State.leafletMap) {
    State.leafletMap.removeLayer(activeRoutePolyline);
    activeRoutePolyline = null;
  }
  const oldCard = document.getElementById('directions-info-card');
  if (oldCard) oldCard.remove();
  showToast("Route cleared.", "info");
}

function calculateBookingTotal() {
  const nights = Number(document.getElementById('book-nights').value) || 1;
  const spot = State.spots.find(s => s.id === State.currentViewedSpotId);
  if (spot) {
    const price = spot.price || 15;
    const total = price * nights;
    document.getElementById('book-total-cost').innerText = `$${total.toFixed(2)}`;
  }
}

function handleCompleteDrivewayBooking(event) {
  event.preventDefault();
  if (!requireAuth()) return;
  
  const spot = State.spots.find(s => s.id === State.currentViewedSpotId);
  if (!spot) return;
  
  const dateVal = document.getElementById('book-date').value;
  const nightsVal = Number(document.getElementById('book-nights').value) || 1;
  const price = spot.price || 15;
  const total = price * nightsVal;
  
  showToast("Processing simulated card payment...", "info");
  
  setTimeout(() => {
    const newBooking = {
      id: `booking-${Date.now()}`,
      spotId: spot.id,
      spotTitle: spot.title,
      hostName: spot.author ? spot.author.name : "Driveway Host",
      checkInDate: dateVal,
      nights: nightsVal,
      totalCost: total,
      timestamp: new Date().toISOString().split('T')[0]
    };
    
    State.bookings.push(newBooking);
    saveStateToStorage();
    
    closeModal('modal-book-driveway');
    showToast("Booking confirmed! Saved to your profile.", "success");
    
    // Clear inputs
    document.getElementById('card-number').value = '';
    document.getElementById('card-expiry').value = '';
    document.getElementById('card-cvv').value = '';
    document.getElementById('book-date').value = '';
    document.getElementById('book-nights').value = '1';
    
    if (State.activeTab === 'profile') {
      renderUserProfile();
    }
  }, 1200);
}

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

/* ==========================================================================
   DESKTOP MAP POPUP DETAILS & HELPER ACTIONS
   ========================================================================== */

function getDetailedPopupHtml(pin) {
  const { markerColor, typeName } = getMarkerMeta(pin);
  const verifiedBadge = pin.verified ? `<span style="background:rgba(16,185,129,0.15);color:#10b981;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;display:inline-flex;align-items:center;">✓ Verified</span>` : '';
  
  // User profile section
  const author = pin.author || pin.host || { name: 'Anonymous', avatar: 'avatar_default' };
  const avatarSrc = getAvatarSrc(author.avatar);
  
  // Reviews / Rating stars
  let ratingHtml = '';
  if (pin.category && pin.category !== 'service-mechanic') {
    if (pin.reviews && pin.reviews.length > 0) {
      let totalRating = 0;
      pin.reviews.forEach(r => totalRating += Number(r.rating));
      const avg = (totalRating / pin.reviews.length).toFixed(1);
      let avgStars = '';
      for (let i = 1; i <= 5; i++) {
        avgStars += i <= Math.round(avg) ? '★' : '☆';
      }
      ratingHtml = `<span style="color:#F59E0B;font-weight:700;font-size:11px;">${avgStars}</span> <span style="font-size:10px;color:var(--muted-text);">(${pin.reviews.length})</span>`;
    } else {
      ratingHtml = `<span style="font-size:10px;color:var(--muted-text);">No reviews yet</span>`;
    }
  }
  
  // Categories and Limits metadata
  let limitHtml = '';
  if (pin.land_manager || pin.overnight_rule) {
    limitHtml += '<div style="font-size:11px;color:var(--text-charcoal);margin-top:6px;display:flex;flex-direction:column;gap:2px;">';
    if (pin.land_manager) {
      limitHtml += `<div><strong>Manager:</strong> ${pin.land_manager}</div>`;
    }
    if (pin.overnight_rule) {
      const ruleColor = pin.overnight_rule === 'Allowed' ? '#10b981' : pin.overnight_rule === '14-day limit' ? '#f59e0b' : 'var(--muted-text)';
      limitHtml += `<div><strong>Overnight:</strong> <span style="color:${ruleColor};font-weight:600;">${pin.overnight_rule}</span></div>`;
    }
    limitHtml += '</div>';
  }
  
  const coordsHtml = pin.privateLocation 
    ? `<div style="font-size:10px;color:var(--muted-text);margin-top:4px;">Coordinates: Private</div>`
    : `<div style="font-size:10px;color:var(--muted-text);margin-top:4px;">Coordinates: ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}</div>`;
    
  // Driveway Host html
  let drivewayHtml = '';
  if (pin.category === 'driveway-host') {
    const price = pin.price || 15;
    let amenitiesStr = '';
    if (pin.amenities) {
      if (pin.amenities.power) amenitiesStr += '⚡ Power ';
      if (pin.amenities.water) amenitiesStr += '💧 Water ';
      if (pin.amenities.wifi) amenitiesStr += '📶 WiFi ';
      if (pin.amenities.pets) amenitiesStr += '🐾 Pets ';
    }
    if (!amenitiesStr) amenitiesStr = 'Driveway Access only';
    
    drivewayHtml = `
      <div style="margin-top:6px;padding:6px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-sm);font-size:11px;">
        <div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:2px;">
          <span>Rate:</span>
          <span style="color:var(--accent-green);">$${price} / night</span>
        </div>
        <div style="color:var(--muted-text);font-size:10px;">${amenitiesStr}</div>
      </div>
    `;
  }
  
  // Meetup HTML
  let meetupHtml = '';
  if (!pin.category) {
    const attendeesCount = pin.attendees ? pin.attendees.length : 0;
    meetupHtml = `
      <div style="margin-top:6px;padding:6px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-sm);font-size:11px;display:flex;justify-content:space-between;align-items:center;">
        <span><strong>Date:</strong> ${pin.date}</span>
        <span style="background:rgba(213,94,0,0.15);color:#D55E00;padding:2px 6px;border-radius:10px;font-size:9px;font-weight:700;">${attendeesCount} RSVP'd</span>
      </div>
    `;
  }
  
  // Action buttons SVGs
  const shieldSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
  const checkSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const routeSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>`;
  const shareSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`;
  const bookSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  const rsvpSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  
  let buttonsHtml = '';
  
  if (pin.category) {
    // Spot
    const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
    const isVisited = currentUserObj && currentUserObj.visitedSpots && currentUserObj.visitedSpots.includes(pin.id);
    const alreadyVouched = pin.vouchedBy && pin.vouchedBy.includes(State.currentUser.name);
    
    const vouchBtnClass = alreadyVouched ? 'btn-primary' : '';
    const vouchBtnText = alreadyVouched ? 'Vouched' : 'Vouch';
    
    const visitedBtnClass = isVisited ? 'btn-primary' : '';
    const visitedBtnText = isVisited ? 'Visited' : 'Mark Visited';
    
    buttonsHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;">
        <button class="btn btn-sm ${vouchBtnClass}" onclick="window.toggleVouchFromPopup('${pin.id}')" style="justify-content:center;font-size:10px;padding:4px 6px;">
          ${shieldSvg} ${vouchBtnText}
        </button>
        <button class="btn btn-sm ${visitedBtnClass}" onclick="window.markVisitedFromPopup('${pin.id}')" style="justify-content:center;font-size:10px;padding:4px 6px;">
          ${checkSvg} ${visitedBtnText}
        </button>
        <a class="btn btn-sm" href="https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}" target="_blank" style="justify-content:center;font-size:10px;padding:4px 6px;text-decoration:none;color:var(--text-main);background:var(--bg-sand);display:inline-flex;align-items:center;">
          <i data-lucide="map" style="width:11px; height:11px; margin-right:3px;"></i> Map
        </a>
        <button class="btn btn-sm" onclick="window.shareSpotFromPopup('${pin.id}')" style="justify-content:center;font-size:10px;padding:4px 6px;">
          ${shareSvg} Share
        </button>
        ${pin.category === 'driveway-host' ? `
        <button class="btn btn-sm btn-primary" onclick="window.bookDrivewayFromPopup('${pin.id}')" style="grid-column: span 2; justify-content:center; font-size:11px; padding:5px; font-weight:700; background-color:var(--accent-green); border-color:var(--accent-green); color:white; margin-top:4px;">
          ${bookSvg} Book Space
        </button>
        ` : ''}
      </div>
      <button class="btn btn-sm" onclick="window.flagItem('spot', '${pin.id}')" style="width:100%;justify-content:center;font-size:10px;padding:4px 6px;margin-top:6px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg> Report / Flag Spot
      </button>
    `;
  } else {
    // Meetup
    const userAvatar = State.currentUser ? State.currentUser.avatar : 'avatar_bob';
    const hasRsvped = pin.attendees && pin.attendees.includes(userAvatar);
    
    const rsvpBtnClass = hasRsvped ? 'btn-secondary' : 'btn-primary';
    const rsvpBtnText = hasRsvped ? 'Going' : 'RSVP';
    
    buttonsHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;">
        <button class="btn btn-sm ${rsvpBtnClass}" onclick="window.toggleRsvpFromPopup('${pin.id}')" style="justify-content:center;font-size:10px;padding:4px 6px;">
          ${rsvpSvg} ${rsvpBtnText}
        </button>
        <button class="btn btn-sm" onclick="window.shareMeetupFromPopup('${pin.id}')" style="justify-content:center;font-size:10px;padding:4px 6px;">
          ${shareSvg} Share
        </button>
        <a class="btn btn-sm" href="https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}" target="_blank" style="grid-column: span 2; justify-content:center;font-size:10px;padding:4px 6px;text-decoration:none;color:var(--text-main);background:var(--bg-sand);display:inline-flex;align-items:center;">
          <i data-lucide="map" style="width:11px; height:11px; margin-right:3px;"></i> Open in Google Maps
        </a>
      </div>
    `;
  }
  
  return `
    <div class="detailed-map-popup" style="font-family:Inter,sans-serif;color:var(--text-main);padding:2px;max-width:320px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;border-bottom:1px solid var(--border-color);padding-bottom:6px;margin-bottom:6px;">
        <div>
          <span style="font-size:10px;font-weight:700;color:${markerColor};text-transform:uppercase;letter-spacing:0.5px;">${typeName}</span>
          ${verifiedBadge}
          <h3 style="margin:2px 0 0 0;font-size:14px;font-weight:700;line-height:1.2;color:var(--text-main);">${pin.title}</h3>
        </div>
      </div>
      
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <img src="${avatarSrc}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" />
        <span style="font-size:11px;color:var(--text-charcoal);"><span style="color:var(--muted-text);">by</span> ${author.name}</span>
        <div style="margin-left:auto;">${ratingHtml}</div>
      </div>
      
      <p style="margin:0 0 6px 0;font-size:11px;line-height:1.4;color:var(--text-charcoal);max-height:60px;overflow-y:auto;">${pin.description}</p>
      
      ${drivewayHtml}
      ${meetupHtml}
      ${limitHtml}
      ${coordsHtml}
      
      ${buttonsHtml}
      ${getPopupReviewsHtml(pin)}
    </div>
  `;
}

// Global Actions called from Map Popups

window.toggleVouchFromPopup = function(pinId) {
  if (!requireAuth()) return;
  const pin = State.spots.find(s => s.id === pinId);
  if (!pin) return;
  
  if (!pin.vouchedBy) pin.vouchedBy = [];
  const userName = State.currentUser.name;
  const alreadyVouched = pin.vouchedBy.includes(userName);
  
  if (alreadyVouched) {
    pin.vouchedBy = pin.vouchedBy.filter(u => u !== userName);
    pin.vouches = Math.max(0, (pin.vouches || 0) - 1);
  } else {
    pin.vouchedBy.push(userName);
    pin.vouches = (pin.vouches || 0) + 1;
  }
  
  saveStateToStorage();
  showToast(alreadyVouched ? "Removed vouch!" : "Vouched spot successfully!", "success");
  
  // Re-create the marker to update popup and customIcon styles
  const marker = State.leafletMarkersMap.get(pinId);
  if (marker) {
    State.leafletMap.removeLayer(marker);
    State.leafletMarkersMap.delete(pinId);
  }
  
  renderLeafletMarkers();
  
  const newMarker = State.leafletMarkersMap.get(pinId);
  if (newMarker) {
    newMarker.openPopup();
  }
};

window.markVisitedFromPopup = function(pinId) {
  if (!requireAuth()) return;
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  if (!currentUserObj) return;
  
  if (!currentUserObj.visitedSpots) currentUserObj.visitedSpots = [];
  const alreadyVisited = currentUserObj.visitedSpots.includes(pinId);
  
  if (alreadyVisited) {
    currentUserObj.visitedSpots = currentUserObj.visitedSpots.filter(id => id !== pinId);
    showToast("Spot removed from visited list.", "info");
  } else {
    currentUserObj.visitedSpots.push(pinId);
    showToast("Spot marked as visited!", "success");
  }
  
  State.currentUser.visitedSpots = currentUserObj.visitedSpots;
  saveStateToStorage();
  
  // Re-create the marker to update popup styles and customIcon borders/opacities
  const marker = State.leafletMarkersMap.get(pinId);
  if (marker) {
    State.leafletMap.removeLayer(marker);
    State.leafletMarkersMap.delete(pinId);
  }
  
  renderLeafletMarkers();
  
  const newMarker = State.leafletMarkersMap.get(pinId);
  if (newMarker) {
    newMarker.openPopup();
  }
};

window.plotRouteFromPopup = function(pinId) {
  const pin = [...State.spots, ...State.meetups].find(p => p.id === pinId);
  if (pin) {
    plotRouteToSpot(pin);
  }
};

window.shareSpotFromPopup = function(pinId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?spot=${pinId}`;
  navigator.clipboard.writeText(shareUrl);
  showToast("Share link copied to clipboard!", "success");
};

window.toggleRsvpFromPopup = function(meetupId) {
  if (!requireAuth()) return;
  toggleMeetupRsvp(meetupId);
  
  // Re-create the marker to update popup and customIcon attendee counts
  const marker = State.leafletMarkersMap.get(meetupId);
  if (marker) {
    State.leafletMap.removeLayer(marker);
    State.leafletMarkersMap.delete(meetupId);
  }
  
  renderLeafletMarkers();
  
  const newMarker = State.leafletMarkersMap.get(meetupId);
  if (newMarker) {
    newMarker.openPopup();
  }
};

window.shareMeetupFromPopup = function(meetupId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?meetup=${meetupId}`;
  navigator.clipboard.writeText(shareUrl);
  showToast("Meetup share link copied to clipboard!", "success");
};

window.bookDrivewayFromPopup = function(pinId) {
  if (!requireAuth()) return;
  const pin = State.spots.find(s => s.id === pinId);
  if (!pin) return;
  
  State.currentViewedSpotId = pinId;
  const price = pin.price || 15;
  
  document.getElementById('book-driveway-title').innerText = pin.title;
  document.getElementById('book-driveway-rate').innerText = `Rate: $${price}/night`;
  document.getElementById('book-nights').value = 1;
  document.getElementById('book-total-cost').innerText = `$${price}.00`;
  
  openModal('modal-book-driveway');
};

window.refreshPopup = function(pinId) {
  const marker = State.leafletMarkersMap.get(pinId);
  if (marker && marker.isPopupOpen()) {
    const pin = [...State.spots, ...State.meetups].find(p => p.id === pinId);
    if (pin) {
      marker.setPopupContent(getDetailedPopupHtml(pin));
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }
};

function getPopupReviewsHtml(pin) {
  const reviews = pin.reviews || [];
  let html = `<div style="border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px; max-height:120px; overflow-y:auto; text-align:left;">
    <strong style="font-size:11px; display:block; margin-bottom:4px; color:var(--text-charcoal);">Reviews & Comments (${reviews.length})</strong>`;
  
  if (reviews.length === 0) {
    html += `<div style="font-size:10px; color:var(--muted-text); font-style:italic;">No reviews yet. Be the first!</div>`;
  } else {
    reviews.forEach(r => {
      let stars = '';
      if (r.rating) {
        for (let i = 1; i <= 5; i++) {
          stars += i <= r.rating ? '★' : '☆';
        }
      }
      html += `
        <div style="font-size:10px; margin-bottom:6px; line-height:1.3; border-bottom:1px dashed var(--border-color); padding-bottom:4px; color:var(--text-main);">
          <div style="display:flex; justify-content:space-between;">
            <span style="font-weight:700;">${r.author || 'Nomad'}</span>
            <span style="color:#F59E0B;">${stars}</span>
          </div>
          <div style="color:var(--text-main); margin-top:1px;">${r.text}</div>
        </div>
      `;
    });
  }
  
  html += `</div>`;
  
  if (State.isSignedIn) {
    html += `
      <form onsubmit="window.submitPopupReview(event, '${pin.id}')" style="display:flex; gap:4px; margin-top:6px; align-items:center;">
        <input type="text" id="popup-review-text-${pin.id}" placeholder="Add comment..." style="flex-grow:1; font-size:10px; padding:4px 8px; border:1px solid var(--border-color); border-radius:12px; outline:none; background:var(--card-bg); color:var(--text-main);" required />
        <select id="popup-review-rating-${pin.id}" style="font-size:10px; padding:3px; border:1px solid var(--border-color); border-radius:4px; background:var(--card-bg); color:var(--text-main);">
          <option value="5">5★</option>
          <option value="4">4★</option>
          <option value="3">3★</option>
          <option value="2">2★</option>
          <option value="1">1★</option>
        </select>
        <button type="submit" class="btn btn-xs btn-primary" style="padding:4px 8px; font-size:10px; border-radius:12px; height:22px; display:inline-flex; align-items:center; justify-content:center;">Add</button>
      </form>
    `;
  } else {
    html += `<div style="font-size:9px; color:var(--muted-text); margin-top:4px; font-style:italic;">Sign in to leave a review.</div>`;
  }
  
  return html;
}

window.submitPopupReview = function(event, pinId) {
  event.preventDefault();
  if (!requireAuth()) return;
  
  const textInput = document.getElementById(`popup-review-text-${pinId}`);
  const ratingSelect = document.getElementById(`popup-review-rating-${pinId}`);
  if (!textInput) return;
  
  const text = textInput.value.trim();
  const rating = parseInt(ratingSelect ? ratingSelect.value : '5');
  if (!text) return;
  
  const pin = [...State.spots, ...State.meetups].find(p => p.id === pinId);
  if (pin) {
    if (!pin.reviews) pin.reviews = [];
    pin.reviews.unshift({
      id: `review-${Date.now()}`,
      author: State.currentUser.name,
      rating: rating,
      text: text,
      time: "Just now"
    });
    
    saveStateToStorage();
    showToast("Review submitted successfully!", "success");
    
    const marker = State.leafletMarkersMap.get(pinId);
    if (marker) {
      marker.setPopupContent(getDetailedPopupHtml(pin));
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }
};

