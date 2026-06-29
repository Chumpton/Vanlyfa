/* ==========================================================================
   VANLYFA MAIN INITIALIZER & CONTROLLER - index.js
   ========================================================================== */

// One-time cache and service worker purge to migrate users from the old cache-first trap
(async function purgeOldServiceWorker() {
  if (!localStorage.getItem('vanlyfa_cache_purged_v4')) {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (let key of keys) {
          await caches.delete(key);
        }
      }
      localStorage.setItem('vanlyfa_cache_purged_v4', 'true');
      console.log('[VanLyfa] Purged old service worker and caches. Reloading...');
      if (typeof window.location.reload === 'function') {
        window.location.reload();
      }
    } catch (e) {
      console.error('[VanLyfa] Error purging service worker:', e);
    }
  }
})();

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

  // 3. Initialize avatar picker selection highlights
  document.querySelectorAll('.avatar-picker-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.avatar-picker-option').forEach(opt => {
        opt.classList.remove('selected');
        opt.style.borderColor = 'transparent';
      });
      option.classList.add('selected');
      option.style.borderColor = 'var(--accent-green)';
    });
  });

  // 4. Expose onboarding submit to global scope for form action
  window.handleOnboardingSubmit = handleOnboardingSubmit;
});

function initApp() {
  // One-time localStorage migration to clear out old mock data caches for Supabase prep
  if (!localStorage.getItem('vanlyfa_supabase_prep_v1')) {
    localStorage.removeItem('vanlyfa_state');
    localStorage.setItem('vanlyfa_supabase_prep_v1', 'true');
  }

  // Initialize Supabase Client if credentials are provided
  const supabaseUrl = window.SUPABASE_URL || '';
  const supabaseKey = window.SUPABASE_ANON_KEY || '';
  
  if (supabaseUrl && supabaseKey && typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    Backend._supabase = window.supabaseClient;
    
    if (Backend._mode === 'supabase') {
      loadStateFromStorage();
      // Subscribe to Auth state changes
      window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (typeof window.addDebugLog === 'function') {
          window.addDebugLog(`Auth change event fired: ${event} (Session active: ${!!session})`);
        }
        if (session) {
          try {
            const { data: profiles, error } = await window.supabaseClient
              .from('profiles')
              .select('*')
              .eq('id', session.user.id);
              
            if (error) throw error;
            
            let profile = (profiles && profiles.length > 0) ? profiles[0] : null;
            
            if (!profile) {
              if (typeof window.addDebugLog === 'function') {
                window.addDebugLog(`Profile missing for User ${session.user.id}. Intercepting for onboarding...`);
              }
              
              // Capture details for profile onboarding
              State.tempAuthUser = session.user;
              
              // Get pre-typed values from signup form
              const signupUserVal = document.getElementById('signup-username')?.value.trim();
              const signupBioVal = document.getElementById('signup-bio')?.value.trim();
              
              const metadata = session.user.user_metadata || {};
              const defaultName = signupUserVal || metadata.full_name || session.user.email.split('@')[0];
              const defaultHandle = `@${defaultName.replace(/\s+/g, '_').toLowerCase()}`;
              const defaultBio = signupBioVal || "New nomad on the road.";
              
              // Pre-populate Onboarding Modal fields
              const dispNameInput = document.getElementById('onboard-display-name');
              const handleInput = document.getElementById('onboard-handle');
              const bioInput = document.getElementById('onboard-bio');
              
              if (dispNameInput) dispNameInput.value = defaultName;
              if (handleInput) handleInput.value = defaultHandle;
              if (bioInput) bioInput.value = defaultBio;
              
              // Render avatar picker SVGs dynamically
              document.querySelectorAll('.onboard-avatar-img').forEach(img => {
                const key = img.getAttribute('data-avatar-key');
                if (key && typeof getAvatarSrc === 'function') {
                  img.src = getAvatarSrc(key);
                }
              });
              
              // Close Auth modal and show Onboarding modal
              closeModal('modal-auth-required');
              openModal('modal-complete-profile');
            } else {
              State.currentUser = {
                id: profile.id,
                name: profile.name,
                handle: profile.handle,
                avatar: profile.avatar || 'avatar_bob',
                bio: profile.bio || 'Living full time on the road.',
                role: profile.role || 'user',
                spotsCount: profile.spots_count || 0,
                listingsCount: profile.listings_count || 0,
                reputation: profile.reputation || 0,
                savedPostIds: profile.saved_post_ids || [],
                savedMeetupIds: profile.saved_meetup_ids || []
              };
              State.isSignedIn = true;
              
              // Close modals
              closeModal('modal-auth-required');
              closeModal('modal-complete-profile');
              
              if (typeof window.addDebugLog === 'function') {
                window.addDebugLog(`Logged in as Nomad: ${profile.name} (${profile.handle})`);
              }
            }
          } catch (err) {
            console.error("Error loading user profile on auth change:", err);
            showToast("Failed to retrieve profile data.", "error");
          }
        } else {
          await Backend.signOut();
          if (typeof window.addDebugLog === 'function') {
            window.addDebugLog("Signed out session. Reverting to Guest mode.");
          }
        }
        updateSidebarProfileWidget();
        renderCurrentTab();
      });
    } else {
      loadStateFromStorage();
    }
  } else {
    loadStateFromStorage();
  }
  
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
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      State.searchQuery = e.target.value.toLowerCase();
      if (State.searchQuery && State.activeTab !== 'search') {
        switchTab('search');
      } else {
        renderCurrentTab();
      }
    }, 250));
    searchInput.addEventListener('focus', () => {
      if (State.activeTab !== 'search') {
        switchTab('search');
      }
    });
  }

  // Marketplace Filter Listeners
  const marketCat = document.getElementById('market-filter-category');
  if (marketCat) marketCat.addEventListener('change', renderMarketplaceListings);
  
  const marketSort = document.getElementById('market-sort-price');
  if (marketSort) marketSort.addEventListener('change', renderMarketplaceListings);
  
  const marketZip = document.getElementById('market-filter-zip');
  if (marketZip) marketZip.addEventListener('input', renderMarketplaceListings);
  
  const marketRad = document.getElementById('market-filter-radius');
  if (marketRad) marketRad.addEventListener('change', renderMarketplaceListings);


  // Feed Filter Listeners (For You / Following Tabs)
  window.initFeedTabs = function() {
    const selectedTab = State.feedFilterTab || 'for-you';
    document.querySelectorAll('.feed-tab-btn').forEach(tab => {
      const val = tab.getAttribute('data-tab-value');
      if (val === selectedTab) {
        tab.classList.add('active');
        tab.style.color = 'var(--text-charcoal)';
        tab.style.borderBottom = '2px solid var(--accent-green)';
      } else {
        tab.classList.remove('active');
        tab.style.color = 'var(--muted-text)';
        tab.style.borderBottom = '2px solid transparent';
      }

      if (!tab.hasListener) {
        tab.hasListener = true;
        tab.addEventListener('click', (e) => {
          const tabVal = e.currentTarget.getAttribute('data-tab-value');
          State.feedFilterTab = tabVal;
          saveStateToStorage();
          State._cachedFeeds = {};
          initFeedTabs();
          renderFeedTabPosts();
        });
      }
    });
  };
  initFeedTabs();

  // Meetup Filter Listeners (Bubble Rack)
  window.initMeetupFilters = function() {
    const selectedArea = State.meetupFilterArea || 'all';
    const selectedSort = State.meetupFilterSort || 'newest';
    const selectedSaved = State.meetupFilterSaved || 'all';
    
    document.querySelectorAll('[data-meetup-filter]').forEach(chip => {
      const type = chip.getAttribute('data-meetup-filter');
      const val = chip.getAttribute('data-value');
      
      const isActive = (type === 'area' && val === selectedArea) ||
                       (type === 'sort' && val === selectedSort) ||
                       (type === 'saved' && val === selectedSaved);
                       
      if (isActive) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
      
      if (!chip.hasListener) {
        chip.hasListener = true;
        chip.addEventListener('click', (e) => {
          const typeAttr = e.currentTarget.getAttribute('data-meetup-filter');
          const valAttr = e.currentTarget.getAttribute('data-value');
          
          if (typeAttr === 'area') {
            State.meetupFilterArea = valAttr;
          } else if (typeAttr === 'sort') {
            State.meetupFilterSort = valAttr;
          } else if (typeAttr === 'saved') {
            State.meetupFilterSaved = State.meetupFilterSaved === 'saved' ? 'all' : 'saved';
          }
          
          saveStateToStorage();
          initMeetupFilters();
          renderMeetupsList();
        });
      }
    });
  };
  initMeetupFilters();

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

  const sharedProfile = params.get('profile');
  if (sharedProfile) {
    setTimeout(() => {
      if (typeof viewUserProfile === 'function') {
        viewUserProfile(sharedProfile);
      }
    }, 600);
  }
  
  const followUser = params.get('follow');
  if (followUser) {
    setTimeout(() => {
      if (typeof window.toggleFollowUser === 'function') {
        window.toggleFollowUser(followUser);
      }
    }, 1000);
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
        const delta = lastScroll - scrollTop;
        if (Math.abs(delta) < 30) return;
        
        const sidebar = document.querySelector('.app-sidebar');
        const fab = document.getElementById('mobile-action-fab');
        
        // Force show near top to prevent elastic bounce issues
        if (scrollTop < 50) {
          topBar.classList.remove('hide-top-bar');
          if (sidebar) sidebar.classList.remove('hide-bottom-bar');
          if (fab) fab.classList.remove('hide-bottom-bar');
          e.target._lastScrollTop = scrollTop;
          return;
        }

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

  // Dynamic Tribe Chat and Forum Input Focus Listeners for Mobile Auto-Squish
  const tribePane = document.getElementById('pane-tribes');
  if (tribePane) {
    tribePane.addEventListener('focusin', (e) => {
      if (window.innerWidth <= 768 && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        tribePane.classList.add('chat-focused');
        const topBar = document.querySelector('.top-bar');
        if (topBar) topBar.classList.add('hide-top-bar');
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.add('hide-bottom-bar');
        
        // Auto-scroll chat area to bottom
        const activeMsgArea = document.getElementById('tribe-chat-messages-area');
        if (activeMsgArea) {
          setTimeout(() => { activeMsgArea.scrollTop = activeMsgArea.scrollHeight; }, 100);
        }
      }
    });
    tribePane.addEventListener('focusout', (e) => {
      if (window.innerWidth <= 768 && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        tribePane.classList.remove('chat-focused');
        const topBar = document.querySelector('.top-bar');
        if (topBar) topBar.classList.remove('hide-top-bar');
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.remove('hide-bottom-bar');
      }
    });
  }

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

async function handleGoogleSignIn() {
  showToast("Connecting to Google Auth...", "info");
  try {
    const user = await Backend.signInWithGoogle();
    if (Backend._mode !== 'supabase') {
      updateSidebarProfileWidget();
      closeModal('modal-auth-required');
      showToast("Signed in successfully via Google!", "success");
      renderCurrentTab();
    }
  } catch (e) {
    showToast(e.message, "error");
  }
}
window.handleGoogleSignIn = handleGoogleSignIn;

async function handleAuthSignIn(event) {
  event.preventDefault();
  const inputVal = document.getElementById('signin-email').value.trim();
  const passwordVal = document.getElementById('signin-password').value;
  
  if (!inputVal) return;
  
  try {
    const user = await Backend.signIn(inputVal, passwordVal);
    
    // UI updates
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast(`Welcome back, ${user.name}!`, "success");
    
    // Check if admin to refresh UI tabs
    const adminTab = document.getElementById('sidebar-admin-tab');
    if (adminTab) {
      adminTab.style.display = user.role === 'admin' ? 'flex' : 'none';
    }
    
    renderCurrentTab();
  } catch(e) {
    if (e.message === 'auth_required') openModal('modal-auth-required');
    else showToast(e.message, 'error');
  }
}

async function handleAuthSignUp(event) {
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
  
  try {
    await Backend.signUp(newUser);
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast(`Welcome aboard, ${username}!`, "success");
    
    // Hide admin tab on fresh signup
    const adminTab = document.getElementById('sidebar-admin-tab');
    if (adminTab) adminTab.style.display = 'none';

    renderCurrentTab();
  } catch(e) {
    showToast(e.message, 'error');
  }
}

async function handleOnboardingSubmit(event) {
  event.preventDefault();
  
  if (!State.tempAuthUser) {
    showToast("Session lost. Please sign in again.", "error");
    closeModal('modal-complete-profile');
    openModal('modal-auth-required');
    return;
  }
  
  const displayName = document.getElementById('onboard-display-name').value.trim();
  let handle = document.getElementById('onboard-handle').value.trim();
  const bio = document.getElementById('onboard-bio').value.trim() || "New nomad on the road.";
  const rigType = document.getElementById('onboard-rig-type').value;
  const solar = document.getElementById('onboard-solar').value.trim();
  const battery = document.getElementById('onboard-power').value.trim();
  const water = document.getElementById('onboard-water').value.trim();
  
  if (!displayName || !handle) {
    showToast("Please fill in both name and handle fields.", "error");
    return;
  }
  
  // Format handle: prepend '@' if missing, replace spaces/specials
  if (!handle.startsWith('@')) {
    handle = '@' + handle;
  }
  handle = handle.replace(/\s+/g, '_').toLowerCase();
  
  // Basic validation
  if (handle.length < 3) {
    showToast("Handle must be at least 3 characters long.", "error");
    return;
  }
  
  // Query handle uniqueness
  try {
    if (Backend._mode === 'supabase') {
      const { data: existing, error } = await window.supabaseClient
        .from('profiles')
        .select('handle')
        .eq('handle', handle);
        
      if (error) throw error;
      if (existing && existing.length > 0) {
        showToast("This handle is already taken by another Nomad. Please choose another.", "error");
        return;
      }
    } else {
      const existingUser = State.users.find(u => u.handle.toLowerCase() === handle.toLowerCase());
      if (existingUser) {
        showToast("This handle is already taken by another Nomad. Please choose another.", "error");
        return;
      }
    }
  } catch (err) {
    console.error("Error checking handle uniqueness:", err);
    showToast("Error checking handle uniqueness.", "error");
    return;
  }
  
  // Find selected avatar key
  const selectedAvatarEl = document.querySelector('.avatar-picker-grid .avatar-picker-option.selected');
  const avatarKey = selectedAvatarEl ? selectedAvatarEl.getAttribute('data-avatar') : 'avatar_bob';
  
  const profileData = {
    id: State.tempAuthUser.id,
    name: displayName,
    handle: handle,
    avatar: avatarKey,
    bio: bio,
    role: 'user',
    rig: rigType,
    solar: solar,
    power: battery,
    water: water
  };
  
  try {
    const profile = await Backend.createProfile(profileData);
    
    // Complete signed-in state
    State.currentUser = {
      id: profile.id,
      name: profile.name,
      handle: profile.handle,
      avatar: profile.avatar || 'avatar_bob',
      bio: profile.bio || 'Living full time on the road.',
      role: profile.role || 'user',
      spotsCount: 0,
      listingsCount: 0,
      reputation: 5,
      savedPostIds: [],
      savedMeetupIds: []
    };
    State.isSignedIn = true;
    
    // Clean up temporary variables
    delete State.tempAuthUser;
    
    closeModal('modal-complete-profile');
    showToast(`Welcome aboard, ${profile.name}!`, "success");
    
    // Repaint sidebar and active tab
    updateSidebarProfileWidget();
    renderCurrentTab();
  } catch (err) {
    console.error("Error completing onboarding profile creation:", err);
    showToast(`Failed to complete profile: ${err.message}`, "error");
  }
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
  
  // Bio validation: Maybe no links allowed in bio, just insta and tiktok handles unless verified
  const bioInput = document.getElementById('edit-profile-bio');
  const bioVal = bioInput ? bioInput.value.trim() : '';
  const isVerified = State.currentUser.role === 'admin' || State.currentUser.name === 'Google Traveler' || State.currentUser.verified === true || (user && user.verified === true);
  if (!isVerified) {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/ig;
    if (urlPattern.test(bioVal)) {
      showToast("Only verified users can share website links in bio. Please remove links.", "error");
      return;
    }
  }
  user.bio = bioVal || user.bio;
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

async function saveNewSpot() {
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
  
  const spotData = {
    title,
    category,
    lat,
    lng,
    description
  };
  
  if (category === 'driveway-host') {
    spotData.fee = parseFloat(document.getElementById('spot-fee').value) || 15;
    spotData.amenities = {
      power: document.getElementById('amenity-power').checked,
      water: document.getElementById('amenity-water').checked,
      wifi: document.getElementById('amenity-wifi').checked,
      pets: document.getElementById('amenity-pets').checked
    };
  }
  
  try {
    await Backend.createSpot(spotData);
    
    if (State.isOffline) {
      updateConnectionUI();
      showToast("Offline mode: campsite queued for sync!", "warning");
    } else {
      showToast("Campsite vouched successfully!", "success");
    }
  } catch(e) {
    if (e.message === 'auth_required') openModal('modal-auth-required');
    else showToast(e.message, 'error');
    return;
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

async function saveNewPost() {
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
  
  try {
    await Backend.createPost({
      content,
      image: finalImage,
      lat: loc && loc.status === 'present' ? loc.lat : null,
      lng: loc && loc.status === 'present' ? loc.lng : null
    });
    showToast("Update shared with community feed!", "success");
  } catch(e) {
    if (e.message === 'auth_required') openModal('modal-auth-required');
    else showToast(e.message, 'error');
    return;
  }
  
  // Clean inputs
  document.getElementById('post-text').value = '';
  document.getElementById('post-photo-upload').value = '';
  const statusSpan = document.getElementById('post-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  const workspace = document.getElementById('post-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  State.postCropState = createCropObject();
  
  closeModal('modal-add-post');
}

async function saveNewListing() {
  if (!requireAuth()) return;
  const userListings = State.marketplace.filter(m => m.seller && (m.seller === State.currentUser.name || (typeof m.seller === 'object' && m.seller.name === State.currentUser.name)));
  if (userListings.length >= 3) {
    showToast("You can only have up to 3 active marketplace listings at a time. Please delete one first.", "error");
    return;
  }
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
  
  const listingData = {
    title,
    price,
    category,
    location,
    zip,
    lat: coords.lat,
    lng: coords.lng,
    description,
    image: finalImage
  };
  
  try {
    await Backend.createListing(listingData);
    showToast("Marketplace listing published!", "success");
  } catch(e) {
    if (e.message === 'auth_required') openModal('modal-auth-required');
    else showToast(e.message, 'error');
    return;
  }
  
  const isService = category === 'services-offer' || category === 'services-want';
  const activeType = isService ? 'services' : 'items';
  if (typeof window.switchMarketplaceType === 'function') {
    window.switchMarketplaceType(activeType);
  } else {
    State.activeMarketplaceType = activeType;
  }
  
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

async function saveNewMeetup() {
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
  
  // Extract meetup thumbnail from canvas
  let thumbnail = 'none';
  const workspace = document.getElementById('meetup-crop-workspace');
  if (workspace && workspace.style.display !== 'none') {
    const canvas = document.getElementById('meetup-crop-canvas');
    if (canvas) {
      thumbnail = compressCanvasToJpeg(canvas);
    }
  }
  
  try {
    await Backend.createMeetup({
      title, lat, lng, date, time, location, description,
      image: thumbnail !== 'none' ? thumbnail : null
    });
    showToast("Meetup hosted and pinned on global map!", "success");
  } catch(e) {
    if (e.message === 'auth_required') openModal('modal-auth-required');
    else showToast(e.message, 'error');
    return;
  }
  
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

async function saveNewFeedTabPost() {
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
  
  const loc = getCachedLocation();
  
  try {
    await Backend.createPost({
      content,
      image: finalImage,
      lat: loc && loc.status === 'present' ? loc.lat : null,
      lng: loc && loc.status === 'present' ? loc.lng : null
    });
    showToast("Update shared with community feed!", "success");
  } catch(e) {
    if (e.message === 'auth_required') openModal('modal-auth-required');
    else showToast(e.message, 'error');
    return;
  }
  
  // Clean inputs
  document.getElementById('feed-tab-post-text').value = '';
  document.getElementById('feed-tab-photo-upload').value = '';
  const statusSpan = document.getElementById('feed-tab-photo-upload-status');
  if (statusSpan) statusSpan.innerText = '';
  const workspace = document.getElementById('feed-tab-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  State.feedTabCropState = createCropObject();
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
