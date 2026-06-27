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
  const popoutDot = document.getElementById('mobile-popout-conn-dot');
  const popoutText = document.getElementById('mobile-popout-conn-text');
  
  if (State.isOffline) {
    if (connectionBtn) {
      const dot = connectionBtn.querySelector('.status-indicator-dot');
      const text = connectionBtn.querySelector('.status-indicator-text');
      if (dot) dot.style.backgroundColor = '#ef4444';
      if (text) {
        const pendingCount = State.syncQueue ? State.syncQueue.length : 0;
        text.innerText = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline';
      }
      connectionBtn.title = 'Switch to Online Mode';
      connectionBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      connectionBtn.style.background = 'rgba(239, 68, 68, 0.1)';
    }
    if (popoutDot) popoutDot.style.backgroundColor = '#ef4444';
    if (popoutText) popoutText.innerText = 'Offline Mode';
  } else {
    if (connectionBtn) {
      const dot = connectionBtn.querySelector('.status-indicator-dot');
      const text = connectionBtn.querySelector('.status-indicator-text');
      if (dot) dot.style.backgroundColor = 'var(--accent-green)';
      if (text) text.innerText = 'Online';
      connectionBtn.title = 'Switch to Offline Mode';
      connectionBtn.style.borderColor = 'var(--border-color)';
      connectionBtn.style.background = 'var(--bg-card)';
    }
    if (popoutDot) popoutDot.style.backgroundColor = 'var(--accent-green)';
    if (popoutText) popoutText.innerText = 'Online Mode';
  }
}

function updateThemeToggleUI() {
  const icon = document.getElementById('theme-icon');
  const popoutIcon = document.getElementById('mobile-popout-theme-icon');
  const popoutText = document.getElementById('mobile-popout-theme-text');
  
  if (State.darkMode) {
    if (icon) icon.setAttribute('data-lucide', 'sun');
    if (popoutIcon) popoutIcon.setAttribute('data-lucide', 'sun');
    if (popoutText) popoutText.innerText = 'Light Mode';
  } else {
    if (icon) icon.setAttribute('data-lucide', 'moon');
    if (popoutIcon) popoutIcon.setAttribute('data-lucide', 'moon');
    if (popoutText) popoutText.innerText = 'Dark Mode';
  }
  if (window.lucide) {
    lucide.createIcons();
  }
  if (window.updateMapTheme) {
    window.updateMapTheme();
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
  const photoUpload = document.getElementById('feed-tab-photo-upload');

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
    if (photoUpload) {
      photoUpload.disabled = false;
      const parentLabel = photoUpload.parentElement;
      if (parentLabel) {
        parentLabel.style.opacity = '1';
        parentLabel.style.pointerEvents = 'auto';
      }
    }
    document.querySelectorAll('.feed-tab-post-creator .btn-format').forEach(btn => {
      btn.disabled = false;
    });
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
    if (photoUpload) {
      photoUpload.disabled = true;
      const parentLabel = photoUpload.parentElement;
      if (parentLabel) {
        parentLabel.style.opacity = '0.5';
        parentLabel.style.pointerEvents = 'none';
      }
    }
    document.querySelectorAll('.feed-tab-post-creator .btn-format').forEach(btn => {
      btn.disabled = true;
    });
  }

  // Synchronize mobile top header avatar and popout menu
  const mobileTopAvatar = document.getElementById('mobile-top-avatar');
  const mobilePopoutAvatar = document.getElementById('mobile-popout-avatar');
  const mobilePopoutName = document.getElementById('mobile-popout-name');
  const mobilePopoutHandle = document.getElementById('mobile-popout-handle');
  const mobilePopoutAuthBtn = document.getElementById('mobile-popout-auth-btn');

  const mobilePopoutPremiumBtn = document.getElementById('mobile-popout-premium-btn');

  if (State.isSignedIn) {
    if (mobileTopAvatar) mobileTopAvatar.src = getAvatarSrc(State.currentUser.avatar);
    if (mobilePopoutAvatar) mobilePopoutAvatar.src = getAvatarSrc(State.currentUser.avatar);
    if (mobilePopoutName) mobilePopoutName.innerText = State.currentUser.name;
    if (mobilePopoutHandle) mobilePopoutHandle.innerText = State.currentUser.handle;
    if (mobilePopoutAuthBtn) {
      mobilePopoutAuthBtn.innerHTML = `<i data-lucide="log-out" style="width: 16px; height: 16px;"></i> <span>Sign Out</span>`;
      mobilePopoutAuthBtn.className = 'btn btn-secondary';
    }
    if (mobilePopoutPremiumBtn) {
      mobilePopoutPremiumBtn.style.display = 'none';
    }
  } else {
    if (mobileTopAvatar) mobileTopAvatar.src = getAvatarSrc('avatar_guest');
    if (mobilePopoutAvatar) mobilePopoutAvatar.src = getAvatarSrc('avatar_guest');
    if (mobilePopoutName) mobilePopoutName.innerText = "Guest Nomad";
    if (mobilePopoutHandle) mobilePopoutHandle.innerText = "@guest";
    if (mobilePopoutAuthBtn) {
      mobilePopoutAuthBtn.innerHTML = `<i data-lucide="log-in" style="width: 16px; height: 16px;"></i> <span>Sign In</span>`;
      mobilePopoutAuthBtn.className = 'btn btn-primary';
    }
    if (mobilePopoutPremiumBtn) {
      mobilePopoutPremiumBtn.style.display = 'none';
    }
  }
  if (window.lucide) {
    lucide.createIcons();
  }
  
  const adminTab = document.getElementById('sidebar-admin-tab');
  const mobileAdminTab = document.getElementById('mobile-drawer-admin-tab');
  const isAdmin = State.isSignedIn && State.currentUser.role === 'admin';
  
  if (adminTab) {
    adminTab.style.display = isAdmin ? 'flex' : 'none';
  }
  if (mobileAdminTab) {
    mobileAdminTab.style.display = isAdmin ? 'flex' : 'none';
  }
  
  const messagesTab = document.querySelector('.app-sidebar .nav-item[data-tab="messages"]');
  const mobileMessagesTab = document.querySelector('.mobile-drawer-item[data-tab="messages"]');
  if (messagesTab) {
    messagesTab.style.display = State.isSignedIn ? 'flex' : 'none';
  }
  if (mobileMessagesTab) {
    mobileMessagesTab.style.display = State.isSignedIn ? 'flex' : 'none';
  }
  
  if (!isAdmin && State.activeTab === 'admin') {
    switchTab('dashboard');
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
  
  if (user) {
    rep = user.reputation || 0;
  }
  
  let baseMarkup = '';
  if (rep >= 30) {
    baseMarkup = `<span class="role-name-elite" style="color: #F59E0B; font-weight: 700; text-shadow: 0 0 2px rgba(245, 158, 11, 0.2);">${cleanName}</span><span class="role-badge-elite" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid #F59E0B; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; margin-left: 4px; vertical-align: middle;">★ ELITE</span>`;
  } else if (rep >= 20) {
    baseMarkup = `<span class="role-name-veteran" style="color: #F97316; font-weight: 700;">${cleanName}</span><span class="role-badge-veteran" style="background: rgba(249, 115, 22, 0.15); color: #F97316; border: 1px solid #F97316; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; margin-left: 4px; vertical-align: middle;">VET</span>`;
  } else if (rep >= 10) {
    baseMarkup = `<span class="role-name-explorer" style="color: #3B82F6; font-weight: 600;">${cleanName}</span><span class="role-badge-explorer" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6; border: 1px solid #3B82F6; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 600; margin-left: 4px; vertical-align: middle;">EXPLORER</span>`;
  } else {
    baseMarkup = `<span class="role-name-nomad" style="color: var(--text-main); font-weight: 500;">${cleanName}</span><span class="role-badge-nomad" style="background: rgba(120, 120, 120, 0.1); color: var(--muted-text); border: 1px solid rgba(120, 120, 120, 0.2); border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 500; margin-left: 4px; vertical-align: middle;">NOMAD</span>`;
  }

  /* Premium verified badge is hidden for initial launch
  if (user && user.isPremium) {
    baseMarkup += `<span class="role-badge-premium" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid #10B981; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; margin-left: 4px; vertical-align: middle; display: inline-flex; align-items: center; gap: 2px;">✔ VERIFIED</span>`;
  }
  */

  return baseMarkup;
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

function parseMarkdownToHtml(text) {
  if (!text) return '';
  // Escape HTML to prevent XSS
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Bold: **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text*
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Hashtags: #moab -> clickable search trigger
  escaped = escaped.replace(/#(\w+)/g, '<span class="hashtag" style="color:var(--accent-green); cursor:pointer; font-weight:600;" onclick="window.triggerHashtagSearch(\'#$1\')">#$1</span>');
  
  // Inline Code: `code`
  escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Blockquotes: Lines starting with >
  // Note: since we escaped >, they are now &gt;
  const lines = escaped.split('\n');
  const processedLines = lines.map(line => {
    if (line.trim().startsWith('&gt;')) {
      const content = line.trim().slice(4).trim();
      return `<blockquote style="border-left: 3px solid var(--accent-green); padding-left: 10px; margin: 6px 0; color: var(--muted-text); font-style: italic;">${content}</blockquote>`;
    }
    return line;
  });
  
  return processedLines.join('<br>');
}

/* ==========================================================================
   NOTIFICATIONS MANAGEMENT
   ========================================================================== */
function renderNotifications() {
  const list = document.getElementById('notifications-list');
  const badge = document.getElementById('bell-unread-badge');
  const feedBadge = document.getElementById('nav-feed-badge');
  if (!list) return;

  const unreadCount = State.notifications.filter(n => !n.read).length;
  
  if (badge) {
    if (unreadCount > 0) {
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  if (feedBadge) {
    if (unreadCount > 0) {
      feedBadge.innerText = unreadCount;
      feedBadge.style.display = 'flex';
    } else {
      feedBadge.style.display = 'none';
    }
  }

  if (!window._notifBellWired) {
    window._notifBellWired = true;
    const bellBtn = document.getElementById('notif-bell-btn');
    if (bellBtn) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
          const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
          dropdown.style.display = isHidden ? 'flex' : 'none';
          if (isHidden) {
            State.notifications.forEach(n => n.read = true);
            saveStateToStorage();
            renderNotifications();
          }
        }
      });
    }
    document.addEventListener('click', () => {
      const dropdown = document.getElementById('notifications-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    });
  }

  list.innerHTML = '';
  if (State.notifications.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:16px; color:var(--muted-text); font-size:12px;">No notifications.</div>';
    return;
  }

  State.notifications.forEach(n => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = '8px 12px';
    item.style.borderRadius = 'var(--radius-sm)';
    item.style.background = n.read ? 'transparent' : 'rgba(59,122,87,0.08)';
    item.style.border = '1px solid ' + (n.read ? 'var(--border-color)' : 'var(--accent-green-light)');
    item.style.fontSize = '12px';
    item.style.gap = '8px';

    item.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0; text-align: left;">
        <span style="color: var(--text-main); font-weight: ${n.read ? '500' : '600'};">${n.content}</span>
        <span style="color: var(--muted-text); font-size: 10px;">${n.time || ''}</span>
      </div>
      ${!n.read ? `<button class="btn btn-xs btn-primary" onclick="markNotificationRead('${n.id}')" style="padding: 2px 6px; font-size: 9px; margin-left: 8px; height: auto;">Read</button>` : ''}
    `;
    list.appendChild(item);
  });
  
  if (window.lucide) lucide.createIcons();
}

function clearNotifications() {
  State.notifications = [];
  saveStateToStorage();
  renderNotifications();
}

function markNotificationRead(id) {
  const notification = State.notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    saveStateToStorage();
    renderNotifications();
  }
}

window.triggerHashtagSearch = function(tag) {
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.value = tag;
    State.searchQuery = tag.toLowerCase();
    renderCurrentTab();
  }
};
