/* ==========================================================================
   VANLYFA MAIN INITIALIZER & CONTROLLER - index.js
   ========================================================================== */

// Initialize lucide icons on load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
function initApp() {
  // One-time localStorage migration to clear out old mock data caches for Supabase prep
  if (!localStorage.getItem('vanlyfa_supabase_prep_v1')) {
    localStorage.removeItem('vanlyfa_state');
    localStorage.setItem('vanlyfa_supabase_prep_v1', 'true');
  }

  // Load saved state
  loadStateFromStorage();
  
  // Read saved theme
  const savedDarkVal = localStorage.getItem('vanlyfa_dark_mode');
  if (savedDarkVal === null || savedDarkVal === 'true') {
    State.darkMode = true;
    document.body.classList.add('dark-mode');
  } else {
    State.darkMode = false;
    document.body.classList.remove('dark-mode');
  }
  updateThemeToggleUI();

  // Render sidebar profile details
  updateSidebarProfileWidget();
  
  // Set up click handlers for Tab navigation
  document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      if (!tab) return;
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
  
  // Drawer Vouch Button
  const vouchBtn = document.getElementById('drawer-vouch-btn');
  if (vouchBtn) {
    vouchBtn.addEventListener('click', () => {
      if (State.currentViewedSpotId) {
        toggleVouchSpot(State.currentViewedSpotId);
      }
    });
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
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      closeMobileDrawer();
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
    if (!State.isSignedIn) {
      openModal('modal-auth-required');
      return;
    }
    State.activeProfileName = null;
    switchTab('profile');
  });

  // Sidebar dynamic auth button toggle
  const authBtn = document.getElementById('sidebar-auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering parent profile nav click
      if (State.isSignedIn) {
        State.isSignedIn = false;
        saveStateToStorage();
        updateSidebarProfileWidget();
        showToast("Signed out successfully. Browsing as Guest.", "info");
        switchTab('dashboard');
      } else {
        openModal('modal-auth-required');
      }
    });
  }
  
  // Initial render
  switchTab('dashboard');
  renderContactsSidebar();
  renderActiveChats();

  // Parse query parameters for spot or meetup sharing
  const params = new URLSearchParams(window.location.search);
  const sharedSpotId = params.get('spot');
  if (sharedSpotId) {
    const spot = State.spots.find(s => s.id === sharedSpotId);
    if (spot) {
      setTimeout(() => {
        openInfoDrawerForSpot(spot);
      }, 600);
    }
  }
  const sharedMeetupId = params.get('meetup');
  if (sharedMeetupId) {
    setTimeout(() => {
      switchTab('meetups');
      setTimeout(() => {
        const card = document.getElementById(`meetup-card-${sharedMeetupId}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth' });
          card.style.border = '2px solid var(--accent-green)';
        }
      }, 400);
    }, 600);
  }

  // Onboarding Welcome Modal Dismiss
  const welcomeDismissBtn = document.getElementById('welcome-dismiss-btn');
  const welcomeModal = document.getElementById('welcome-modal');
  if (welcomeDismissBtn && welcomeModal) {
    welcomeDismissBtn.addEventListener('click', () => {
      welcomeModal.classList.add('fading');
      setTimeout(() => {
        welcomeModal.classList.remove('active', 'fading');
        welcomeModal.style.display = 'none';
        switchAuthTab('signup');
        openModal('modal-auth-required');
      }, 300);
    });
  }
  
  // Initialize Leaflet Map
  initLeafletMap();

  // Populate GPS Cities Datalist
  const datalist = document.getElementById('gps-cities-list');
  if (datalist && typeof US_CITIES_DATABASE !== 'undefined') {
    datalist.innerHTML = US_CITIES_DATABASE.map(city => 
      `<option value="${city.name}"></option>`
    ).join('');
  }

  // Handle GPS location search submission
  const gpsSubmitBtn = document.getElementById('gps-submit-btn');
  if (gpsSubmitBtn) {
    gpsSubmitBtn.addEventListener('click', () => {
      const searchVal = document.getElementById('gps-city-search').value.trim();
      if (!searchVal) {
        showToast("Please enter a city name or zip code.", "warning");
        return;
      }
      
      // Try to resolve searchVal using US_CITIES_DATABASE or ZIP_DATABASE
      let resolved = null;
      if (typeof US_CITIES_DATABASE !== 'undefined') {
        resolved = US_CITIES_DATABASE.find(c => 
          c.name.toLowerCase().includes(searchVal.toLowerCase()) || 
          c.zip === searchVal
        );
      }
      
      // Fallback: check general ZIP_DATABASE
      if (!resolved && typeof ZIP_DATABASE !== 'undefined') {
        resolved = ZIP_DATABASE[searchVal];
      }
      
      // Fallback 2: parse mock zip coordinates if 5-digit number
      if (!resolved && typeof resolveZipCoordinates === 'function') {
        resolved = resolveZipCoordinates(searchVal);
      }
      
      if (resolved) {
        if (typeof State !== 'undefined' && State.leafletMap) {
          State.leafletMap.flyTo([resolved.lat, resolved.lng], 12);
          
          // Drop a pulsing marker
          if (State.gpsMarker) {
            State.gpsMarker.setLatLng([resolved.lat, resolved.lng]);
          } else if (typeof L !== 'undefined') {
            const gpsIcon = L.divIcon({
              className: 'gps-location-pin',
              html: '<div class="gps-pin-dot"></div><div class="gps-pin-pulse"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            State.gpsMarker = L.marker([resolved.lat, resolved.lng], { icon: gpsIcon })
              .addTo(State.leafletMap)
              .bindPopup("<strong>Your Location</strong>");
          }
          
          showToast(`Centered on ${resolved.name || resolved.city}!`, "success");
          closeModal('modal-gps-input');
        } else {
          showToast("Map is not initialized.", "error");
        }
      } else {
        showToast("Location not found. Try searching another city or zip.", "warning");
      }
    });
  }

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
    // If about modal is open, close it
    const aboutModal = document.getElementById('modal-about');
    if (aboutModal && aboutModal.classList.contains('open')) {
      closeModal('modal-about');
      return;
    }

    // If auth modal is open, close it
    const authModal = document.getElementById('modal-auth-required');
    if (authModal && authModal.classList.contains('open')) {
      closeModal('modal-auth-required');
      return;
    }

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

  // Connection Status Toggler
  const connectionBtn = document.getElementById('connection-status-btn');
  if (connectionBtn) {
    connectionBtn.addEventListener('click', () => {
      State.isOffline = !State.isOffline;
      updateConnectionUI();
      if (!State.isOffline) {
        processSyncQueue();
      }
    });
  }

  // Browser Network Events
  window.addEventListener('online', () => {
    State.isOffline = false;
    updateConnectionUI();
    processSyncQueue();
  });
  window.addEventListener('offline', () => {
    State.isOffline = true;
    updateConnectionUI();
  });

  // Load Initial Status
  State.isOffline = !navigator.onLine;
  updateConnectionUI();
}

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

function handleAuthSignIn(event) {
  event.preventDefault();
  const inputVal = document.getElementById('signin-email').value.trim();
  
  if (!inputVal) return;
  
  // Find user in database simulator
  const user = State.users.find(u => u.name.toLowerCase() === inputVal.toLowerCase() || 
                                      u.handle.toLowerCase() === inputVal.toLowerCase() ||
                                      u.handle.toLowerCase() === `@${inputVal.toLowerCase()}`);
  
  if (user) {
    State.currentUser = {
      name: user.name,
      handle: user.handle,
      avatar: user.avatar,
      bio: user.bio || "",
      rig: user.rig || "",
      solar: user.solar || "",
      power: user.power || "",
      water: user.water || "",
      reputation: user.reputation || 0,
      givenRepTo: user.givenRepTo || []
    };
    State.isSignedIn = true;
    saveStateToStorage();
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast(`Signed in as ${user.name}!`, "success");
    renderCurrentTab();
  } else {
    // Autocreate account for convenience in mockup
    const newUsername = inputVal;
    const newHandle = `@${inputVal.replace(/\s+/g, '_').toLowerCase()}`;
    const newUser = {
      name: newUsername,
      handle: newHandle,
      avatar: "avatar_bob",
      bio: "Living the dream on four wheels.",
      rig: "Camper Rig",
      solar: "200W Solar",
      power: "100Ah Lithium",
      water: "15 Gal Fresh",
      gallery: [],
      visitedSpots: [],
      friends: [],
      reputation: 3,
      givenRepTo: []
    };
    State.users.push(newUser);
    State.currentUser = { ...newUser };
    State.isSignedIn = true;
    saveStateToStorage();
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast(`Signed up and logged in as ${newUsername}!`, "success");
    renderCurrentTab();
  }
}

function handleAuthSignUp(event) {
  event.preventDefault();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const bio = document.getElementById('signup-bio').value.trim() || "New nomad on the road.";
  const badgeTag = "Nomad";
  
  if (!username) return;
  const handle = `@${username.replace(/\s+/g, '_').toLowerCase()}`;
  
  const existingUser = State.users.find(u => u.name.toLowerCase() === username.toLowerCase());
  if (existingUser) {
    showToast("Username already exists. Signed in to existing account.", "info");
    State.currentUser = { ...existingUser };
    State.isSignedIn = true;
    saveStateToStorage();
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    renderCurrentTab();
    return;
  }
  
  const newUser = {
    name: username,
    handle: handle,
    avatar: "avatar_bob",
    bio: bio,
    badgeTag: badgeTag,
    rig: "Standard Camper",
    solar: "200W Solar",
    power: "100Ah AGM",
    water: "15 Gal Fresh",
    gallery: [],
    visitedSpots: [],
    friends: [],
    reputation: 5,
    givenRepTo: []
  };
  
  State.users.push(newUser);
  State.currentUser = { ...newUser };
  State.isSignedIn = true;
  saveStateToStorage();
  updateSidebarProfileWidget();
  closeModal('modal-auth-required');
  showToast(`Welcome aboard, ${username}!`, "success");
  renderCurrentTab();
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
    vouches: 1,
    reviews: []
  };
  
  if (category === 'driveway-host') {
    newSpot.price = parseFloat(document.getElementById('spot-fee').value) || 15;
    newSpot.amenities = {
      power: document.getElementById('amenity-power').checked,
      water: document.getElementById('amenity-water').checked,
      wifi: document.getElementById('amenity-wifi').checked,
      pets: document.getElementById('amenity-pets').checked
    };
  }
  
  if (State.isOffline) {
    newSpot.pendingSync = true;
    State.spots.push(newSpot);
    State.syncQueue.push({ type: 'CREATE_SPOT', payload: newSpot });
    saveStateToStorage();
    updateConnectionUI();
    showToast("Offline mode: campsite queued for sync!", "warning");
  } else {
    State.spots.push(newSpot);
    saveStateToStorage();
    showToast("Campsite vouched successfully!", "success");
  }
  
  // Reload maps
  renderLeafletMarkers();
  
  // Clean inputs
  document.getElementById('spot-title').value = '';
  document.getElementById('spot-lat').value = '';
  document.getElementById('spot-lng').value = '';
  document.getElementById('spot-desc').value = '';
  document.getElementById('spot-fee').value = '0';
  document.getElementById('amenity-power').checked = false;
  document.getElementById('amenity-water').checked = false;
  document.getElementById('amenity-wifi').checked = false;
  document.getElementById('amenity-pets').checked = false;
  document.getElementById('spot-moochdocking-fields').style.display = 'none';
  
  closeModal('modal-add-spot');
}

function saveNewPost() {
  if (!requireAuth()) return;
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

function saveNewListing() {
  if (!requireAuth()) return;
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

function saveNewTribe() {
  if (!requireAuth()) return;
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

function saveNewMeetup() {
  if (!requireAuth()) return;
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

function saveNewForumThread() {
  if (!requireAuth()) return;
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
  
  if (State.isOffline) {
    newThread.pendingSync = true;
    State.forum.unshift(newThread);
    State.syncQueue.push({ type: 'CREATE_THREAD', payload: newThread });
    saveStateToStorage();
    updateConnectionUI();
    showToast("Offline mode: thread queued for sync!", "warning");
  } else {
    State.forum.unshift(newThread);
    saveStateToStorage();
    showToast("Thread published to discussion board!", "success");
  }
  
  State.activeForumCategory = 'all'; // reset to all to see the new thread
  
  // Clean inputs
  document.getElementById('thread-title-input').value = '';
  document.getElementById('thread-cat-input').value = '';
  document.getElementById('thread-body-input').value = '';
  
  closeModal('modal-add-thread');
  renderForumView();
}

function saveNewFeedTabPost() {
  if (!requireAuth()) return;
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
  State._cachedFeeds = {};
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('feed-tab-post-text').value = '';
  document.getElementById('feed-tab-post-img-select').value = 'none';
  
  renderDashboardFeed();
  renderFeedTabPosts();
  showToast("Update shared with community feed!", "success");
}
function switchAuthTab(tab) {
  const btnSignin = document.getElementById('auth-tab-signin');
  const btnSignup = document.getElementById('auth-tab-signup');
  const formSignin = document.getElementById('auth-form-signin');
  const formSignup = document.getElementById('auth-form-signup');
  
  if (!btnSignin || !btnSignup || !formSignin || !formSignup) return;
  
  if (tab === 'signin') {
    btnSignin.classList.add('active');
    btnSignin.style.background = 'var(--card-bg)';
    btnSignin.style.color = 'var(--text-main)';
    btnSignin.style.boxShadow = 'var(--shadow-sm)';
    
    btnSignup.classList.remove('active');
    btnSignup.style.background = 'transparent';
    btnSignup.style.color = 'var(--muted-text)';
    btnSignup.style.boxShadow = 'none';
    
    formSignin.style.display = 'flex';
    formSignup.style.display = 'none';
  } else {
    btnSignup.classList.add('active');
    btnSignup.style.background = 'var(--card-bg)';
    btnSignup.style.color = 'var(--text-main)';
    btnSignup.style.boxShadow = 'var(--shadow-sm)';
    
    btnSignin.classList.remove('active');
    btnSignin.style.background = 'transparent';
    btnSignin.style.color = 'var(--muted-text)';
    btnSignin.style.boxShadow = 'none';
    
    formSignup.style.display = 'flex';
    formSignin.style.display = 'none';
  }
}
/* ==========================================================================
   Bridge functions for onclick handlers in view.js
   ========================================================================== */

function viewSpotFromProfile(spotId) {
  switchTab('dashboard');
  setTimeout(() => {
    const spot = State.spots.find(s => s.id === spotId);
    if (spot) openInfoDrawerForSpot(spot);
  }, 400);
}

function triggerInfoDrawerFromMap(pinId) {
  const pin = State.spots.find(s => s.id === pinId);
  if (pin) openInfoDrawerForSpot(pin);
}
