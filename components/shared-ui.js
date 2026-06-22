/* ==========================================================================
   VANLYFA COMPONENT: SHARED-UI.JS
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
