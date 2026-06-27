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


  // Feed Filter Listeners (Chips)
  State.feedFilterArea = State.feedFilterArea || 'all';
  State.feedFilterSort = State.feedFilterSort || 'trending';
  State.feedFilterSaved = State.feedFilterSaved || 'all';

  document.querySelectorAll('.filter-chip').forEach(chip => {
    const type = chip.getAttribute('data-filter-type');
    const val = chip.getAttribute('data-value');
    const activeVal = type === 'area' ? State.feedFilterArea : 
                      (type === 'sort' ? State.feedFilterSort : State.feedFilterSaved);
    if (val === activeVal) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }

    chip.addEventListener('click', (e) => {
      const typeAttr = e.currentTarget.getAttribute('data-filter-type');
      const valAttr = e.currentTarget.getAttribute('data-value');
      
      document.querySelectorAll(`.filter-chip[data-filter-type="${typeAttr}"]`).forEach(btn => {
        btn.classList.remove('active');
      });
      e.currentTarget.classList.add('active');
      
      if (typeAttr === 'area') State.feedFilterArea = valAttr;
      else if (typeAttr === 'sort') State.feedFilterSort = valAttr;
      else if (typeAttr === 'saved') State.feedFilterSaved = valAttr;
      
      saveStateToStorage();
      State._cachedFeeds = {};
      renderFeedTabPosts();
    });
  });

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

  // Formatting toolbar buttons click handlers (delegated to .app-content to avoid leaks)
  const appContent = document.querySelector('.app-content');
  if (appContent) {
    appContent.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-format');
      if (!btn) return;
      
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
      } else if (format === 'link') {
        startToken = '[';
        endToken = '](url)';
      } else if (format === 'strikethrough') {
        startToken = '~~';
        endToken = '~~';
      } else if (format === 'quote') {
        startToken = '\n> ';
        endToken = '\n';
      } else if (format === 'code') {
        startToken = '`';
        endToken = '`';
      }
      insertFormatting(textarea, startToken, endToken);
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

  // Mobile More Options Bubble Toggle
  const moreClickArea = document.getElementById('more-click-area');
  const moreOptionsBubble = document.getElementById('more-options-bubble');
  if (moreClickArea && moreOptionsBubble) {
    moreClickArea.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = moreOptionsBubble.style.display === 'none' || moreOptionsBubble.style.display === '';
      moreOptionsBubble.style.display = isHidden ? 'flex' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!moreOptionsBubble.contains(e.target) && e.target !== moreClickArea) {
        moreOptionsBubble.style.display = 'none';
      }
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
        
        const sidebar = document.querySelector('.app-sidebar');
        const fab = document.getElementById('mobile-action-fab');

        if (scrollTop > lastScroll && scrollTop > 64) {
          // Scroll Down - hide top-bar & bottom navigation
          topBar.classList.add('hide-top-bar');
          if (sidebar) sidebar.classList.add('hide-bottom-bar');
          if (fab) fab.classList.add('hide-bottom-bar');
        } else {
          // Scroll Up - show top-bar & bottom navigation
          topBar.classList.remove('hide-top-bar');
          if (sidebar) sidebar.classList.remove('hide-bottom-bar');
          if (fab) fab.classList.remove('hide-bottom-bar');
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

function handleGoogleSignIn() {
  showToast("Connecting to Google Auth...", "info");
  setTimeout(() => {
    let user = State.users.find(u => u.handle === "@google_traveler");
    if (!user) {
      user = {
        name: "Google Traveler",
        handle: "@google_traveler",
        email: "google.traveler@gmail.com",
        avatar: "avatar_surf",
        bio: "Signed in via Google Auth.",
        role: "admin",
        avatar_crop: { x: 0, y: 0, zoom: 1 },
        showRigProfile: true,
        rig: "Adventure Van",
        solar: "300W Solar",
        power: "200Ah Lithium",
        water: "20 Gal Fresh",
        gallery: [],
        visitedSpots: [],
        friends: [],
        reputation: 5,
        givenRepTo: []
      };
      State.users.push(user);
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
      role: user.role || "admin",
      instagram_handle: user.instagram_handle || "",
      tiktok_handle: user.tiktok_handle || "",
      avatar_crop: user.avatar_crop || { x: 0, y: 0, zoom: 1 }
    };
    State.isSignedIn = true;
    saveStateToStorage();
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast("Signed in successfully via Google!", "success");
    renderCurrentTab();
  }, 1000);
}
window.handleGoogleSignIn = handleGoogleSignIn;

function handleAuthSignIn(event) {
  event.preventDefault();
  const inputVal = document.getElementById('signin-email').value.trim();
  const passwordVal = document.getElementById('signin-password').value;
  
  if (!inputVal) return;
  
  const searchName = inputVal.toLowerCase();

  // Find user in database simulator
  const user = State.users.find(u => u.name.toLowerCase() === searchName || 
                                     u.handle.toLowerCase() === searchName ||
                                     u.handle.toLowerCase() === `@${searchName}` ||
                                     (u.email && u.email.toLowerCase() === searchName));
  
  if (user) {
    if (user.banned) {
      showToast("Your account has been deactivated by an administrator.", "error");
      return;
    }
    
    // Check password
    if (user.password && passwordVal !== user.password) {
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
    showToast(`Welcome back, ${user.name}!`, "success");
    
    // Check if admin to refresh UI tabs
    const adminTab = document.getElementById('sidebar-admin-tab');
    if (adminTab) {
      adminTab.style.display = user.role === 'admin' ? 'flex' : 'none';
    }
    
    renderCurrentTab();
  } else {
    showToast("User not found. Please check your credentials or Sign Up.", "error");
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
  
  // Track old avatar
  const oldAvatar = State.currentUser.avatar;
  let newAvatar = oldAvatar;
  
  // Crop avatar processing
  const cropWorkspace = document.getElementById('avatar-crop-workspace');
  if (cropWorkspace && (cropWorkspace.style.display === 'flex' || cropWorkspace.style.display === 'block')) {
    const canvas = document.getElementById('avatar-crop-canvas');
    if (canvas && typeof drawCropImage === 'function') {
      // Draw image WITHOUT the helper circle border before export
      drawCropImage(canvas, false);
      const croppedDataUrl = compressCanvasToJpeg(canvas, 120); // Compressed, lightweight avatar
      user.avatar = croppedDataUrl;
      State.currentUser.avatar = croppedDataUrl;
      newAvatar = croppedDataUrl;
      
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
  
  // Bio
  user.bio = document.getElementById('edit-profile-bio').value.trim() || user.bio;
  State.currentUser.bio = user.bio;
  
  // Social handles
  user.instagram_handle = document.getElementById('edit-profile-instagram').value.trim();
  user.tiktok_handle = document.getElementById('edit-profile-tiktok').value.trim();
  State.currentUser.instagram_handle = user.instagram_handle;
  State.currentUser.tiktok_handle = user.tiktok_handle;
  
  // Handle validation and 14-day limit check
  let handleSaved = true;
  let handleSavedMsg = "";
  let newHandleInput = document.getElementById('edit-profile-handle').value.trim();
  let newHandle = newHandleInput;
  if (newHandle && !newHandle.startsWith('@')) {
    newHandle = '@' + newHandle;
  }
  
  const oldHandle = State.currentUser.handle;
  
  if (newHandle !== oldHandle) {
    if (!/^@[a-zA-Z0-9_]{2,15}$/.test(newHandle)) {
      showToast("Handle must start with @ and be 2-15 alphanumeric/underscore characters.", "error");
      return;
    }
    
    const taken = State.users.some(u => u.handle && u.handle.toLowerCase() === newHandle.toLowerCase() && u.name !== oldName);
    if (taken) {
      showToast("This handle is already taken by another user.", "error");
      return;
    }
    
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    if (user.lastHandleChangeTimestamp && (now - user.lastHandleChangeTimestamp < fourteenDaysMs)) {
      const msLeft = fourteenDaysMs - (now - user.lastHandleChangeTimestamp);
      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
      const timeStr = daysLeft > 1 ? `${daysLeft} days` : `${hoursLeft} hours`;
      handleSaved = false;
      handleSavedMsg = `Handle change blocked (can only change once every 14 days. Re-try in ${timeStr}).`;
    } else {
      user.handle = newHandle;
      State.currentUser.handle = newHandle;
      user.lastHandleChangeTimestamp = now;
      State.currentUser.lastHandleChangeTimestamp = now;
    }
  }
  
  // Role Select
  const roleSelect = document.getElementById('edit-profile-role');
  if (roleSelect && (State.currentUser.handle === '@google_traveler' || State.currentUser.role === 'admin')) {
    user.role = roleSelect.value;
    State.currentUser.role = roleSelect.value;
  }
  
  // Set new display name
  user.name = newName;
  State.currentUser.name = newName;
  
  // Optimistic UI updates propagation across all data structures
  const nameChanged = oldName !== newName;
  const avatarChanged = oldAvatar !== newAvatar;
  
  if (nameChanged || avatarChanged) {
    // 1. Update posts and comments
    State.posts.forEach(p => {
      if (p.author && p.author.name === oldName) {
        if (nameChanged) p.author.name = newName;
        if (avatarChanged) p.author.avatar = newAvatar;
      }
      if (p.comments) {
        p.comments.forEach(c => {
          if (c.user === oldName) {
            if (nameChanged) c.user = newName;
          }
        });
      }
    });
    
    // 2. Update spots
    State.spots.forEach(s => {
      if (s.author && s.author.name === oldName) {
        if (nameChanged) s.author.name = newName;
        if (avatarChanged) s.author.avatar = newAvatar;
      }
    });
    
    // 3. Update meetups & attendees
    State.meetups.forEach(m => {
      if (m.host && m.host.name === oldName) {
        if (nameChanged) m.host.name = newName;
        if (avatarChanged) m.host.avatar = newAvatar;
      }
      if (m.attendees && avatarChanged) {
        const idx = m.attendees.indexOf(oldAvatar);
        if (idx !== -1) {
          m.attendees[idx] = newAvatar;
        }
      }
    });
    
    // 4. Update marketplace seller
    State.marketplace.forEach(m => {
      if (m.seller && m.seller.name === oldName) {
        if (nameChanged) m.seller.name = newName;
        if (avatarChanged) m.seller.avatar = newAvatar;
      }
    });
    
    // 5. Update forum threads & replies
    State.forum.forEach(t => {
      if (t.author && t.author.name === oldName) {
        if (nameChanged) t.author.name = newName;
        if (avatarChanged) t.author.avatar = newAvatar;
      }
      if (t.replies) {
        t.replies.forEach(r => {
          if (r.author && r.author.name === oldName) {
            if (nameChanged) r.author.name = newName;
            if (avatarChanged) r.author.avatar = newAvatar;
          }
        });
      }
    });
    
    // 6. Update direct message/chats keys
    if (nameChanged && State.chats) {
      if (State.chats[oldName]) {
        State.chats[newName] = State.chats[oldName];
        delete State.chats[oldName];
      }
    }
    
    // 7. Update friends arrays
    State.users.forEach(u => {
      if (u.friends && nameChanged) {
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
  
  if (!handleSaved) {
    showToast(`Profile details updated! ${handleSavedMsg}`, "warning");
  } else {
    showToast("Profile details updated!", "success");
  }
}

function saveNewSpot() {
  if (!requireAuth()) return;
  if (!checkRateLimit('spot')) {
    showToast("Rate limit exceeded. You can only add 5 spots per hour.", "error");
    return;
  }
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
    renderLeafletMarkers();
  } else {
    newSpot.pendingSync = true;
    State.spots.push(newSpot);
    saveStateToStorage();
    renderLeafletMarkers();

    const sql = `INSERT INTO campsites (id, title, category, latitude, longitude, description, author_id, vouches, status) VALUES ('${newSpot.id}', '${newSpot.title.replace(/'/g, "''")}', '${newSpot.category}', ${newSpot.lat}, ${newSpot.lng}, '${newSpot.description.replace(/'/g, "''")}', '${State.currentUser.name}', 1, '${newSpot.status}');`;
    const rls = `CREATE POLICY "Enable insert for authenticated users only" ON campsites FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);`;

    window.simulateDatabaseWrite(newSpot, 'spot', sql, rls, () => {
      saveStateToStorage();
      renderLeafletMarkers();
      showToast(successMsg, "success");
    });
  }
  
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
    status: 'approved',
    lat: loc && loc.status === 'present' ? loc.lat : null,
    lng: loc && loc.status === 'present' ? loc.lng : null
  };
  
  newPost.pendingSync = true;
  State.posts.unshift(newPost);
  saveStateToStorage();
  renderDashboardFeed();
  
  // Clean inputs
  document.getElementById('post-text').value = '';
  document.getElementById('post-photo-upload').value = '';
  const statusSpan = document.getElementById('post-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  const workspace = document.getElementById('post-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  State.postCropState = createCropObject();
  
  closeModal('modal-add-post');

  const sql = `INSERT INTO posts (id, content, image_url, author_id, likes, status, latitude, longitude) VALUES ('${newPost.id}', '${newPost.content.replace(/'/g, "''")}', ${newPost.image ? "'[image_data]'" : "NULL"}, '${State.currentUser.name}', 0, '${newPost.status}', ${newPost.lat || 'NULL'}, ${newPost.lng || 'NULL'});`;
  const rls = `CREATE POLICY "Enable insert for authenticated users" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);`;

  window.simulateDatabaseWrite(newPost, 'post', sql, rls, () => {
    saveStateToStorage();
    renderDashboardFeed();
    const successMsg = "Update shared with community feed!";
    showToast(successMsg, "success");
  });
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
  
  newListing.pendingSync = true;
  State.marketplace.push(newListing);
  saveStateToStorage();
  
  const isService = category === 'services-offer' || category === 'services-want';
  const activeType = isService ? 'services' : 'items';
  if (typeof window.switchMarketplaceType === 'function') {
    window.switchMarketplaceType(activeType);
  } else {
    State.activeMarketplaceType = activeType;
  }
  renderMarketplaceListings();
  
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

  const sql = `INSERT INTO listings (id, title, price, category, location, zip, latitude, longitude, condition, description, seller_id, image_url, status) VALUES ('${newListing.id}', '${newListing.title.replace(/'/g, "''")}', ${newListing.price}, '${newListing.category}', '${newListing.location.replace(/'/g, "''")}', '${newListing.zip}', ${newListing.lat}, ${newListing.lng}, '${newListing.condition}', '${newListing.description.replace(/'/g, "''")}', '${State.currentUser.name}', '[image_data]', '${newListing.status}');`;
  const rls = `CREATE POLICY "Enable insert for authenticated sellers" ON listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);`;

  window.simulateDatabaseWrite(newListing, 'marketplace listing', sql, rls, () => {
    saveStateToStorage();
    renderMarketplaceListings();
    const successMsg = status === 'approved' ? "Marketplace listing published!" : "Listing submitted! Awaiting admin approval.";
    showToast(successMsg, "success");
  });
}

function saveNewTribe() {
  if (!requireAuth()) return;
  if (!checkRateLimit('meetup')) { // Tribes are similar in complexity to meetups, so check against meetup limit
    showToast("Rate limit exceeded. You can only create 3 groups per hour.", "error");
    return;
  }
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
  
  newTribe.pendingSync = true;
  State.tribes.push(newTribe);
  saveStateToStorage();
  renderTribesList();
  
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

  const sql = `INSERT INTO tribes (id, title, description, banner_url, icon_url, icon_letter, is_public, members_count) VALUES ('${newTribe.id}', '${newTribe.title.replace(/'/g, "''")}', '${newTribe.description.replace(/'/g, "''")}', '[banner_data]', '[icon_data]', '${newTribe.iconLetter}', ${newTribe.isPublic}, 1);`;
  const rls = `CREATE POLICY "Enable insert for authenticated users" ON tribes FOR INSERT TO authenticated WITH CHECK (true);`;

  window.simulateDatabaseWrite(newTribe, 'tribe', sql, rls, () => {
    saveStateToStorage();
    renderTribesList();
    showToast(`"${title}" Tribe formed! You are the first member.`, "success");
  });
}

function saveNewMeetup() {
  if (!requireAuth()) return;
  if (!checkRateLimit('meetup')) {
    showToast("Rate limit exceeded. You can only host 3 meetups per hour.", "error");
    return;
  }
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
      thumbnail = compressCanvasToJpeg(canvas);
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
  
  newMeetup.pendingSync = true;
  State.meetups.push(newMeetup);
  saveStateToStorage();
  
  // Reload maps
  renderLeafletMarkers();
  renderMeetupsList();
  
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

  const sql = `INSERT INTO meetups (id, title, latitude, longitude, date, time, location, description, host_id, thumbnail_url, status) VALUES ('${newMeetup.id}', '${newMeetup.title.replace(/'/g, "''")}', ${newMeetup.lat}, ${newMeetup.lng}, '${newMeetup.date}', '${newMeetup.time}', '${newMeetup.location.replace(/'/g, "''")}', '${newMeetup.description.replace(/'/g, "''")}', '${State.currentUser.name}', ${newMeetup.thumbnail !== 'none' ? "'[thumbnail_data]'" : "NULL"}, '${newMeetup.status}');`;
  const rls = `CREATE POLICY "Enable insert for authenticated hosts" ON meetups FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);`;

  window.simulateDatabaseWrite(newMeetup, 'meetup', sql, rls, () => {
    saveStateToStorage();
    renderLeafletMarkers();
    renderMeetupsList();
    const successMsg = status === 'approved' ? "Meetup hosted and pinned on global map!" : "Meetup submitted! Awaiting admin approval.";
    showToast(successMsg, "success");
  });
}

function saveNewForumThread() {
  if (!requireAuth()) return;
  if (!checkRateLimit('forum')) {
    showToast("Rate limit exceeded. You can only create 5 threads per hour.", "error");
    return;
  }
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
    renderForumView();
  } else {
    newThread.pendingSync = true;
    State.forum.unshift(newThread);
    saveStateToStorage();
    renderForumView();

    const sql = `INSERT INTO forum_threads (id, title, category, author_id, body, image_url, replies_count, views_count) VALUES ('${newThread.id}', '${newThread.title.replace(/'/g, "''")}', '${newThread.category}', '${State.currentUser.name}', '${newThread.body.replace(/'/g, "''")}', ${newThread.image ? "'[image_data]'" : "NULL"}, 0, 1);`;
    const rls = `CREATE POLICY "Enable insert for authenticated authors" ON forum_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);`;

    window.simulateDatabaseWrite(newThread, 'forum thread', sql, rls, () => {
      saveStateToStorage();
      renderForumView();
      showToast("Thread published to discussion board!", "success");
    });
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
  
  const status = 'approved';
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
  
  newPost.pendingSync = true;
  State.posts.unshift(newPost);
  State._cachedFeeds = {};
  saveStateToStorage();
  renderDashboardFeed();
  renderFeedTabPosts();
  
  // Clean inputs
  document.getElementById('feed-tab-post-text').value = '';
  document.getElementById('feed-tab-photo-upload').value = '';
  const statusSpan = document.getElementById('feed-tab-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  const workspace = document.getElementById('feed-tab-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  State.feedTabCropState = createCropObject();

  const sql = `INSERT INTO posts (id, content, image_url, author_id, likes, status, latitude, longitude) VALUES ('${newPost.id}', '${newPost.content.replace(/'/g, "''")}', ${newPost.image ? "'[image_data]'" : "NULL"}, '${State.currentUser.name}', 0, '${newPost.status}', ${newPost.lat || 'NULL'}, ${newPost.lng || 'NULL'});`;
  const rls = `CREATE POLICY "Enable insert for authenticated users" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);`;

  window.simulateDatabaseWrite(newPost, 'post', sql, rls, () => {
    saveStateToStorage();
    State._cachedFeeds = {};
    renderDashboardFeed();
    renderFeedTabPosts();
    const successMsg = "Update shared with community feed!";
    showToast(successMsg, "success");
  });
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
    
    formSignin.classList.remove('hidden');
    formSignup.classList.add('hidden');
  } else {
    btnSignup.classList.add('active');
    btnSignup.style.background = 'var(--card-bg)';
    btnSignup.style.color = 'var(--text-main)';
    btnSignup.style.boxShadow = 'var(--shadow-sm)';
    
    btnSignin.classList.remove('active');
    btnSignin.style.background = 'transparent';
    btnSignin.style.color = 'var(--muted-text)';
    btnSignin.style.boxShadow = 'none';
    
    formSignup.classList.remove('hidden');
    formSignin.classList.add('hidden');
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
