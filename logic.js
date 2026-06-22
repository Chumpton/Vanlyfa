/* ==========================================================================
   VANLYFA CORE APPLICATION LOGIC & STATE - logic.js
   ========================================================================== */

// Global Application State (Loaded from localStorage or config.js defaults)
let State = {
  isOffline: false,
  syncQueue: [],
  bookings: [],
  jobs: [],
  notifications: [],
  currentUser: {
    name: "Guest Nomad",
    handle: "@guest",
    avatar: "avatar_guest",
    bio: "Signed out guest",
    rig: "",
    solar: "",
    power: "",
    water: "",
    spotsCount: 0,
    listingsCount: 0,
    reputation: 0,
    givenRepTo: []
  },
  users: typeof DefaultUsers !== 'undefined' ? DefaultUsers : [],
  activeProfileName: null,
  profileMap: null,
  profileMarkers: [],
  currentViewedSpotId: null,
  spots: typeof DefaultSpots !== 'undefined' ? DefaultSpots : [],
  meetups: typeof DefaultMeetups !== 'undefined' ? DefaultMeetups : [],
  posts: typeof DefaultPosts !== 'undefined' ? DefaultPosts : [],
  marketplace: typeof DefaultMarketplace !== 'undefined' ? DefaultMarketplace : [],
  tribes: [],
  tribeChats: {},
  tribeThreads: {},
  forum: typeof DefaultForum !== 'undefined' ? DefaultForum : [],
  activeTab: "dashboard",
  searchQuery: "",
  activeForumCategory: "all",
  activeThreadId: null,
  leafletMap: null,
  leafletTileLayer: null,
  mapMarkers: [],
  darkMode: true,
  activeChats: [],
  minimizedChats: [],
  chats: typeof DefaultChats !== 'undefined' ? JSON.parse(JSON.stringify(DefaultChats)) : {},
  unreadChats: [],
  layerFilters: { dispersed: true, overnight: true, services: true, hosts: true, mechanics: true, meetups: true }
};

const WELCOME_DISMISSED_STORAGE_KEY = 'vanlyfa_welcome_dismissed_v1';
const LOCATION_CACHE_STORAGE_KEY = 'vanlyfa_location_cache_v1';
const DEFAULT_LOCATION_CACHE = { status: 'not-present', lat: 5, lng: 5 };

function hasDismissedWelcome() {
  return localStorage.getItem(WELCOME_DISMISSED_STORAGE_KEY) === 'true';
}

function cacheWelcomeDismissal() {
  localStorage.setItem(WELCOME_DISMISSED_STORAGE_KEY, 'true');
}

function getCachedLocation() {
  const saved = localStorage.getItem(LOCATION_CACHE_STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.warn('Could not load cached location preference', error);
    return null;
  }
}

function cacheLocationNotPresent() {
  localStorage.setItem(LOCATION_CACHE_STORAGE_KEY, JSON.stringify(DEFAULT_LOCATION_CACHE));
}

function cacheLocationPresent(lat, lng, label = 'Current location') {
  localStorage.setItem(LOCATION_CACHE_STORAGE_KEY, JSON.stringify({
    status: 'present',
    lat,
    lng,
    label
  }));
}

function ensureLocationCacheFallback() {
  if (!getCachedLocation()) {
    cacheLocationNotPresent();
  }
}
function getSvgDataUri(svgString) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function saveStateToStorage() {
  localStorage.setItem('vanlyfa_state', JSON.stringify({
    spots: State.spots,
    meetups: State.meetups,
    posts: State.posts,
    marketplace: State.marketplace,
    tribes: State.tribes,
    tribeChats: State.tribeChats,
    tribeThreads: State.tribeThreads,
    forum: State.forum,
    currentUser: State.currentUser,
    users: State.users,
    chats: State.chats,
    activeChats: State.activeChats,
    minimizedChats: State.minimizedChats,
    unreadChats: State.unreadChats,
    syncQueue: State.syncQueue,
    isSignedIn: State.isSignedIn,
    bookings: State.bookings,
    notifications: State.notifications,
    jobs: State.jobs,
    layerFilters: State.layerFilters
  }));
}

function loadStateFromStorage() {
  const saved = localStorage.getItem('vanlyfa_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      
      State.spots = parsed.spots || State.spots;
      State.meetups = parsed.meetups || State.meetups;
      State.posts = parsed.posts || State.posts;
      State.marketplace = parsed.marketplace || State.marketplace;
      State.tribes = parsed.tribes || State.tribes;
      State.tribeChats = parsed.tribeChats || State.tribeChats;
      State.tribeThreads = parsed.tribeThreads || State.tribeThreads;
      State.forum = parsed.forum || State.forum;
      State.currentUser = parsed.currentUser || State.currentUser;
      State.users = parsed.users || State.users;
      State.chats = parsed.chats || State.chats;
      State.activeChats = parsed.activeChats || State.activeChats;
      State.minimizedChats = parsed.minimizedChats || State.minimizedChats;
      State.unreadChats = parsed.unreadChats || [];
      State.syncQueue = parsed.syncQueue || [];
      State.isSignedIn = parsed.isSignedIn !== undefined ? parsed.isSignedIn : false;
      State.bookings = parsed.bookings || [];
      State.notifications = parsed.notifications || State.notifications;
      State.jobs = parsed.jobs || State.jobs;
      State.layerFilters = parsed.layerFilters || State.layerFilters;
    } catch(e) {
      console.warn("Could not load stored state, using defaults", e);
      State.isSignedIn = false;
    }
  } else {
    State.isSignedIn = false;
  }

  // --- Inject seed data ---
  if (typeof SEED_SPOTS !== 'undefined' && SEED_SPOTS.length > 0) {
    const existingIds = new Set(State.spots.map(s => s.id));
    let injected = 0;
    SEED_SPOTS.forEach(seed => {
      if (!existingIds.has(seed.id)) {
        seed.seeded = true;
        State.spots.push(seed);
        injected++;
      }
    });
    if (injected > 0) console.log(`[VanLyfa] Injected ${injected} seed spots (${SEED_SPOTS.length} total in dataset)`);
    if (typeof ClusterEngine !== 'undefined') {
      ClusterEngine.init(State.spots.filter(s => s.seeded));
    }
  }
}

function getAvatarSrc(key) {
  if (key && key.startsWith('data:')) return key;
  const svg = SVG_ASSETS[key] || SVG_ASSETS.avatar_bob;
  return getSvgDataUri(svg);
}

function getImageSrc(key) {
  if (key && key.startsWith('data:')) return key;
  const svg = SVG_ASSETS[key] || SVG_ASSETS.image_desert;
  return getSvgDataUri(svg);
}

function getUserReputationBadge(name) {
  const user = State.users.find(u => u.name === name);
  const rep = user ? (user.reputation || 0) : 0;
  return ` <span class="user-rep-score" title="Reputation Points" style="color: var(--accent-green); font-weight: 700; font-size: 11px; margin-left: 2px;">★${rep}</span>`;
}

function requireAuth(action) {
  if (State.isSignedIn) {
    if (typeof action === 'function') action();
    return true;
  } else {
    openModal('modal-auth-required');
    return false;
  }
}

function simulateApiCall(successCallback, failureCallback) {
  setTimeout(() => {
    if (State.isOffline) {
      failureCallback();
    } else {
      if (Math.random() < 0.1) {
        failureCallback();
      } else {
        successCallback();
      }
    }
  }, 800);
}

function processSyncQueue() {
  if (State.isOffline || !State.syncQueue || State.syncQueue.length === 0) return;

  showToast(`Syncing ${State.syncQueue.length} offline action(s)...`, "info");
  
  const queue = [...State.syncQueue];
  State.syncQueue = [];
  saveStateToStorage();
  updateConnectionUI();

  queue.forEach(item => {
    if (item.type === 'CREATE_SPOT') {
      const tempSpot = State.spots.find(s => s.id === item.payload.id);
      if (tempSpot) {
        delete tempSpot.pendingSync;
      } else {
        State.spots.push(item.payload);
      }
    } else if (item.type === 'CREATE_THREAD') {
      const tempThread = State.forum.find(t => t.id === item.payload.id);
      if (tempThread) {
        delete tempThread.pendingSync;
      } else {
        State.forum.unshift(item.payload);
      }
    } else if (item.type === 'CREATE_REPLY') {
      const thread = State.forum.find(t => t.id === item.payload.threadId);
      if (thread) {
        const tempReply = thread.replies.find(r => r.body === item.payload.reply.body && r.pendingSync);
        if (tempReply) {
          delete tempReply.pendingSync;
        } else {
          thread.replies.push(item.payload.reply);
          thread.repliesCount++;
        }
      }
    }
  });

  saveStateToStorage();
  
  renderLeafletMarkers();
  renderForumView();
  if (State.activeThreadId) {
    renderThreadDetail();
  }

  showToast("Offline data successfully synchronized!", "success");
}

function toggleLike(postId) {
  if (!requireAuth()) return;
  const post = State.posts.find(p => p.id === postId);
  if (post) {
    const originalLiked = post.likedByUser;
    const originalLikes = post.likes;

    if (post.likedByUser) {
      post.likes = Math.max(0, post.likes - 1);
      post.likedByUser = false;
    } else {
      post.likes++;
      post.likedByUser = true;
    }

    State._cachedFeeds = {};
    renderDashboardFeed();
    renderFeedTabPosts();

    simulateApiCall(
      () => {
        saveStateToStorage();
      },
      () => {
        post.likedByUser = originalLiked;
        post.likes = originalLikes;
        State._cachedFeeds = {};
        renderDashboardFeed();
        renderFeedTabPosts();
        showToast("Network sync failed. Like rolled back.", "error");
      }
    );
  }
}

function submitComment(e, postId) {
  e.preventDefault();
  if (!requireAuth()) return;
  const input = document.getElementById(`comment-input-${postId}`);
  if (input && input.value.trim() !== '') {
    const post = State.posts.find(p => p.id === postId);
    if (post) {
      post.comments.push({
        user: State.currentUser.name,
        text: input.value.trim()
      });
      input.value = '';
      State._cachedFeeds = {};
      saveStateToStorage();
      renderDashboardFeed();
      renderFeedTabPosts();
    }
  }
}

function resolveZipCoordinates(zip) {
  if (ZIP_DATABASE[zip]) return ZIP_DATABASE[zip];
  if (/^\d{5}$/.test(zip)) {
    let hash = 0;
    for (let i = 0; i < zip.length; i++) {
      hash = zip.charCodeAt(i) + ((hash << 5) - hash);
    }
    const mockLat = 30 + (Math.abs(hash % 1000) / 1000) * 18;
    const mockLng = -124 + (Math.abs((hash >> 3) % 1000) / 1000) * 55;
    return { lat: mockLat, lng: mockLng, city: `Zip ${zip}` };
  }
  return null;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toggleMeetupRsvp(meetupId) {
  if (!requireAuth()) return;
  const meetup = State.meetups.find(m => m.id === meetupId);
  if (meetup) {
    const userAvatar = State.currentUser ? State.currentUser.avatar : 'avatar_bob';
    const idx = meetup.attendees.indexOf(userAvatar);
    if (idx > -1) {
      // cancel
      meetup.attendees.splice(idx, 1);
      meetup.attendeesCount--;
      showToast("Cancelled your RSVP.");
    } else {
      // rsvp
      meetup.attendees.push(userAvatar);
      meetup.attendeesCount++;
      showToast("RSVP confirmed! See you at camp.", "success");
    }
    saveStateToStorage();
    renderMeetupsList();
  }
}

function submitForumReply() {
  const textInput = document.getElementById('forum-reply-text');
  const body = textInput.value.trim();
  if (body === '') return;
  
  const thread = State.forum.find(t => t.id === State.activeThreadId);
  if (thread) {
    const newReply = {
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      date: "Just now",
      body: body
    };

    if (State.isOffline) {
      newReply.pendingSync = true;
      thread.replies.push(newReply);
      thread.repliesCount++;
      State.syncQueue.push({
        type: 'CREATE_REPLY',
        payload: { threadId: State.activeThreadId, reply: newReply }
      });
      saveStateToStorage();
      updateConnectionUI();
      showToast("Offline mode: reply queued for sync!", "warning");
    } else {
      thread.replies.push(newReply);
      thread.repliesCount++;
      saveStateToStorage();
      showToast("Reply published!", "success");
    }
    
    textInput.value = '';
    renderThreadDetail();
  }
}

function toggleFriend() {
  if (!requireAuth()) return;
  const user = getActiveUser();
  if (user.name === State.currentUser.name) return;
  
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  if (!currentUserObj) return;
  
  if (!currentUserObj.friends) currentUserObj.friends = [];
  if (!user.friends) user.friends = [];
  
  const isFriend = currentUserObj.friends.includes(user.name);
  
  if (isFriend) {
    currentUserObj.friends = currentUserObj.friends.filter(name => name !== user.name);
    user.friends = user.friends.filter(name => name !== currentUserObj.name);
    showToast(`Removed ${user.name} from friends.`, "info");
  } else {
    currentUserObj.friends.push(user.name);
    user.friends.push(currentUserObj.name);
    showToast(`Added ${user.name} as a friend!`, "success");
  }
  
  saveStateToStorage();
  renderUserProfile();
}

function toggleReputation() {
  if (!requireAuth()) return;
  const user = getActiveUser();
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  if (!currentUserObj || !user || user.name === currentUserObj.name) return;
  
  if (!currentUserObj.givenRepTo) currentUserObj.givenRepTo = [];
  
  if (currentUserObj.givenRepTo.includes(user.name)) {
    // Remove reputation
    currentUserObj.givenRepTo = currentUserObj.givenRepTo.filter(name => name !== user.name);
    user.reputation = Math.max(0, (user.reputation || 0) - 1);
    showToast(`Removed reputation point from ${user.name}`, 'info');
  } else {
    // Give reputation
    currentUserObj.givenRepTo.push(user.name);
    user.reputation = (user.reputation || 0) + 1;
    showToast(`Gave 1 reputation point to ${user.name}!`, 'success');
  }
  
  // Sync currentUser properties
  if (currentUserObj.name === State.currentUser.name) {
    State.currentUser.givenRepTo = currentUserObj.givenRepTo;
  }
  
  saveStateToStorage();
  renderUserProfile();
}

function markCurrentSpotAsVisited() {
  if (!requireAuth()) return;
  if (!State.currentViewedSpotId) return;
  
  const currentUserObj = State.users.find(u => u.name === State.currentUser.name);
  if (currentUserObj) {
    if (!currentUserObj.visitedSpots) currentUserObj.visitedSpots = [];
    if (!currentUserObj.visitedSpots.includes(State.currentViewedSpotId)) {
      currentUserObj.visitedSpots.push(State.currentViewedSpotId);
      saveStateToStorage();
      showToast("Spot marked as visited!", "success");
      
      const btn = document.getElementById('drawer-mark-visited-btn');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> <span>Visited</span>`;
        btn.classList.remove('btn-primary');
        lucide.createIcons();
      }
    } else {
      currentUserObj.visitedSpots = currentUserObj.visitedSpots.filter(id => id !== State.currentViewedSpotId);
      saveStateToStorage();
      showToast("Spot removed from visited list.", "info");
      
      const btn = document.getElementById('drawer-mark-visited-btn');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check-square" style="width: 14px; height: 14px;"></i> <span>Mark as Visited</span>`;
        btn.classList.add('btn-primary');
        lucide.createIcons();
      }
    }
  }
}

function toggleVouchSpot(spotId) {
  if (!requireAuth()) return;
  const spot = State.spots.find(s => s.id === spotId);
  if (!spot) return;

  if (!spot.vouchedBy) spot.vouchedBy = [];
  const userName = State.currentUser.name;
  const alreadyVouched = spot.vouchedBy.includes(userName);
  
  // Optimistic UI Update
  if (alreadyVouched) {
    spot.vouchedBy = spot.vouchedBy.filter(u => u !== userName);
    spot.vouches = Math.max(0, (spot.vouches || 0) - 1);
  } else {
    spot.vouchedBy.push(userName);
    spot.vouches = (spot.vouches || 0) + 1;
  }
  
  updateVouchUI(spot);
  showToast(alreadyVouched ? "Removing vouch..." : "Vouching spot...", "info");

  simulateApiCall(
    () => {
      saveStateToStorage();
      showToast(alreadyVouched ? "Removed vouch!" : "Vouched spot successfully!", "success");
    },
    () => {
      if (alreadyVouched) {
        spot.vouchedBy.push(userName);
        spot.vouches++;
      } else {
        spot.vouchedBy = spot.vouchedBy.filter(u => u !== userName);
        spot.vouches = Math.max(0, spot.vouches - 1);
      }
      updateVouchUI(spot);
      showToast("Failed to sync vouch with server. Rollback applied.", "error");
    }
  );
}

function handleProfilePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const statusSpan = document.getElementById('profile-photo-upload-status');
    if (statusSpan) statusSpan.innerText = "Photo uploaded and ready to save!";
    
    State.currentUser.avatar = dataUrl;
    showToast("Profile photo loaded! Click Save to apply.", "success");
  };
  reader.readAsDataURL(file);
}

function handleRigPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    
    const user = getActiveUser();
    if (!user.gallery) user.gallery = [];
    user.gallery.push(dataUrl);
    
    saveStateToStorage();
    renderUserProfile();
    showToast("Rig photo added to gallery!", "success");
  };
  reader.readAsDataURL(file);
}

function handleListingPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const preview = document.getElementById('list-photo-preview');
    const container = document.getElementById('list-photo-preview-container');
    const select = document.getElementById('list-img-select');
    
    if (preview && container && select) {
      preview.src = dataUrl;
      container.style.display = 'block';
      select.value = 'custom';
      showToast("Listing photo loaded successfully!", "success");
    }
  };
  reader.readAsDataURL(file);
}

function toggleTribeHubMembership(tribeId) {
  if (!requireAuth()) return;
  const tribe = State.tribes.find(t => t.id === tribeId);
  if (tribe) {
    if (tribe.joined) {
      tribe.joined = false;
      tribe.membersCount--;
      showToast(`Left the "${tribe.title}" tribe.`);
    } else {
      tribe.joined = true;
      tribe.membersCount++;
      showToast(`Joined the "${tribe.title}" tribe!`, 'success');
    }
    saveStateToStorage();
    renderTribeHubHeader(tribeId);
    
    // Re-render chat/forum to apply join/leave lock overlays
    const activeTab = document.querySelector('.tribe-hub-tabs .tab-btn.active').id.includes('chat') ? 'chat' : 'forum';
    switchTribeHubTab(activeTab);
  }
}

function sendTribeChatMessage(e) {
  e.preventDefault();
  if (!requireAuth()) return;
  const tribeId = State.activeTribeId;
  const input = document.getElementById('tribe-chat-input');
  if (!tribeId || !input || input.value.trim() === '') return;
  
  if (!State.tribeChats) State.tribeChats = {};
  if (!State.tribeChats[tribeId]) State.tribeChats[tribeId] = [];
  
  State.tribeChats[tribeId].push({
    sender: State.currentUser.name,
    text: input.value.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  input.value = '';
  saveStateToStorage();
  renderTribeHubChat(tribeId);
  
  setTimeout(() => {
    if (State.activeTribeId === tribeId) {
      const responses = [
        "That sounds awesome! Totally agree.",
        "Good tip, thanks for sharing!",
        "Has anyone camped near there recently?",
        "Swapping solar power is the way to go.",
        "Perfect day for an off-grid build update!"
      ];
      const randomMsg = responses[Math.floor(Math.random() * responses.length)];
      const senders = ["Clara Outdoors", "Forest Nomad", "Baja Surfer", "Solar Explorer"];
      const randomSender = senders[Math.floor(Math.random() * senders.length)];
      
      State.tribeChats[tribeId].push({
        sender: randomSender,
        text: randomMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      saveStateToStorage();
      renderTribeHubChat(tribeId);
    }
  }, 1500);
}

function submitTribeThreadReply(e, tribeId, threadId) {
  e.preventDefault();
  if (!requireAuth()) return;
  const input = e.target.querySelector('input');
  if (!input || input.value.trim() === '') return;
  
  const thread = State.tribeThreads[tribeId].find(t => t.id === threadId);
  if (thread) {
    if (!thread.replies) thread.replies = [];
    thread.replies.push({
      author: State.currentUser.name,
      body: input.value.trim()
    });
    input.value = '';
    saveStateToStorage();
    renderTribeHubForum(tribeId);
    showToast("Reply published!", "success");
  }
}

function toggleTribeMembership(tribeId) {
  if (!requireAuth()) return;
  const tribe = State.tribes.find(t => t.id === tribeId);
  if (tribe) {
    if (tribe.joined) {
      tribe.joined = false;
      tribe.membersCount--;
      showToast(`Left the "${tribe.title}" tribe.`);
    } else {
      tribe.joined = true;
      tribe.membersCount++;
      showToast(`Joined the "${tribe.title}" tribe!`, 'success');
    }
    saveStateToStorage();
    renderTribesList();
  }
}

function sendChatMessage(username, text) {
  if (!requireAuth()) return;
  if (!State.chats[username]) State.chats[username] = [];
  
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const newMsg = {
    id: `msg-${Date.now()}`,
    sender: State.currentUser.name,
    text: text,
    time: timeString,
    reaction: false
  };
  
  State.chats[username].push(newMsg);
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  setTimeout(() => {
    triggerMockReply(username, text);
  }, 1500);
}

function toggleHeartReaction(username, msgId) {
  const messages = State.chats[username] || [];
  const msg = messages.find(m => m.id === msgId);
  if (msg) {
    msg.reaction = !msg.reaction;
    saveStateToStorage();
    renderActiveChats();
  }
}

function triggerMockReply(username, userText) {
  const replies = {
    "Clara Outdoors": [
      "That sounds great! I'm currently driving through Utah, cell signal is spotty but I'll check in when I camp.",
      "Awesome Bob! Let's save a camp spot together at Quartzsite.",
      "Haha definitely! Off-grid is the only way 🌲",
      "I'm actually testing out some solar upgrades today, will send pictures soon!"
    ],
    "Forest Nomad": [
      "Thanks Bob! Cedars are perfect for van ceilings.",
      "Hey! Glad you liked it. Let me know if you need any cabinetry dimensions.",
      "Totally agree! Standard plywood just doesn't compare.",
      "I'm working on a sliding bed platform build this week, woodwork takes patience!"
    ],
    "Solar Explorer": [
      "Hey Bob! Yeah, Victron parts are pricey but the reliability is worth it.",
      "I always suggest fuses directly off the busbars. Safety first!",
      "Are you looking at lithium or AGM? AGM is cheaper but lithium lasts 10x longer.",
      "Just got back from mapping some dry camping spots, will vouch them on the map soon."
    ],
    "Baja Surfer": [
      "Baja camp has been perfect, swell is looking clean tomorrow!",
      "Calexico is definitely the easiest crossing, very quiet.",
      "Fish tacos here are like $1 each, living the dream!",
      "Catch you around camp Bob!"
    ]
  };
  
  const list = replies[username] || ["Hey Bob! Good talking to you. Let's catch up at the next camp spot!"];
  const text = list[Math.floor(Math.random() * list.length)];
  
  simulateAutoReply(username, text, 1000);
}

function simulateAutoReply(username, text, delay) {
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const replyMsg = {
    id: `msg-${Date.now()}`,
    sender: username,
    text: text,
    time: timeString,
    reaction: false
  };
  
  if (!State.chats[username]) State.chats[username] = [];
  State.chats[username].push(replyMsg);
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  showToast(`New message from ${username}`);
}
