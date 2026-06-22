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
  let markerColor = '#3B7A57';
  let typeName = 'Wild Camping';
  if (pin.category === 'dispersed_campsite') { markerColor = '#228B22'; typeName = 'Dispersed Campsite'; }
  else if (pin.category === 'driveway-host') { markerColor = '#6E6A5F'; typeName = 'Driveway Host'; }
  else if (pin.category === 'water-station') { markerColor = '#A2BEA9'; typeName = 'Water Station'; }
  else if (pin.category === 'service-mechanic') { markerColor = '#2D2D2D'; typeName = 'Van Mechanic'; }
  else if (pin.category === 'walmart') { markerColor = '#0071CE'; typeName = 'Walmart Overnight'; }
  else if (pin.category === 'cracker_barrel') { markerColor = '#8B4513'; typeName = 'Cracker Barrel'; }
  else if (pin.category === 'rest_area') { markerColor = '#6B7280'; typeName = 'Rest Area'; }
  else if (pin.category === 'propane') { markerColor = '#F97316'; typeName = 'Propane Refill'; }
  else if (pin.category === 'cluster') { markerColor = '#8B5CF6'; typeName = 'Cluster'; }
  else if (!pin.category) { markerColor = '#D55E00'; typeName = 'Nomad Meetup'; }
  return { markerColor, typeName };
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

function renderLeafletMarkers() {
  if (!State.leafletMap) return;
  
  const zoom = State.leafletMap.getZoom();
  const bounds = State.leafletMap.getBounds();
  
  // Use ClusterEngine for seed spots (zoom-aware)
  let visibleSeeded = [];
  if (typeof ClusterEngine !== 'undefined' && ClusterEngine.allSpots.length > 0) {
    visibleSeeded = ClusterEngine.getVisibleSpots(bounds, zoom);
  }
  
  // Combine user-created spots (non-seeded) + meetups + clustered seed spots
  const userSpots = State.spots.filter(s => !s.seeded);
  const pins = [...userSpots, ...visibleSeeded, ...State.meetups];
  
  // De-duplicate by id
  const seen = new Set();
  const nextPinsMap = new Map();
  
  pins.forEach(pin => {
    if (seen.has(pin.id)) return;
    seen.add(pin.id);
    
    // Layer filter check
    if (!shouldShowByLayerFilter(pin)) return;
    
    // Check if pins match global search query
    const query = State.searchQuery;
    const matchesQuery = pin.title.toLowerCase().includes(query) || 
                         (pin.description && pin.description.toLowerCase().includes(query));
    if (!matchesQuery) return;
    
    nextPinsMap.set(pin.id, pin);
  });

  // Track map markers in State using a Map of pinId -> marker object
  if (!State.leafletMarkersMap) {
    State.leafletMarkersMap = new Map();
  }

  // Remove markers that are no longer visible
  for (const [pinId, marker] of State.leafletMarkersMap.entries()) {
    if (!nextPinsMap.has(pinId)) {
      State.leafletMap.removeLayer(marker);
      State.leafletMarkersMap.delete(pinId);
    }
  }

  // Add or update markers
  for (const [pinId, pin] of nextPinsMap.entries()) {
    if (State.leafletMarkersMap.has(pinId)) {
      // Marker already exists on map, leave it untouched to preserve open popups
      continue;
    }

    const { markerColor, typeName } = getMarkerMeta(pin);
    let marker;

    // Cluster marker (larger, with count)
    if (pin._isCluster) {
      const count = pin._clusterCount;
      const size = Math.min(18 + Math.log2(count) * 6, 44);
      const customIcon = L.divIcon({
        html: `<div style="background:linear-gradient(135deg, #228B22, #10b981); width:${size}px; height:${size}px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-weight:800; font-size:${Math.max(10, size/3.2)}px; font-family:Inter,sans-serif;">${count}</div>`,
        className: 'custom-map-icon cluster-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
      marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(State.leafletMap);
      marker.on('click', () => {
        State.leafletMap.setView([pin.lat, pin.lng], zoom + 2);
      });
    } else {
      // Standard single-spot marker
      const borderStyle = pin.pendingSync ? '2px dashed var(--accent-red)' : '2px solid white';
      const opacityStyle = pin.pendingSync ? '0.7' : '1.0';
      const verifiedDot = pin.verified ? '<div style="position:absolute;top:-2px;right:-2px;width:7px;height:7px;background:#10b981;border-radius:50%;border:1px solid white;"></div>' : '';
      const customIcon = L.divIcon({
        html: `<div style="position:relative;background-color:${markerColor}; width:20px; height:20px; border-radius:50%; border:${borderStyle}; opacity:${opacityStyle}; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
                <div style="background-color:white; width:6px; height:6px; border-radius:50%;"></div>
                ${verifiedDot}
               </div>`,
        className: 'custom-map-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(State.leafletMap);
      
      // Custom popup
      const popupHtml = `
        <div class="custom-map-popup-badge" style="background:${markerColor}1A; color:${markerColor};">${typeName}</div>
        <div class="custom-map-popup-header">${pin.title}${pin.pendingSync ? ' <span style="font-size:9px; color:var(--accent-red); font-weight:bold; margin-left:4px;">(Syncing...)</span>' : ''}${pin.verified ? ' <span style="color:#10b981;font-size:11px;" title="Verified">✓</span>' : ''}</div>
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
    }
    
    State.leafletMarkersMap.set(pinId, marker);
  }

  // Keep State.mapMarkers synchronized for backwards-compatibility
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
  document.getElementById('drawer-coords').innerText = `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`;
  
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
    plotRouteToSpot(pin);
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

function toggleSpotMoochdockingFields() {
  const category = document.getElementById('spot-category').value;
  const moochFields = document.getElementById('spot-moochdocking-fields');
  if (moochFields) {
    moochFields.style.display = category === 'driveway-host' ? 'flex' : 'none';
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
