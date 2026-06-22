/* ==========================================================================
   VANLYFA COMPONENT: APP-SHELL.JS
   ========================================================================== */

function switchTab(tabName, isPopState = false) {
  if (tabName !== 'dashboard') {
    if (!requireAuth()) return;
  }
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
    profile: "Rig Profile",
    jobs: "Work & Stay"
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
    jobs: "Search farm help, camp hosts, carpentry..."
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
    forum: { text: "New Thread", icon: "plus" },
    jobs: { text: "Host Work & Stay", icon: "briefcase" }
  };
  
  const conf = configs[State.activeTab];
  if (conf) {
    btn.innerHTML = `<i data-lucide="${conf.icon}"></i> <span>${conf.text}</span>`;
  }
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
  if (modalId) openModal(modalId);
}

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
    case "jobs":
      renderJobsList();
      break;
  }
}
