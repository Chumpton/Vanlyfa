/* ==========================================================================
   VANLYFA MAIN INITIALIZER & CONTROLLER - index.js
   ========================================================================== */

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Enforce sequential boot cycle on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize configuration, state, layouts, map pins, and component listeners
  initApp();
  
  // 2. Force Lucide icons rendering over finalized DOM elements
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
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

  const initialWelcomeModal = document.getElementById('welcome-modal');
  if (initialWelcomeModal) {
    if (hasDismissedWelcome()) {
      initialWelcomeModal.classList.remove('active', 'fading');
      initialWelcomeModal.style.display = 'none';
      
      // If they dismissed welcome but we haven't asked for GPS/signup yet, trigger it now!
      if (!hasAskedGps()) {
        requestOnboardingGeolocation();
      } else if (!hasEncouragedSignup()) {
        triggerSignupOnboardingOnce();
      }
    } else {
      initialWelcomeModal.classList.add('active');
      initialWelcomeModal.classList.remove('fading');
      initialWelcomeModal.style.display = 'flex';
    }
  }

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
  
  // Relayout map when top-bar scroll hide transition completes
  const topBar = document.querySelector('.top-bar');
  if (topBar) {
    topBar.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'margin-top' || e.propertyName === 'transform') {
        if (State.leafletMap) {
          State.leafletMap.invalidateSize();
        }
      }
    });
  }
  
  // Setup Search logic
  const searchInput = document.getElementById('global-search');
  searchInput.addEventListener('input', debounce((e) => {
    State.searchQuery = e.target.value.toLowerCase();
    renderCurrentTab();
  }, 250));

  // Marketplace Filter Listeners
  const marketCat = document.getElementById('market-filter-category');
  if (marketCat) marketCat.addEventListener('change', renderMarketplaceListings);
  
  const marketSort = document.getElementById('market-sort-price');
  if (marketSort) marketSort.addEventListener('change', renderMarketplaceListings);
  
  const marketZip = document.getElementById('market-filter-zip');
  if (marketZip) marketZip.addEventListener('input', renderMarketplaceListings);
  
  const marketRad = document.getElementById('market-filter-radius');
  if (marketRad) marketRad.addEventListener('change', renderMarketplaceListings);


  // Feed Filter Listeners
  const feedFilterArea = document.getElementById('feed-filter-area');
  if (feedFilterArea) feedFilterArea.addEventListener('change', () => { State._cachedFeeds = {}; renderFeedTabPosts(); });
  const feedFilterSort = document.getElementById('feed-filter-sort');
  if (feedFilterSort) feedFilterSort.addEventListener('change', () => { State._cachedFeeds = {}; renderFeedTabPosts(); });
  const feedFilterSaved = document.getElementById('feed-filter-saved');
  if (feedFilterSaved) feedFilterSaved.addEventListener('change', () => { State._cachedFeeds = {}; renderFeedTabPosts(); });

  // Meetup Filter Listeners
  const meetupFilterArea = document.getElementById('meetup-filter-area');
  if (meetupFilterArea) meetupFilterArea.addEventListener('change', renderMeetupsList);
  const meetupFilterSaved = document.getElementById('meetup-filter-saved');
  if (meetupFilterSaved) meetupFilterSaved.addEventListener('change', renderMeetupsList);

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

  // Bottom pane creation buttons
  const meetupCreateBtn = document.getElementById('meetup-create-btn');
  if (meetupCreateBtn) {
    meetupCreateBtn.addEventListener('click', () => handleTabCreateButton('modal-add-meetup'));
  }
  const forumCreateBtn = document.getElementById('forum-create-btn');
  if (forumCreateBtn) {
    forumCreateBtn.addEventListener('click', () => handleTabCreateButton('modal-add-thread'));
  }
  const marketCreateBtn = document.getElementById('market-create-btn');
  if (marketCreateBtn) {
    marketCreateBtn.addEventListener('click', () => handleTabCreateButton('modal-add-listing'));
  }
  const tribeCreateBtn = document.getElementById('tribe-create-btn');
  if (tribeCreateBtn) {
    tribeCreateBtn.addEventListener('click', () => handleTabCreateButton('modal-add-tribe'));
  }
  const jobCreateBtn = document.getElementById('job-create-btn');
  if (jobCreateBtn) {
    jobCreateBtn.addEventListener('click', () => handleTabCreateButton('modal-add-job'));
  }

  // Edit Profile - Rig section toggle
  const showRigCb = document.getElementById('edit-profile-show-rig');
  if (showRigCb) {
    showRigCb.addEventListener('change', (e) => {
      toggleEditProfileRigFields(e.target.checked);
    });
  }
  
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

  const postPhotoUpload = document.getElementById('post-photo-upload');
  if (postPhotoUpload) {
    postPhotoUpload.addEventListener('change', handlePostPhotoUpload);
  }

  const feedTabPhotoUpload = document.getElementById('feed-tab-photo-upload');
  if (feedTabPhotoUpload) {
    feedTabPhotoUpload.addEventListener('change', handleFeedTabPhotoUpload);
  }

  const threadPhotoUpload = document.getElementById('thread-photo-upload');
  if (threadPhotoUpload) {
    threadPhotoUpload.addEventListener('change', handleThreadPhotoUpload);
  }

  const tribeIconUpload = document.getElementById('tribe-icon-upload');
  if (tribeIconUpload) {
    tribeIconUpload.addEventListener('change', handleTribeIconUpload);
  }

  const tribeBannerUpload = document.getElementById('tribe-banner-upload');
  if (tribeBannerUpload) {
    tribeBannerUpload.addEventListener('change', handleTribeBannerUpload);
  }

  const meetupPhotoUpload = document.getElementById('meetup-photo-upload');
  if (meetupPhotoUpload) {
    meetupPhotoUpload.addEventListener('change', handleMeetupPhotoUpload);
  }

  // Formatting toolbar buttons click handlers
  document.querySelectorAll('.btn-format').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const format = btn.getAttribute('data-format');
      const targetId = btn.getAttribute('data-target') || 'post-text';
      const textarea = document.getElementById(targetId);
      if (!textarea) return;
      
      let startToken = '';
      let endToken = '';
      if (format === 'bold') {
        startToken = '**';
        endToken = '**';
      } else if (format === 'italic') {
        startToken = '*';
        endToken = '*';
      } else if (format === 'quote') {
        startToken = '\n> ';
        endToken = '\n';
      } else if (format === 'code') {
        startToken = '`';
        endToken = '`';
      }
      insertFormatting(textarea, startToken, endToken);
    });
  });

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
  
  // Mobile Top Avatar Popout Toggle
  const mobileTopAvatar = document.getElementById('mobile-top-avatar');
  const mobileProfilePopout = document.getElementById('mobile-profile-popout');
  if (mobileTopAvatar && mobileProfilePopout) {
    mobileTopAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileProfilePopout.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!mobileProfilePopout.contains(e.target) && e.target !== mobileTopAvatar) {
        mobileProfilePopout.classList.remove('open');
      }
    });
  }

  // Mobile popout action handlers
  const popoutProfileBtn = document.getElementById('mobile-popout-profile-btn');
  if (popoutProfileBtn) {
    popoutProfileBtn.addEventListener('click', () => {
      if (!requireAuth()) return;
      State.activeProfileName = null;
      switchTab('profile');
      if (mobileProfilePopout) mobileProfilePopout.classList.remove('open');
    });
  }

  const popoutThemeBtn = document.getElementById('mobile-popout-theme-btn');
  if (popoutThemeBtn) {
    popoutThemeBtn.addEventListener('click', () => {
      State.darkMode = !State.darkMode;
      document.body.classList.toggle('dark-mode', State.darkMode);
      localStorage.setItem('vanlyfa_dark_mode', State.darkMode);
      updateThemeToggleUI();
    });
  }

  const popoutConnBtn = document.getElementById('mobile-popout-conn-btn');
  if (popoutConnBtn) {
    popoutConnBtn.addEventListener('click', () => {
      State.isOffline = !State.isOffline;
      updateConnectionUI();
      if (!State.isOffline) {
        processSyncQueue();
      }
    });
  }

  const popoutAuthBtn = document.getElementById('mobile-popout-auth-btn');
  if (popoutAuthBtn) {
    popoutAuthBtn.addEventListener('click', () => {
      if (mobileProfilePopout) mobileProfilePopout.classList.remove('open');
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

  // Parse query parameters for sharing
  const params = new URLSearchParams(window.location.search);
  const sharedSpotId = params.get('spot');
  if (sharedSpotId) {
    setTimeout(() => {
      switchTab('dashboard');
      setTimeout(() => {
        const spot = State.spots.find(s => s.id === sharedSpotId);
        if (spot) {
          triggerInfoDrawerFromMap(sharedSpotId);
          if (State.leafletMap) {
            State.leafletMap.flyTo([spot.lat, spot.lng], 12);
          }
        }
      }, 500);
    }, 600);
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
  const sharedPostId = params.get('post');
  if (sharedPostId) {
    setTimeout(() => {
      switchTab('feed');
      setTimeout(() => {
        const card = document.getElementById(`post-card-${sharedPostId}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.transition = 'outline 0.3s ease, border 0.3s ease';
          card.style.outline = '3px solid var(--accent-green)';
          card.style.border = '1px solid var(--accent-green)';
          let isOutline = true;
          let blinks = 0;
          const interval = setInterval(() => {
            card.style.outline = isOutline ? '3px solid var(--accent-green)' : 'none';
            isOutline = !isOutline;
            blinks++;
            if (blinks > 6) {
              clearInterval(interval);
              card.style.outline = 'none';
            }
          }, 300);
        }
      }, 500);
    }, 600);
  }

  // Onboarding Welcome Modal Dismiss
  const welcomeDismissBtn = document.getElementById('welcome-dismiss-btn');
  const welcomeModal = document.getElementById('welcome-modal');
  if (welcomeDismissBtn && welcomeModal) {
    welcomeDismissBtn.addEventListener('click', () => {
      cacheWelcomeDismissal();
      ensureLocationCacheFallback();
      welcomeModal.classList.add('fading');
      setTimeout(() => {
        welcomeModal.classList.remove('active', 'fading');
        welcomeModal.style.display = 'none';
        requestOnboardingGeolocation();
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

          cacheLocationPresent(resolved.lat, resolved.lng, resolved.name || resolved.city || searchVal);
          
          showToast(`Centered on ${resolved.name || resolved.city}!`, "success");
          closeModal('modal-gps-input');
          
          if (State._onboardingLocationPending) {
            State._onboardingLocationPending = false;
            setTimeout(() => {
              triggerSignupOnboardingOnce();
            }, 800);
          }
        } else {
          showToast("Map is not initialized.", "error");
        }
      } else {
        showToast("Location not found. Try searching another city or zip.", "warning");
      }
    });
  }

  // Top-bar scroll disappear/re-appear listener for mobile
  document.querySelectorAll('.tab-content-pane').forEach(pane => {
    pane._lastScrollTop = 0;
    pane.addEventListener('scroll', (e) => {
      if (window.innerWidth <= 768) {
        const scrollTop = e.target.scrollTop;
        const topBar = document.querySelector('.top-bar');
        if (!topBar) return;
        
        const lastScroll = e.target._lastScrollTop || 0;
        
        // Threshold to prevent bounce artifacts
        if (Math.abs(lastScroll - scrollTop) <= 5) return;
        
        if (scrollTop > lastScroll && scrollTop > 64) {
          // Scroll Down - hide top-bar
          topBar.classList.add('hide-top-bar');
        } else {
          // Scroll Up - show top-bar
          topBar.classList.remove('hide-top-bar');
        }
        e.target._lastScrollTop = scrollTop;
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

  // Safety Agreement Checklist Verification
  const safetyChecks = document.querySelectorAll('.safety-check');
  const agreeBtn = document.getElementById('btn-agree-safety');
  if (agreeBtn) {
    safetyChecks.forEach(cb => {
      cb.addEventListener('change', () => {
        const allChecked = Array.from(safetyChecks).every(c => c.checked);
        agreeBtn.disabled = !allChecked;
        agreeBtn.style.opacity = allChecked ? '1' : '0.5';
      });
    });
    
    agreeBtn.addEventListener('click', () => {
      localStorage.setItem('vanlyfa_marketplace_agreed', 'true');
      closeModal('modal-market-safety');
      // Reset checkboxes
      safetyChecks.forEach(c => c.checked = false);
      agreeBtn.disabled = true;
      agreeBtn.style.opacity = '0.5';
      
      // Execute queued action
      if (typeof State._onMarketplaceSafetyAgreed === 'function') {
        State._onMarketplaceSafetyAgreed();
        State._onMarketplaceSafetyAgreed = null;
      }
    });
  }
}

function handleAuthSignIn(event) {
  event.preventDefault();
  const inputVal = document.getElementById('signin-email').value.trim();
  const passwordVal = document.getElementById('signin-password').value;
  
  if (!inputVal) return;
  
  // Normalizing input to match handle or name
  let searchName = inputVal.toLowerCase();
  if (searchName === 'bob') searchName = '@nomad_bob';
  if (searchName === 'clara') searchName = '@clara_outdoors';
  if (searchName === 'forest') searchName = '@forest_nomad';
  if (searchName === 'baja') searchName = '@baja_surfer';
  if (searchName === 'solar') searchName = '@solar_explorer';
  if (searchName === 'admin') searchName = '@admin';

  // Find user in database simulator
  let user = State.users.find(u => u.name.toLowerCase() === searchName || 
                                     u.handle.toLowerCase() === searchName ||
                                     u.handle.toLowerCase() === `@${searchName}`);
                                     
  // For testing convenience, if 'bob' or '@nomad_bob' doesn't exist in users yet, create him
  if (!user && (searchName === '@nomad_bob' || searchName === 'bob')) {
    user = {
      name: "Nomad Bob",
      handle: "@nomad_bob",
      avatar: "avatar_bob",
      bio: "Rig builder and highway traveler.",
      rig: "Camper Rig",
      solar: "200W Solar",
      power: "100Ah Lithium",
      water: "15 Gal Fresh",
      gallery: [],
      visitedSpots: [],
      friends: [],
      reputation: 5,
      givenRepTo: [],
      role: "user",
      instagram_handle: "nomad_bob",
      tiktok_handle: "nomad_bob",
      password: "NomadPass123!"
    };
    State.users.push(user);
    saveStateToStorage();
  }
  
  if (user) {
    // Password validation rules
    let expectedPassword = user.password;
    if (!expectedPassword) {
      if (user.handle === "@admin") expectedPassword = "AdminPass123!";
      else if (user.handle === "@clara_outdoors") expectedPassword = "ClaraPass123!";
      else if (user.handle === "@forest_nomad") expectedPassword = "ForestPass123!";
      else if (user.handle === "@baja_surfer") expectedPassword = "BajaPass123!";
      else if (user.handle === "@solar_explorer") expectedPassword = "SolarPass123!";
      else if (user.handle === "@nomad_bob") expectedPassword = "NomadPass123!";
      else expectedPassword = "password"; // Default fallback
    }
    
    if (user.banned) {
      showToast("Your account has been deactivated by an administrator.", "error");
      return;
    }
    
    if (passwordVal !== expectedPassword) {
      showToast("Incorrect password. Please try again.", "error");
      return;
    }
    
    State.currentUser = {
      name: user.name,
      handle: user.handle,
      avatar: user.avatar,
      bio: user.bio || "",
      showRigProfile: user.showRigProfile !== false,
      rig_desc: user.rig_desc || "",
      rig: user.rig || "",
      solar: user.solar || "",
      power: user.power || "",
      water: user.water || "",
      reputation: user.reputation || 0,
      givenRepTo: user.givenRepTo || [],
      role: user.role || "user",
      instagram_handle: user.instagram_handle || "",
      tiktok_handle: user.tiktok_handle || "",
      avatar_crop: user.avatar_crop || { x: 0, y: 0, zoom: 1 }
    };
    State.isSignedIn = true;
    saveStateToStorage();
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast(`Welcome back, ${user.name}! (${user.role})`, "success");
    
    // Check if admin to refresh UI tabs
    if (user.role === 'admin') {
      const adminTab = document.getElementById('sidebar-admin-tab');
      if (adminTab) adminTab.style.display = 'flex';
    } else {
      const adminTab = document.getElementById('sidebar-admin-tab');
      if (adminTab) adminTab.style.display = 'none';
    }
    
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
      showRigProfile: true,
      rig_desc: "",
      rig: "Camper Rig",
      solar: "200W Solar",
      power: "100Ah Lithium",
      water: "15 Gal Fresh",
      gallery: [],
      visitedSpots: [],
      friends: [],
      reputation: 3,
      givenRepTo: [],
      role: "user",
      instagram_handle: "",
      tiktok_handle: "",
      password: passwordVal || "password",
      avatar_crop: { x: 0, y: 0, zoom: 1 }
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
  
  const existingUser = State.users.find(u => u.name.toLowerCase() === username.toLowerCase() || u.handle.toLowerCase() === handle.toLowerCase());
  if (existingUser) {
    showToast("Username already exists. Please choose another or Sign In.", "error");
    return;
  }
  
  const newUser = {
    name: username,
    handle: handle,
    avatar: "avatar_bob",
    bio: bio,
    badgeTag: badgeTag,
    showRigProfile: true,
    rig_desc: "",
    rig: "Standard Camper",
    solar: "200W Solar",
    power: "100Ah AGM",
    water: "15 Gal Fresh",
    gallery: [],
    visitedSpots: [],
    friends: [],
    reputation: 5,
    givenRepTo: [],
    role: "user",
    instagram_handle: "",
    tiktok_handle: "",
    password: password,
    avatar_crop: { x: 0, y: 0, zoom: 1 }
  };
  
  State.users.push(newUser);
  State.currentUser = { ...newUser };
  State.isSignedIn = true;
  saveStateToStorage();
  updateSidebarProfileWidget();
  closeModal('modal-auth-required');
  showToast(`Welcome aboard, ${username}!`, "success");
  
  // Hide admin tab on fresh signup
  const adminTab = document.getElementById('sidebar-admin-tab');
  if (adminTab) adminTab.style.display = 'none';

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
  user.showRigProfile = document.getElementById('edit-profile-show-rig').checked;
  user.rig_desc = document.getElementById('edit-profile-rig-desc').value.trim();
  user.rig = document.getElementById('edit-profile-rig').value.trim() || user.rig;
  user.solar = document.getElementById('edit-profile-solar').value.trim() || user.solar;
  user.power = document.getElementById('edit-profile-power').value.trim() || user.power;
  user.water = document.getElementById('edit-profile-water').value.trim() || user.water;
  
  // Crop avatar processing
  const cropWorkspace = document.getElementById('avatar-crop-workspace');
  if (cropWorkspace && (cropWorkspace.style.display === 'flex' || cropWorkspace.style.display === 'block')) {
    const canvas = document.getElementById('avatar-crop-canvas');
    if (canvas && typeof drawCropImage === 'function') {
      // Draw image WITHOUT the helper circle border before export
      drawCropImage(canvas, false);
      const croppedDataUrl = compressCanvasToJpeg(canvas, 200);
      user.avatar = croppedDataUrl;
      State.currentUser.avatar = croppedDataUrl;
      
      // Store offsets
      if (typeof cropState !== 'undefined') {
        user.avatar_crop = { x: cropState.x, y: cropState.y, zoom: cropState.zoom };
        State.currentUser.avatar_crop = user.avatar_crop;
      }
      
      // Reset workspace
      cropWorkspace.style.display = 'none';
      document.getElementById('edit-profile-avatar-upload').value = '';
    }
  } else {
    user.avatar = State.currentUser.avatar;
  }
  
  // Social handles
  user.instagram_handle = document.getElementById('edit-profile-instagram').value.trim();
  user.tiktok_handle = document.getElementById('edit-profile-tiktok').value.trim();
  
  State.currentUser.name = newName;
  State.currentUser.bio = user.bio;
  State.currentUser.showRigProfile = user.showRigProfile;
  State.currentUser.rig_desc = user.rig_desc;
  State.currentUser.rig = user.rig;
  State.currentUser.solar = user.solar;
  State.currentUser.power = user.power;
  State.currentUser.water = user.water;
  State.currentUser.instagram_handle = user.instagram_handle;
  State.currentUser.tiktok_handle = user.tiktok_handle;
  
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
  
  const status = State.currentUser.role === 'admin' ? 'approved' : 'pending';
  
  const newSpot = {
    id: `spot-${Date.now()}`,
    title,
    category,
    lat,
    lng,
    description,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    vouches: 1,
    reviews: [],
    status
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
  
  const successMsg = status === 'approved' ? "Campsite vouched successfully!" : "Campsite submitted! Awaiting admin approval.";
  
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
    showToast(successMsg, "success");
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
  document.getElementById('spot-hosting-fields').style.display = 'none';
  
  closeModal('modal-add-spot');
}

function saveNewPost() {
  if (!requireAuth()) return;
  const content = document.getElementById('post-text').value.trim();
  
  if (!content) {
    showToast("Post content cannot be empty.", "error");
    return;
  }

  if (!checkRateLimit('post')) {
    showToast("Rate limit exceeded. You can only create 5 posts per hour.", "error");
    return;
  }
  
  let finalImage = null;
  if (State.postCropState.img) {
    const canvas = document.getElementById('post-crop-canvas');
    if (canvas) {
      drawGenericCrop(State.postCropState, canvas, false);
      finalImage = compressCanvasToJpeg(canvas);
    }
  }
  
  const loc = getCachedLocation();
  const newPost = {
    id: `post-${Date.now()}`,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    time: "Just now",
    content,
    image: finalImage,
    likes: 0,
    likedByUser: false,
    comments: [],
    status: State.currentUser.role === 'admin' ? 'approved' : 'pending',
    lat: loc && loc.status === 'present' ? loc.lat : null,
    lng: loc && loc.status === 'present' ? loc.lng : null
  };
  
  State.posts.unshift(newPost);
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('post-text').value = '';
  document.getElementById('post-photo-upload').value = '';
  const statusSpan = document.getElementById('post-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  const workspace = document.getElementById('post-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  State.postCropState = createCropObject();
  
  closeModal('modal-add-post');
  renderDashboardFeed();
  const successMsg = newPost.status === 'approved' ? "Update shared with community feed!" : "Post submitted! Awaiting admin approval.";
  showToast(successMsg, "success");
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
  
  if (!title || isNaN(price) || !location || !zip || !description) {
    showToast("Please fill out all listing fields, including Zip Code.", "error");
    return;
  }

  if (!checkRateLimit('marketplace')) {
    showToast("Rate limit exceeded. You can only create 3 marketplace listings per hour.", "error");
    return;
  }
  
  let finalImage = null;
  if (State.listingCropState.img) {
    const canvas = document.getElementById('list-crop-canvas');
    if (canvas) {
      drawGenericCrop(State.listingCropState, canvas, false);
      finalImage = compressCanvasToJpeg(canvas);
    }
  } else {
    showToast("Please upload a photo for your listing.", "error");
    return;
  }
  
  const coords = resolveZipCoordinates(zip) || { lat: 39.0, lng: -105.0 };
  
  const condition = category === 'services-offer' ? 'Service Offered' : 
                    (category === 'services-want' ? 'Service Wanted' : 'Good');
  
  const status = State.currentUser.role === 'admin' ? 'approved' : 'pending';
  
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
    image: finalImage,
    status
  };
  
  // Save listing using Backend Client Simulator
  Backend.createListing(newListing).then(() => {
    // Clean inputs
    document.getElementById('list-title').value = '';
    document.getElementById('list-price').value = '';
    document.getElementById('list-location').value = '';
    document.getElementById('list-zip').value = '';
    document.getElementById('list-desc').value = '';
    document.getElementById('list-photo-upload').value = '';
    
    const statusSpan = document.getElementById('list-photo-upload-status');
    if (statusSpan) statusSpan.innerText = '';
    const workspace = document.getElementById('list-crop-workspace');
    if (workspace) workspace.style.display = 'none';
    State.listingCropState = createCropObject();
    
    closeModal('modal-add-listing');
    
    const isService = category === 'services-offer' || category === 'services-want';
    const activeType = isService ? 'services' : 'items';
    if (typeof window.switchMarketplaceType === 'function') {
      window.switchMarketplaceType(activeType);
    } else {
      State.activeMarketplaceType = activeType;
      renderMarketplaceListings();
    }
    
    const successMsg = status === 'approved' ? "Marketplace listing published!" : "Listing submitted! Awaiting admin approval.";
    showToast(successMsg, "success");
  });
}

function saveNewTribe() {
  if (!requireAuth()) return;
  const title = document.getElementById('tribe-name-input').value.trim();
  const description = document.getElementById('tribe-desc-input').value.trim();
  const isPublic = document.getElementById('tribe-privacy-input').checked;
  
  if (!title || !description) {
    showToast("Please fill all tribe fields.", "error");
    return;
  }

  let finalIcon = null;
  if (State.tribeIconCropState.img) {
    const canvas = document.getElementById('tribe-icon-crop-canvas');
    if (canvas) {
      drawGenericCrop(State.tribeIconCropState, canvas, false);
      finalIcon = compressCanvasToJpeg(canvas, 200);
    }
  } else {
    showToast("Please upload a tribe profile icon.", "error");
    return;
  }

  let finalBanner = null;
  if (State.tribeBannerCropState.img) {
    const canvas = document.getElementById('tribe-banner-crop-canvas');
    if (canvas) {
      drawGenericCrop(State.tribeBannerCropState, canvas, false);
      finalBanner = compressCanvasToJpeg(canvas, 1000);
    }
  } else {
    showToast("Please upload a tribe banner image.", "error");
    return;
  }
  
  const newTribe = {
    id: `tribe-${Date.now()}`,
    title,
    membersCount: 1,
    banner: finalBanner,
    icon: finalIcon,
    iconLetter: title.substring(0, 2).toUpperCase(),
    description,
    isPublic,
    joined: true,
    category: "Interest",
    state: "CA",
    ideal: "Off-grid / Boondocking"
  };
  
  State.tribes.push(newTribe);
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('tribe-name-input').value = '';
  document.getElementById('tribe-desc-input').value = '';
  document.getElementById('tribe-privacy-input').checked = true;
  document.getElementById('tribe-icon-upload').value = '';
  document.getElementById('tribe-banner-upload').value = '';
  
  const iconStatus = document.getElementById('tribe-icon-upload-status');
  if (iconStatus) iconStatus.innerText = '';
  const bannerStatus = document.getElementById('tribe-banner-upload-status');
  if (bannerStatus) bannerStatus.innerText = '';
  
  const iconWorkspace = document.getElementById('tribe-icon-crop-workspace');
  if (iconWorkspace) iconWorkspace.style.display = 'none';
  const bannerWorkspace = document.getElementById('tribe-banner-crop-workspace');
  if (bannerWorkspace) bannerWorkspace.style.display = 'none';
  
  State.tribeIconCropState = createCropObject();
  State.tribeBannerCropState = createCropObject();
  
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
  
  const status = State.currentUser.role === 'admin' ? 'approved' : 'pending';
  
  // Extract meetup thumbnail from canvas
  let thumbnail = 'none';
  const workspace = document.getElementById('meetup-crop-workspace');
  if (workspace && workspace.style.display !== 'none') {
    const canvas = document.getElementById('meetup-crop-canvas');
    if (canvas) {
      thumbnail = canvas.toDataURL('image/jpeg', 0.85);
    }
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
    attendees: [State.currentUser.avatar || 'avatar_bob'],
    attendeesCount: 1,
    comments: [],
    thumbnail,
    status
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
  
  // Clean photo workspace
  if (workspace) workspace.style.display = 'none';
  const fileInput = document.getElementById('meetup-photo-upload');
  if (fileInput) fileInput.value = '';
  const statusSpan = document.getElementById('meetup-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  State.meetupCropState = createCropObject();
  
  closeModal('modal-add-meetup');
  renderMeetupsList();
  
  const successMsg = status === 'approved' ? "Meetup hosted and pinned on global map!" : "Meetup submitted! Awaiting admin approval.";
  showToast(successMsg, "success");
}

function saveNewForumThread() {
  if (!requireAuth()) return;
  const title = document.getElementById('thread-title-input').value.trim();
  const category = document.getElementById('thread-cat-select').value;
  const body = document.getElementById('thread-body-input').value.trim();
  
  if (!title || !body) {
    showToast("Please fill out thread title and body content.", "error");
    return;
  }

  let finalImage = null;
  if (State.threadCropState.img) {
    const canvas = document.getElementById('thread-crop-canvas');
    if (canvas) {
      drawGenericCrop(State.threadCropState, canvas, false);
      finalImage = compressCanvasToJpeg(canvas);
    }
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
    image: finalImage,
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
  document.getElementById('thread-cat-select').value = 'general';
  document.getElementById('thread-body-input').value = '';
  document.getElementById('thread-photo-upload').value = '';
  
  const statusSpan = document.getElementById('thread-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  const workspace = document.getElementById('thread-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  State.threadCropState = createCropObject();
  
  closeModal('modal-add-thread');
  renderForumView();
}

function saveNewFeedTabPost() {
  if (!requireAuth()) return;
  const content = document.getElementById('feed-tab-post-text').value.trim();
  
  if (!content) {
    showToast("Post content cannot be empty.", "error");
    return;
  }

  if (!checkRateLimit('post')) {
    showToast("Rate limit exceeded. You can only create 5 posts per hour.", "error");
    return;
  }
  
  let finalImage = null;
  if (State.feedTabCropState.img) {
    const canvas = document.getElementById('feed-tab-crop-canvas');
    if (canvas) {
      drawGenericCrop(State.feedTabCropState, canvas, false);
      finalImage = compressCanvasToJpeg(canvas);
    }
  }
  
  const status = State.currentUser.role === 'admin' ? 'approved' : 'pending';
  const loc = getCachedLocation();
  
  const newPost = {
    id: `post-${Date.now()}`,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    time: "Just now",
    content,
    image: finalImage,
    likes: 0,
    likedByUser: false,
    comments: [],
    status,
    lat: loc && loc.status === 'present' ? loc.lat : null,
    lng: loc && loc.status === 'present' ? loc.lng : null
  };
  
  State.posts.unshift(newPost);
  State._cachedFeeds = {};
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('feed-tab-post-text').value = '';
  document.getElementById('feed-tab-photo-upload').value = '';
  const statusSpan = document.getElementById('feed-tab-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  const workspace = document.getElementById('feed-tab-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  State.feedTabCropState = createCropObject();
  
  renderDashboardFeed();
  renderFeedTabPosts();
  
  const successMsg = status === 'approved' ? "Update shared with community feed!" : "Post submitted! Awaiting admin approval.";
  showToast(successMsg, "success");
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

function requestOnboardingGeolocation() {
  if (hasAskedGps()) return;
  cacheGpsAsked();

  if (!navigator.geolocation) {
    console.warn("Geolocation not supported by browser.");
    openModal('modal-gps-input');
    State._onboardingLocationPending = true;
    return;
  }
  
  const optionsHigh = { enableHighAccuracy: true, timeout: 4000 };
  const optionsLow = { enableHighAccuracy: false, timeout: 5000 };
  
  const handleSuccess = (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    cacheLocationPresent(lat, lng, 'My Geolocation');
    
    if (State.leafletMap) {
      State.leafletMap.flyTo([lat, lng], 12);
      
      if (State.gpsMarker) {
        State.gpsMarker.setLatLng([lat, lng]);
      } else if (typeof L !== 'undefined') {
        const gpsIcon = L.divIcon({
          className: 'gps-location-pin',
          html: '<div class="gps-pin-dot"></div><div class="gps-pin-pulse"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        State.gpsMarker = L.marker([lat, lng], { icon: gpsIcon })
          .addTo(State.leafletMap)
          .bindPopup("<strong>Your Location</strong>");
      }
    }
    showToast("Location updated from browser GPS!", "success");
    
    setTimeout(() => {
      triggerSignupOnboardingOnce();
    }, 800);
  };
  
  const tryLowAccuracy = () => {
    console.log("High accuracy GPS failed/timed out, trying low-accuracy fallback...");
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (error) => {
        console.warn("Low accuracy Geolocation failed/denied:", error);
        openModal('modal-gps-input');
        State._onboardingLocationPending = true;
      },
      optionsLow
    );
  };

  navigator.geolocation.getCurrentPosition(
    handleSuccess,
    (error) => {
      if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
        tryLowAccuracy();
      } else {
        console.warn("Geolocation permission denied:", error);
        openModal('modal-gps-input');
        State._onboardingLocationPending = true;
      }
    },
    optionsHigh
  );
}

function triggerSignupOnboardingOnce() {
  if (!hasEncouragedSignup()) {
    cacheSignupEncouraged();
    switchAuthTab('signup');
    openModal('modal-auth-required');
  }
}

function insertFormatting(textarea, startToken, endToken) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  const replacement = startToken + selectedText + endToken;
  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  
  textarea.focus();
  textarea.selectionStart = start + startToken.length;
  textarea.selectionEnd = start + startToken.length + selectedText.length;
}

function handleTabCreateButton(modalId) {
  if (!requireAuth()) return;
  
  if (modalId === 'modal-add-listing') {
    if (localStorage.getItem('vanlyfa_marketplace_agreed') !== 'true') {
      State._onMarketplaceSafetyAgreed = () => {
        openModal('modal-add-listing');
      };
      openModal('modal-market-safety');
      return;
    }
  }
  openModal(modalId);
}
