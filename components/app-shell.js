/* ==========================================================================
   VANLYFA COMPONENT: APP-SHELL.JS
   ========================================================================== */

function switchTab(tabName, isPopState = false) {
  if (tabName === 'messages') {
    if (!requireAuth()) return;
  }
  if (tabName === 'admin') {
    if (!requireAuth()) return;
    if (State.currentUser.role !== 'admin') {
      showToast("Access Denied. Admins only.", "error");
      switchTab('dashboard');
      return;
    }
  }

  // Virtual Shelving: Unmount currently active tab if it's data-dense
  if (State.activeTab && ['feed', 'marketplace', 'tribes', 'meetups', 'forum', 'jobs'].includes(State.activeTab)) {
    const oldPane = document.getElementById(`pane-${State.activeTab}`);
    if (oldPane && oldPane.firstElementChild) {
      State._cachedTabElements = State._cachedTabElements || {};
      State._cachedTabElements[State.activeTab] = oldPane.firstElementChild;
      oldPane.removeChild(oldPane.firstElementChild);
    }
  }

  State.activeTab = tabName;
  State.activeThreadId = null; // Reset forum viewing state
  
  // Ensure the top menu bar starts visible when switching tabs
  const topBar = document.querySelector('.top-bar');
  if (topBar) {
    topBar.classList.remove('hide-top-bar');
  }
  
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
  if (activePane) {
    // Virtual Shelving: Re-mount if previously unmounted
    if (State._cachedTabElements && State._cachedTabElements[tabName]) {
      activePane.appendChild(State._cachedTabElements[tabName]);
    }
    activePane.classList.add('active');
  }
  
  // Update Page Title
  const titles = {
    dashboard: "Dashboard",
    feed: "Community Feed",
    marketplace: "Marketplace",
    tribes: "Tribes",
    meetups: "Meetups",
    forum: "Forum Board",
    messages: "Direct Messages",
    profile: "Rig Profile",
    jobs: "Work & Stay",
    admin: "Admin Moderation Panel"
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
    profile: "Search profile specs...",
    jobs: "Search farm help, camp hosts, carpentry...",
    admin: "Filter pending moderation..."
  };
  document.getElementById('global-search').placeholder = placeholders[tabName] || "Search...";
  
  // Render views & Update main action buttons
  updateHeaderActionButton();
  renderCurrentTab();
  
  // Relayout map if transitioning back to dashboard
  if (tabName === 'dashboard' && State.leafletMap) {
    State.leafletMap.invalidateSize();
    setTimeout(() => {
      if (State.leafletMap) {
        State.leafletMap.invalidateSize();
      }
    }, 250);
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
    if (['feed', 'marketplace', 'tribes', 'meetups', 'forum', 'jobs'].includes(tabName)) {
      mobileActionFab.classList.add('hide-fab');
    } else {
      mobileActionFab.classList.remove('hide-fab');
    }
  }
  
  // Prevent overlaps on desktop
  updateDesktopChatContainerLayout();
}

function toggleMobileFeedTab() {
  if (State.activeTab === 'feed') {
    switchTab('dashboard');
  } else {
    switchTab('feed');
  }
}

function updateHeaderActionButton() {
  const btn = document.getElementById('main-action-btn');
  const searchBar = document.getElementById('search-bar-container');
  
  // Hide search bar on profile and admin tabs
  if (State.activeTab === 'profile' || State.activeTab === 'admin') {
    searchBar.style.visibility = 'hidden';
  } else {
    searchBar.style.visibility = 'visible';
  }
  
  // Hide header main action button on all tabs except dashboard
  if (State.activeTab !== 'dashboard') {
    btn.style.display = 'none';
    return;
  }
  
  btn.style.display = 'inline-flex';
  btn.innerHTML = `<i data-lucide="plus"></i> <span>Add Spot</span>`;
  lucide.createIcons();
}

function triggerMainActionButtonModal() {
  if (!requireAuth()) return;
  const modals = {
    dashboard: 'modal-add-spot',
    feed: 'modal-add-post',
    marketplace: 'modal-add-listing',
    tribes: 'modal-add-tribe',
    meetups: 'modal-add-meetup',
    forum: 'modal-add-thread',
    jobs: 'modal-add-job'
  };
  const modalId = modals[State.activeTab];
  if (modalId) {
    if (State.activeTab === 'marketplace') {
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
}

function renderCurrentTab() {
  if (typeof renderNotifications === 'function') {
    renderNotifications();
  }
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
    case "jobs":
      renderJobsList();
      break;
    case "admin":
      renderAdminPanel();
      break;
  }
}
