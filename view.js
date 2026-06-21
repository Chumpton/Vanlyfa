/* ==========================================================================
   VANLYFA PRESENTATIONAL VIEWS & RENDERERS - view.js
   ========================================================================== */

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

function updateConnectionUI() {
  const connectionBtn = document.getElementById('connection-status-btn');
  if (!connectionBtn) return;
  const dot = connectionBtn.querySelector('.status-indicator-dot');
  const text = connectionBtn.querySelector('.status-indicator-text');
  if (!dot || !text) return;

  if (State.isOffline) {
    dot.style.backgroundColor = '#ef4444'; // Red for offline
    const pendingCount = State.syncQueue ? State.syncQueue.length : 0;
    text.innerText = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline';
    connectionBtn.title = 'Switch to Online Mode';
    connectionBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    connectionBtn.style.background = 'rgba(239, 68, 68, 0.1)';
  } else {
    dot.style.backgroundColor = 'var(--accent-green)'; // Green for online
    text.innerText = 'Online';
    connectionBtn.title = 'Switch to Offline Mode';
    connectionBtn.style.borderColor = 'var(--border-color)';
    connectionBtn.style.background = 'var(--bg-card)';
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
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const handleEl = document.getElementById('sidebar-user-handle');
  const authBtn = document.getElementById('sidebar-auth-btn');
  const feedTabAvatar = document.getElementById('feed-tab-user-avatar');
  
  const textarea = document.getElementById('feed-tab-post-text');
  const submitBtn = document.getElementById('feed-tab-post-submit');
  const imgSelect = document.getElementById('feed-tab-post-img-select');

  if (State.isSignedIn) {
    avatarEl.src = getAvatarSrc(State.currentUser.avatar);
    nameEl.innerText = State.currentUser.name;
    handleEl.innerText = State.currentUser.handle;
    
    if (authBtn) {
      authBtn.innerHTML = `<i data-lucide="log-out" style="width: 16px; height: 16px;"></i>`;
      authBtn.title = "Sign Out";
      authBtn.style.color = "var(--muted-text)";
    }
    if (feedTabAvatar) {
      feedTabAvatar.src = getAvatarSrc(State.currentUser.avatar);
    }
    
    // Enable feed post creator
    if (textarea) {
      textarea.disabled = false;
      textarea.placeholder = "What's happening on the road? Share campsite views, solar upgrades, or camper hacks...";
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send"></i> <span>Share Update</span>`;
    }
    if (imgSelect) {
      imgSelect.disabled = false;
    }
  } else {
    avatarEl.src = getAvatarSrc('avatar_guest');
    nameEl.innerText = "Guest Nomad";
    handleEl.innerText = "Sign in to post";
    
    if (authBtn) {
      authBtn.innerHTML = `<i data-lucide="log-in" style="width: 16px; height: 16px;"></i>`;
      authBtn.title = "Sign In";
      authBtn.style.color = "var(--accent-green)";
    }
    if (feedTabAvatar) {
      feedTabAvatar.src = getAvatarSrc('avatar_guest');
    }
    
    // Disable and lock feed post creator for guest
    if (textarea) {
      textarea.disabled = true;
      textarea.value = '';
      textarea.placeholder = "Please sign in to share updates on the road...";
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="lock"></i> <span>Locked</span>`;
    }
    if (imgSelect) {
      imgSelect.disabled = true;
    }
  }
  
  if (window.lucide) {
    lucide.createIcons();
  }
}

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

function renderSocialFeed(containerId, isSidebar = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const query = State.searchQuery;
  
  // Cache check
  if (!State._cachedFeeds) {
    State._cachedFeeds = {};
  }
  const cacheKey = `${containerId}_${query}_${State.isSignedIn}`;
  if (State._cachedFeeds[cacheKey]) {
    container.innerHTML = State._cachedFeeds[cacheKey];
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = '';
  
  const filtered = State.posts.filter(p => {
    return p.content.toLowerCase().includes(query) || 
           p.author.name.toLowerCase().includes(query);
  });
  
  if (filtered.length === 0) {
    const emptyMarkup = `<div style="text-align:center; padding:32px 0; color:var(--muted-text); font-size:13px;">No posts match your search.</div>`;
    container.innerHTML = emptyMarkup;
    State._cachedFeeds[cacheKey] = emptyMarkup;
    return;
  }
  
  let feedHtml = '';
  
  filtered.forEach(post => {
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
            const commenter = State.users ? State.users.find(u => u.name === c.user) : null;
            const avatar = commenter ? commenter.avatar : 'solar';
            return `
              <div class="thread-reply-item">
                <img src="${getAvatarSrc(avatar)}" alt="${c.user}" class="reply-avatar" onclick="viewUserProfile('${c.user}')">
                <div class="reply-content-box">
                  <div class="reply-user-meta">
                    <span class="reply-username" onclick="viewUserProfile('${c.user}')">${getUserRoleMarkup(c.user)}</span>
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
    
    const isGuest = !State.isSignedIn;
    const placeholderText = isGuest ? "Please sign in to reply..." : `Reply to ${post.author.name}...`;
    const disabledAttr = isGuest ? "disabled" : "";
    const avatarToUse = isGuest ? 'avatar_guest' : State.currentUser.avatar;
    const cardStyle = isSidebar ? '' : 'style="background-color: var(--card-bg);"';

    feedHtml += `
      <div class="feed-post-card" ${cardStyle}>
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
                <span class="thread-author-name" onclick="viewUserProfile('${post.author.name}')">${getUserRoleMarkup(post.author.name)}</span>
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
              <img src="${getAvatarSrc(avatarToUse)}" alt="Me" class="thread-reply-avatar">
              <div class="thread-reply-input-wrapper">
                <input type="text" placeholder="${placeholderText}" id="comment-input-${post.id}" class="thread-reply-input" ${disabledAttr}>
                <button type="submit" class="thread-reply-submit-btn" ${disabledAttr}><i data-lucide="corner-down-left"></i></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = feedHtml;
  State._cachedFeeds[cacheKey] = feedHtml;
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

function renderDashboardFeed() {
  renderSocialFeed('social-feed-list', true);
}

function renderFeedTabPosts() {
  renderSocialFeed('feed-tab-posts-list', false);
}

function focusCommentInput(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  if (input) input.focus();
}

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
            <span>By ${getUserRoleMarkup(item.seller.name)}</span>
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

function renderTribesList() {
  const grid = document.getElementById('tribes-grid');
  const yourGrid = document.getElementById('your-tribes-grid');
  const yourSection = document.getElementById('your-tribes-section');
  
  if (!grid) return;
  grid.innerHTML = '';
  if (yourGrid) yourGrid.innerHTML = '';
  
  const catFilter = document.getElementById('tribe-filter-category')?.value || 'all';
  const stateFilter = document.getElementById('tribe-filter-state')?.value || 'all';
  const idealFilter = document.getElementById('tribe-filter-ideal')?.value || 'all';
  
  const query = State.searchQuery;
  const filtered = State.tribes.filter(t => {
    const matchesQuery = t.title.toLowerCase().includes(query) || 
                         t.description.toLowerCase().includes(query);
    const matchesCat = catFilter === 'all' || t.category === catFilter;
    const matchesState = stateFilter === 'all' || t.state === stateFilter;
    const matchesIdeal = idealFilter === 'all' || t.ideal === idealFilter;
    return matchesQuery && matchesCat && matchesState && matchesIdeal;
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
        <div class="tribe-meta" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span>${tribe.membersCount} Members</span>
          <span style="font-size:10px; font-weight:600; color:var(--muted-text); background:var(--bg-sand); padding:2px 6px; border-radius:4px;">${tribe.state} • ${tribe.category}</span>
        </div>
        <p class="tribe-description">${tribe.description}</p>
        <div class="tribe-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top: 12px;">
          <span style="font-size:10px; color:var(--muted-text); font-style:italic;">Ideal: ${tribe.ideal}</span>
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
        <span>${getUserRoleMarkup(msg.sender)}</span>
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

function openTribeNewThreadModal() {
  if (!requireAuth()) return;
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
    const userAvatar = State.currentUser ? State.currentUser.avatar : 'avatar_bob';
    const hasRsvped = meetup.attendees.includes(userAvatar);
    
    const card = document.createElement('div');
    card.className = 'meetup-card';
    card.id = `meetup-card-${meetup.id}`;
    card.innerHTML = `
      <div class="meetup-date-badge">
        <span class="meetup-date-month">${month}</span>
        <span class="meetup-date-day">${day}</span>
      </div>
      <div class="meetup-info" style="flex-grow: 1;">
        <h3 class="meetup-title">${meetup.title}</h3>
        <div style="display:flex; align-items:center; gap:6px; margin: 4px 0 8px 0;">
          <img src="${getAvatarSrc(meetup.host.avatar)}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;" />
          <span style="font-size:11px; font-weight:600; color:var(--text-charcoal);">${getUserRoleMarkup(meetup.host.name)}</span>
        </div>
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
        
        <!-- Comments Section for Meetup -->
        <div class="meetup-comments-section" style="margin-top: 12px; border-top: 1px dashed var(--border-color); padding-top: 12px; width: 100%;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-charcoal); margin-bottom: 8px;">Comments</div>
          <div class="meetup-comments-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 120px; overflow-y: auto; margin-bottom: 8px;">
            ${(!meetup.comments || meetup.comments.length === 0) ? `
              <div style="font-size: 10px; color: var(--muted-text); font-style: italic;">No comments yet.</div>
            ` : meetup.comments.map(c => `
              <div style="display: flex; gap: 8px; align-items: flex-start; background: var(--bg-sand); padding: 6px; border-radius: var(--radius-sm);">
                <img src="${getAvatarSrc(c.avatar)}" style="width: 16px; height: 16px; border-radius: 50%; object-fit: cover;" />
                <div style="display: flex; flex-direction: column; gap: 1px; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600;">
                    <span>${getUserRoleMarkup(c.author)}</span>
                    <span style="font-size: 8px; color: var(--muted-text);">${c.time}</span>
                  </div>
                  <div style="font-size: 10px; color: var(--text-main); line-height: 1.3;">${c.text}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <form onsubmit="saveMeetupComment(event, '${meetup.id}')" style="display: flex; gap: 6px; margin-top: 6px;">
            <input type="text" id="meetup-comment-input-${meetup.id}" placeholder="Ask a question or comment..." required style="flex-grow: 1; font-size: 11px; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px; background: var(--bg-card); color: var(--text-main); outline: none;" />
            <button type="submit" class="btn btn-sm btn-primary" style="padding: 2px 8px; font-size: 10px; height: auto;">Comment</button>
          </form>
        </div>
      </div>
      <div class="meetup-actions" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px; width: 100%; flex-wrap: wrap; gap: 8px;">
        <div class="meetup-attendees" style="display: flex; align-items: center;">
          ${meetup.attendees.slice(0, 4).map(a => `<img src="${getAvatarSrc(a)}" alt="Attendee" class="attendee-img">`).join('')}
          ${meetup.attendees.length > 4 ? `<div class="attendee-img" style="background:#6E6A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">+${meetup.attendees.length - 4}</div>` : ''}
          <span class="attendee-count">${meetup.attendeesCount} RSVP'd</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="btn btn-sm" onclick="shareMeetup('${meetup.id}')" title="Share Meetup" style="padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center;">
            <i data-lucide="share-2" style="width: 14px; height: 14px;"></i>
          </button>
          ${meetup.host.name !== State.currentUser.name ? `
            <button class="btn btn-sm" onclick="contactHost('${meetup.host.name}', 'Caravan Meetup: ${meetup.title}')" style="padding: 6px 10px; display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
              <span>Host</span>
            </button>
          ` : ''}
          <button class="btn btn-sm ${hasRsvped ? '' : 'btn-primary'}" onclick="toggleMeetupRsvp('${meetup.id}')">
            ${hasRsvped ? 'Going' : 'RSVP'}
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

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
    
    let lastPostMarkup = `<div class="thread-last-post"><span class="thread-last-user" onclick="event.stopPropagation(); viewUserProfile('${thread.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(thread.author.name)}</span><span style="font-size:9px;">OP</span></div>`;
    if (lastReply) {
      lastPostMarkup = `
        <div class="thread-last-post">
          <span class="thread-last-user" onclick="event.stopPropagation(); viewUserProfile('${lastReply.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(lastReply.author.name)}</span>
          <span style="font-size:9px;">Yesterday</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="thread-main">
        <h3 class="thread-title">${thread.title}${thread.pendingSync ? ' <span class="sync-badge pending" style="font-size:10px; padding:2px 6px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:8px; font-weight:600; vertical-align:middle;">Pending Sync</span>' : ''}</h3>
        <div class="thread-meta">
          <span>Started by <strong onclick="event.stopPropagation(); viewUserProfile('${thread.author.name}')" style="cursor:pointer; hover:underline;">${getUserRoleMarkup(thread.author.name)}</strong></span>
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
        <span class="post-username" onclick="viewUserProfile('${thread.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(thread.author.name)}</span>
        <span class="post-time">${thread.date}</span>
      </div>
    </div>
    <h3 style="font-size:18px; font-weight:800; margin-top:8px;">${thread.title}${thread.pendingSync ? ' <span class="sync-badge pending" style="font-size:10px; padding:2px 6px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:8px; font-weight:600; vertical-align:middle;">Pending Sync</span>' : ''}</h3>
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
            <span class="post-username" onclick="viewUserProfile('${reply.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(reply.author.name)}</span>
            <span class="post-time">${reply.date}${reply.pendingSync ? ' <span class="sync-badge pending" style="font-size:9px; padding:1px 4px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:6px; font-weight:600;">Pending Sync</span>' : ''}</span>
          </div>
        </div>
        <p class="post-content" style="font-size:13px; line-height:1.5;">${reply.body}</p>
      `;
      repliesContainer.appendChild(card);
    });
  }
  
  lucide.createIcons();
}

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
  
  // Render Bookings (Owner only)
  const bookingsSection = document.getElementById('profile-bookings-section');
  const bookingsList = document.getElementById('profile-bookings-list');
  if (bookingsSection && bookingsList) {
    if (isOwner) {
      bookingsSection.style.display = 'block';
      bookingsList.innerHTML = '';
      
      const bookings = State.bookings || [];
      if (bookings.length === 0) {
        bookingsList.innerHTML = `<div style="font-size:12px; color:var(--muted-text); font-style:italic;">No active driveway bookings.</div>`;
      } else {
        bookings.forEach(booking => {
          const row = document.createElement('div');
          row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg-sand); border:1px solid var(--border-color); border-radius:var(--radius-sm); font-size:12px; margin-bottom:6px;";
          row.innerHTML = `
            <div>
              <strong style="color:var(--text-charcoal); cursor:pointer;" onclick="viewSpotFromProfile('${booking.spotId}')">${booking.spotTitle}</strong>
              <div style="font-size:10px; color:var(--muted-text); margin-top:2px;">Host: ${booking.hostName} • Date: ${booking.checkInDate} (${booking.nights} night${booking.nights > 1 ? 's' : ''})</div>
            </div>
            <span style="font-weight:700; color:var(--accent-green);">$${booking.totalCost.toFixed(2)}</span>
          `;
          bookingsList.appendChild(row);
        });
      }
    } else {
      bookingsSection.style.display = 'none';
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
            showToast("Centered on your location!", "success");
          },
          (error) => {
            console.warn(error);
            showToast("GPS access blocked/failed. Enter coordinates manually.", "warning");
            openModal('modal-gps-input');
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      } else {
        showToast("Geolocation unsupported. Enter coordinates manually.", "warning");
        openModal('modal-gps-input');
      }
    });

    // Auto-locate 1.2s after startup to request permission
    setTimeout(() => {
      locateBtn.click();
    }, 1200);
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

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

function openProfileEditModal() {
  document.getElementById('edit-profile-name').value = State.currentUser.name;
  document.getElementById('edit-profile-bio').value = State.currentUser.bio;
  document.getElementById('edit-profile-rig').value = State.currentUser.rig;
  document.getElementById('edit-profile-solar').value = State.currentUser.solar;
  document.getElementById('edit-profile-power').value = State.currentUser.power;
  document.getElementById('edit-profile-water').value = State.currentUser.water;
  openModal('modal-edit-profile');
}

function toggleFeedShelf(shelf) {
  const layout = document.querySelector('.dashboard-layout');
  if (layout) {
    layout.classList.toggle('feed-shelved', shelf);
    
    // Prevent overlaps on desktop
    updateDesktopChatContainerLayout();
    
    // Invalidate map size so it redraws to fill the new container width
    if (State.leafletMap) {
      setTimeout(() => {
        State.leafletMap.invalidateSize();
      }, 150);
    }
  }
}

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
  const unreadCount = (State.unreadChats || []).length;
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
  if (!requireAuth()) return;
  const sidebar = document.getElementById('contacts-sidebar');
  if (sidebar) sidebar.classList.remove('open');
  
  if (!State.chats) State.chats = {};
  if (!State.chats[username]) {
    State.chats[username] = [];
  }
  if (State.unreadChats && State.unreadChats.includes(username)) {
    State.unreadChats = State.unreadChats.filter(name => name !== username);
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
              <span class="chat-header-name">${getUserRoleMarkup(contact.name)}</span>
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

function openMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (drawer) {
    drawer.style.display = 'flex';
    setTimeout(() => {
      drawer.classList.add('open');
    }, 50);
  }
  if (backdrop) {
    backdrop.style.display = 'block';
    setTimeout(() => {
      backdrop.classList.add('active');
    }, 50);
  }
  // Sync profile details inside drawer
  const drawerAvatar = document.getElementById('mobile-drawer-user-avatar');
  const drawerName = document.getElementById('mobile-drawer-user-name');
  const drawerHandle = document.getElementById('mobile-drawer-user-handle');
  if (State.isSignedIn) {
    if (drawerAvatar) drawerAvatar.src = getAvatarSrc(State.currentUser.avatar);
    if (drawerName) drawerName.innerText = State.currentUser.name;
    if (drawerHandle) drawerHandle.innerText = State.currentUser.handle;
  } else {
    if (drawerAvatar) drawerAvatar.src = getAvatarSrc('avatar_guest');
    if (drawerName) drawerName.innerText = "Guest Nomad";
    if (drawerHandle) drawerHandle.innerText = "Sign in to post";
  }
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (drawer) {
    drawer.classList.remove('open');
    setTimeout(() => {
      if (!drawer.classList.contains('open')) {
        drawer.style.display = 'none';
      }
    }, 300);
  }
  if (backdrop) {
    backdrop.classList.remove('active');
    setTimeout(() => {
      if (!backdrop.classList.contains('active')) {
        backdrop.style.display = 'none';
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

function updateDesktopChatContainerLayout() {
  const isDashboard = State.activeTab === 'dashboard';
  const layout = document.querySelector('.dashboard-layout');
  const isFeedShelved = layout && layout.classList.contains('feed-shelved');
  
  if (isDashboard && !isFeedShelved) {
    document.body.classList.add('dashboard-feed-active');
  } else {
    document.body.classList.remove('dashboard-feed-active');
  }
}

function openAboutModal() {
  openModal('modal-about');
  history.pushState({ modal: 'about' }, '');
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

function getUserRoleMarkup(username) {
  if (!username) return '';
  const cleanName = username.trim();
  
  // Official check
  const isOfficial = cleanName.includes("USFS") || 
                     cleanName.includes("BLM") || 
                     cleanName.includes("Forest Service") || 
                     cleanName.includes("Land Management") || 
                     cleanName === "Official Source";
                     
  if (isOfficial) {
    return `<span class="role-name-official" style="color: #10B981; font-weight: 700;">${cleanName}</span><span class="role-badge-official" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid #10B981; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; margin-left: 4px; vertical-align: middle;">OFFICIAL</span>`;
  }
  
  // Find reputation and custom badge tag
  let rep = 0;
  let user = State.users.find(u => u.name === cleanName);
  if (!user && State.currentUser && State.currentUser.name === cleanName) {
    user = State.currentUser;
  }
  
  if (user && user.badgeTag) {
    return `<span class="role-name-custom" style="color: var(--accent-green); font-weight: 700;">${cleanName}</span><span class="role-badge-custom" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-green); border: 1px solid var(--accent-green); border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; margin-left: 4px; vertical-align: middle; text-transform: uppercase;">${user.badgeTag}</span>`;
  }
  
  if (user) {
    rep = user.reputation || 0;
  }
  
  if (rep >= 30) {
    return `<span class="role-name-elite" style="color: #F59E0B; font-weight: 700; text-shadow: 0 0 2px rgba(245, 158, 11, 0.2);">${cleanName}</span><span class="role-badge-elite" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid #F59E0B; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; margin-left: 4px; vertical-align: middle;">★ ELITE</span>`;
  } else if (rep >= 20) {
    return `<span class="role-name-veteran" style="color: #F97316; font-weight: 700;">${cleanName}</span><span class="role-badge-veteran" style="background: rgba(249, 115, 22, 0.15); color: #F97316; border: 1px solid #F97316; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; margin-left: 4px; vertical-align: middle;">VET</span>`;
  } else if (rep >= 10) {
    return `<span class="role-name-explorer" style="color: #3B82F6; font-weight: 600;">${cleanName}</span><span class="role-badge-explorer" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6; border: 1px solid #3B82F6; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 600; margin-left: 4px; vertical-align: middle;">EXPLORER</span>`;
  } else {
    return `<span class="role-name-nomad" style="color: var(--text-main); font-weight: 500;">${cleanName}</span><span class="role-badge-nomad" style="background: rgba(120, 120, 120, 0.1); color: var(--muted-text); border: 1px solid rgba(120, 120, 120, 0.2); border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 500; margin-left: 4px; vertical-align: middle;">NOMAD</span>`;
  }
}

function renderJobsList() {
  const grid = document.getElementById('jobs-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const durationFilter = document.getElementById('job-filter-duration').value;
  const locationFilter = document.getElementById('job-filter-location').value.trim().toLowerCase();
  const query = State.searchQuery;

  if (!State.jobs) State.jobs = [];

  const filtered = State.jobs.filter(job => {
    const matchesQuery = job.title.toLowerCase().includes(query) || 
                         job.description.toLowerCase().includes(query) ||
                         job.location.toLowerCase().includes(query);
    const matchesDuration = durationFilter === 'all' || job.duration.toLowerCase().includes(durationFilter.toLowerCase().replace('short term (', '').replace('medium term (', '').replace('long term (', '').replace(')', ''));
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter);

    return matchesQuery && matchesDuration && matchesLocation;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:64px; color:var(--muted-text);">No work & stay opportunities found.</div>`;
    return;
  }

  filtered.forEach(job => {
    const card = document.createElement('div');
    card.className = 'market-card job-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.style.height = '100%';
    card.innerHTML = `
      <div class="market-details" style="padding: 16px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="market-badge" style="position: static; background: rgba(34, 139, 34, 0.15); color: #228B22; border: 1px solid #228B22; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 700;">${job.duration}</span>
            <span style="font-size: 11px; font-weight: 600; color: var(--muted-text);">${job.location}</span>
          </div>
          <h3 class="market-title" style="margin-bottom: 6px; font-size: 14px; font-weight: 700;">${job.title}</h3>
          <p style="font-size: 12px; color: var(--text-main); line-height: 1.4; margin-bottom: 12px;">${job.description}</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted-text);">Labor Required:</span> <strong style="color: var(--text-main);">${job.labor}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted-text);">Compensation:</span> <strong style="color: var(--accent-green);">${job.comp}</strong></div>
        </div>
      </div>
      <div class="market-footer" style="padding: 12px; border-top: 1px solid var(--border-color); background: var(--bg-sand); display: flex; justify-content: space-between; align-items: center; border-bottom-left-radius: var(--radius-md); border-bottom-right-radius: var(--radius-md);">
        <div class="market-seller" onclick="viewUserProfile('${job.host.name}')" style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <img src="${getAvatarSrc(job.host.avatar)}" alt="${job.host.name}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;" />
          <span style="font-size: 10px; font-weight: 600; color: var(--text-main);">${getUserRoleMarkup(job.host.name)}</span>
        </div>
        ${job.host.name !== State.currentUser.name ? `
          <button class="btn btn-sm btn-primary" onclick="contactHost('${job.host.name}', 'Work & Stay: ${job.title}')" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="message-square" style="width: 12px; height: 12px;"></i>
            <span>Message</span>
          </button>
        ` : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  lucide.createIcons();
}

function saveNewJobListing(event) {
  event.preventDefault();
  if (!requireAuth()) return;

  const title = document.getElementById('job-title').value.trim();
  const location = document.getElementById('job-location').value.trim();
  const duration = document.getElementById('job-duration').value.trim();
  const labor = document.getElementById('job-labor').value.trim();
  const comp = document.getElementById('job-comp').value.trim();
  const description = document.getElementById('job-desc').value.trim();

  if (!title || !location || !duration || !labor || !comp || !description) {
    showToast("Please fill all fields.", "error");
    return;
  }

  const newJob = {
    id: `job-${Date.now()}`,
    title: title,
    location: location,
    duration: duration,
    labor: labor,
    comp: comp,
    description: description,
    host: {
      name: State.currentUser.name,
      avatar: State.currentUser.avatar || 'avatar_bob'
    },
    date: new Date().toISOString().split('T')[0]
  };

  State.jobs.push(newJob);
  saveStateToStorage();
  closeModal('modal-add-job');
  
  // reset form
  document.getElementById('add-job-form').reset();
  
  if (State.activeTab === 'jobs') {
    renderJobsList();
  }
  showToast("Work & Stay opportunity posted successfully!", "success");
}

function saveMeetupComment(event, meetupId) {
  event.preventDefault();
  if (!requireAuth()) return;
  const input = document.getElementById(`meetup-comment-input-${meetupId}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  
  const meetup = State.meetups.find(m => m.id === meetupId);
  if (meetup) {
    if (!meetup.comments) meetup.comments = [];
    meetup.comments.push({
      id: `comment-${Date.now()}`,
      author: State.currentUser.name,
      avatar: State.currentUser.avatar || 'avatar_bob',
      text: text,
      time: "Just now"
    });
    input.value = '';
    saveStateToStorage();
    renderMeetupsList();
    showToast("Comment posted!");
  }
}

function shareMeetup(meetupId) {
  const url = `${window.location.origin}${window.location.pathname}?meetup=${meetupId}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Meetup sharing link copied to clipboard!", "success");
  }).catch(() => {
    showToast("Failed to copy link.", "error");
  });
}

function contactHost(hostName, meetupOrJobTitle) {
  if (!requireAuth()) return;
  openDirectChat(hostName);
  if (meetupOrJobTitle) {
    setTimeout(() => {
      const chatKey = hostName;
      if (State.chats) {
        if (!State.chats[chatKey]) State.chats[chatKey] = [];
        const alreadyAsked = State.chats[chatKey].some(m => m.text.includes(meetupOrJobTitle));
        if (!alreadyAsked) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            sender: State.currentUser.name,
            text: `Hi ${hostName}! I'm interested in: "${meetupOrJobTitle}". Can we chat?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reaction: false
          };
          State.chats[chatKey].push(newMsg);
          saveStateToStorage();
          renderActiveChats();
          renderContactsSidebar();
        }
      }
    }, 100);
  }
}

