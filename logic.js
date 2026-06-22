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
    givenRepTo: [],
    savedPostIds: [],
    savedMeetupIds: []
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
  tribes: typeof DefaultTribes !== 'undefined' ? JSON.parse(JSON.stringify(DefaultTribes)) : [],
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
  layerFilters: { dispersed: true, overnight: true, services: true, hosts: true, mechanics: true, meetups: true },
  postCropState: { img: null, zoom: 1.0, x: 0, y: 0, isDragging: false, dragStart: { x: 0, y: 0 } },
  feedTabCropState: { img: null, zoom: 1.0, x: 0, y: 0, isDragging: false, dragStart: { x: 0, y: 0 } },
  listingCropState: { img: null, zoom: 1.0, x: 0, y: 0, isDragging: false, dragStart: { x: 0, y: 0 } },
  threadCropState: { img: null, zoom: 1.0, x: 0, y: 0, isDragging: false, dragStart: { x: 0, y: 0 } },
  tribeIconCropState: { img: null, zoom: 1.0, x: 0, y: 0, isDragging: false, dragStart: { x: 0, y: 0 } },
  tribeBannerCropState: { img: null, zoom: 1.0, x: 0, y: 0, isDragging: false, dragStart: { x: 0, y: 0 } },
  feedbacks: [],
  isSelectingMeetupLocation: false
};

const WELCOME_DISMISSED_STORAGE_KEY = 'vanlyfa_welcome_dismissed_v2';
const GPS_ASKED_STORAGE_KEY = 'vanlyfa_gps_asked_v2';
const SIGNUP_ENCOURAGED_STORAGE_KEY = 'vanlyfa_signup_encouraged_v2';
const LOCATION_CACHE_STORAGE_KEY = 'vanlyfa_location_cache_v2';
const DEFAULT_LOCATION_CACHE = { status: 'not-present', lat: 5, lng: 5 };

function hasDismissedWelcome() {
  return localStorage.getItem(WELCOME_DISMISSED_STORAGE_KEY) === 'true';
}

function cacheWelcomeDismissal() {
  localStorage.setItem(WELCOME_DISMISSED_STORAGE_KEY, 'true');
}

function hasAskedGps() {
  return localStorage.getItem(GPS_ASKED_STORAGE_KEY) === 'true';
}

function cacheGpsAsked() {
  localStorage.setItem(GPS_ASKED_STORAGE_KEY, 'true');
}

function hasEncouragedSignup() {
  return localStorage.getItem(SIGNUP_ENCOURAGED_STORAGE_KEY) === 'true';
}

function cacheSignupEncouraged() {
  localStorage.setItem(SIGNUP_ENCOURAGED_STORAGE_KEY, 'true');
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
    layerFilters: State.layerFilters,
    feedbacks: State.feedbacks
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
      if (!State.tribes || State.tribes.length === 0) {
        State.tribes = typeof DefaultTribes !== 'undefined' ? JSON.parse(JSON.stringify(DefaultTribes)) : [];
      }
      State.tribeChats = parsed.tribeChats || State.tribeChats;
      State.tribeThreads = parsed.tribeThreads || State.tribeThreads;
      State.forum = parsed.forum || State.forum;
      State.currentUser = parsed.currentUser || State.currentUser;
      if (State.currentUser) {
        State.currentUser.savedPostIds = State.currentUser.savedPostIds || [];
        State.currentUser.savedMeetupIds = State.currentUser.savedMeetupIds || [];
      }
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
      State.feedbacks = parsed.feedbacks || [];
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

function findPostOrItem(postId) {
  const strId = String(postId || '');
  let target = null;
  let array = null;
  if (strId.startsWith('market-post-')) {
    const rawId = strId.replace('market-post-', '');
    target = State.marketplace.find(m => String(m.id) === rawId);
    array = State.marketplace;
  } else if (strId.startsWith('meetup-post-')) {
    const rawId = strId.replace('meetup-post-', '');
    target = State.meetups.find(m => String(m.id) === rawId);
    array = State.meetups;
  } else if (strId.startsWith('spot-post-')) {
    const rawId = strId.replace('spot-post-', '');
    target = State.spots.find(s => String(s.id) === rawId);
    array = State.spots;
  } else {
    target = State.posts.find(p => String(p.id) === strId);
    array = State.posts;
  }
  return { target, array };
}

function toggleLike(postId) {
  if (!requireAuth()) return;
  const { target } = findPostOrItem(postId);
  if (target) {
    const originalLiked = target.likedByUser;
    const originalLikes = target.likes || 0;

    if (target.likedByUser) {
      target.likes = Math.max(0, originalLikes - 1);
      target.likedByUser = false;
    } else {
      target.likes = originalLikes + 1;
      target.likedByUser = true;
    }

    State._cachedFeeds = {};
    renderDashboardFeed();
    renderFeedTabPosts();

    simulateApiCall(
      () => {
        saveStateToStorage();
      },
      () => {
        target.likedByUser = originalLiked;
        target.likes = originalLikes;
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
    const { target } = findPostOrItem(postId);
    if (target) {
      if (!target.comments) target.comments = [];
      target.comments.push({
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

let cropState = {
  img: null,
  zoom: 1.0,
  x: 100,
  y: 100,
  isDragging: false,
  dragStart: { x: 0, y: 0 }
};

function drawCropImage(canvas, drawBorder = true) {
  const ctx = canvas.getContext('2d');
  const img = cropState.img;
  if (!img) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  // Clip to circle circular viewport
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.clip();
  
  // Scale factor to make image fit
  const scale = Math.max(200 / img.width, 200 / img.height) * cropState.zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  
  ctx.drawImage(img, cropState.x - w / 2, cropState.y - h / 2, w, h);
  ctx.restore();
  
  if (drawBorder) {
    ctx.beginPath();
    ctx.arc(100, 100, 99, 0, Math.PI * 2);
    ctx.strokeStyle = '#3B7A57';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function initCropHandlers(canvas, zoomInput) {
  if (canvas._hasCropHandlers) return;
  canvas._hasCropHandlers = true;
  
  const onStart = (e) => {
    cropState.isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropState.dragStart = { x: clientX - cropState.x, y: clientY - cropState.y };
  };
  
  const onMove = (e) => {
    if (!cropState.isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropState.x = clientX - cropState.dragStart.x;
    cropState.y = clientY - cropState.dragStart.y;
    drawCropImage(canvas);
  };
  
  const onEnd = () => {
    cropState.isDragging = false;
  };
  
  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
  
  zoomInput.addEventListener('input', (e) => {
    cropState.zoom = parseFloat(e.target.value);
    drawCropImage(canvas);
  });
}

function handleProfilePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const workspace = document.getElementById('avatar-crop-workspace');
    if (!workspace) return;
    
    workspace.style.display = 'flex';
    const canvas = document.getElementById('avatar-crop-canvas');
    const zoomInput = document.getElementById('avatar-crop-zoom');
    
    cropState.img = new Image();
    cropState.img.onload = function() {
      cropState.zoom = 1.0;
      cropState.x = 100;
      cropState.y = 100;
      zoomInput.value = 1.0;
      
      initCropHandlers(canvas, zoomInput);
      drawCropImage(canvas);
      
      const statusSpan = document.getElementById('profile-photo-upload-status');
      if (statusSpan) statusSpan.innerText = "Position and zoom your photo below.";
      showToast("Reposition and zoom your avatar inside the preview circle!", "info");
    };
    cropState.img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function handleRigPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // File size validation (max 2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    showToast("File size exceeds 2MB limit. Please upload a smaller image.", "error");
    e.target.value = '';
    return;
  }
  
  // Gallery size check (max 3 images)
  const user = getActiveUser();
  if (!user.gallery) user.gallery = [];
  if (user.gallery.length >= 3) {
    showToast("Maximum of 3 rig photos allowed.", "error");
    e.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    
    user.gallery.push(dataUrl);
    saveStateToStorage();
    renderUserProfile();
    showToast("Rig photo added to gallery!", "success");
  };
  reader.readAsDataURL(file);
}

function handleGenericPhotoUpload(e, cropObj, canvasId, zoomInputId, workspaceId, statusId) {
  const file = e.target.files[0];
  if (!file) return;
  
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_FILE_SIZE) {
    showToast("File size exceeds 2MB limit. Please upload a smaller image.", "error");
    e.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const workspace = document.getElementById(workspaceId);
    if (!workspace) return;
    
    workspace.style.display = 'flex';
    const canvas = document.getElementById(canvasId);
    const zoomInput = document.getElementById(zoomInputId);
    
    cropObj.img = new Image();
    cropObj.img.onload = function() {
      cropObj.zoom = 1.0;
      cropObj.x = canvas.width / 2;
      cropObj.y = canvas.height / 2;
      zoomInput.value = 1.0;
      
      initGenericCropHandlers(cropObj, canvas, zoomInput, (drawBorder) => {
        drawGenericCrop(cropObj, canvas, drawBorder);
      });
      drawGenericCrop(cropObj, canvas, true);
      
      const statusSpan = document.getElementById(statusId);
      if (statusSpan) statusSpan.innerText = "Position and zoom your photo below.";
      showToast("Reposition and zoom your photo inside the box!", "info");
    };
    cropObj.img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function handleListingPhotoUpload(e) {
  handleGenericPhotoUpload(e, State.listingCropState, 'list-crop-canvas', 'list-crop-zoom', 'list-crop-workspace', 'list-photo-upload-status');
}

function handlePostPhotoUpload(e) {
  handleGenericPhotoUpload(e, State.postCropState, 'post-crop-canvas', 'post-crop-zoom', 'post-crop-workspace', 'post-photo-upload-status');
}

function handleFeedTabPhotoUpload(e) {
  handleGenericPhotoUpload(e, State.feedTabCropState, 'feed-tab-crop-canvas', 'feed-tab-crop-zoom', 'feed-tab-crop-workspace', 'feed-tab-photo-upload-status');
}

function handleThreadPhotoUpload(e) {
  handleGenericPhotoUpload(e, State.threadCropState, 'thread-crop-canvas', 'thread-crop-zoom', 'thread-crop-workspace', 'thread-photo-upload-status');
}

function handleTribeIconUpload(e) {
  handleGenericPhotoUpload(e, State.tribeIconCropState, 'tribe-icon-crop-canvas', 'tribe-icon-crop-zoom', 'tribe-icon-crop-workspace', 'tribe-icon-upload-status');
}

function handleTribeBannerUpload(e) {
  handleGenericPhotoUpload(e, State.tribeBannerCropState, 'tribe-banner-crop-canvas', 'tribe-banner-crop-zoom', 'tribe-banner-crop-workspace', 'tribe-banner-upload-status');
}

function handlePrivateTribeJoin(tribe, onTriggerRender) {
  if (tribe.pendingJoin) {
    showToast("Join request is already pending approval.", "info");
    return;
  }
  tribe.pendingJoin = true;
  saveStateToStorage();
  onTriggerRender();
  showToast("Join request submitted to Tribe owner.", "info");
  
  setTimeout(() => {
    const liveTribe = State.tribes.find(t => t.id === tribe.id);
    if (liveTribe && liveTribe.pendingJoin) {
      liveTribe.joined = true;
      liveTribe.pendingJoin = false;
      liveTribe.membersCount++;
      saveStateToStorage();
      showToast(`Approved! You are now a member of "${liveTribe.title}".`, "success");
      
      renderTribesList();
      if (State.activeTribeId === liveTribe.id) {
        renderTribeHubHeader(liveTribe.id);
        const chatBtn = document.getElementById('tribe-tab-chat-btn');
        const activeTab = (chatBtn && chatBtn.classList.contains('active')) ? 'chat' : 'forum';
        switchTribeHubTab(activeTab);
      }
    }
  }, 2500);
}

function toggleTribeHubMembership(tribeId) {
  if (!requireAuth()) return;
  const tribe = State.tribes.find(t => t.id === tribeId);
  if (tribe) {
    if (tribe.joined) {
      tribe.joined = false;
      tribe.membersCount--;
      showToast(`Left the "${tribe.title}" tribe.`);
      saveStateToStorage();
      renderTribeHubHeader(tribeId);
      const activeTab = document.querySelector('.tribe-hub-tabs .tab-btn.active').id.includes('chat') ? 'chat' : 'forum';
      switchTribeHubTab(activeTab);
    } else {
      if (!tribe.isPublic) {
        handlePrivateTribeJoin(tribe, () => {
          renderTribeHubHeader(tribeId);
        });
      } else {
        tribe.joined = true;
        tribe.membersCount++;
        showToast(`Joined the "${tribe.title}" tribe!`, 'success');
        saveStateToStorage();
        renderTribeHubHeader(tribeId);
        const activeTab = document.querySelector('.tribe-hub-tabs .tab-btn.active').id.includes('chat') ? 'chat' : 'forum';
        switchTribeHubTab(activeTab);
      }
    }
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
      saveStateToStorage();
      renderTribesList();
    } else {
      if (!tribe.isPublic) {
        handlePrivateTribeJoin(tribe, () => {
          renderTribesList();
        });
      } else {
        tribe.joined = true;
        tribe.membersCount++;
        showToast(`Joined the "${tribe.title}" tribe!`, 'success');
        saveStateToStorage();
        renderTribesList();
      }
    }
  }
}

function updateMessageTickUI(msgId, status) {
  const ticksEl = document.getElementById(`ticks-${msgId}`);
  if (ticksEl) {
    if (status === 'read') {
      ticksEl.innerHTML = `<i data-lucide="check-check" style="width: 11px; height: 11px; color: var(--accent-green); display: inline-block;"></i>`;
    } else if (status === 'delivered') {
      ticksEl.innerHTML = `<i data-lucide="check-check" style="width: 11px; height: 11px; color: var(--muted-text); display: inline-block;"></i>`;
    } else {
      ticksEl.innerHTML = `<i data-lucide="check" style="width: 11px; height: 11px; color: var(--muted-text); display: inline-block;"></i>`;
    }
    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function sendChatMessage(username, text) {
  if (!requireAuth()) return;
  if (!State.chats[username]) State.chats[username] = [];
  
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgId = `msg-${Date.now()}`;
  
  const newMsg = {
    id: msgId,
    sender: State.currentUser.name,
    text: text,
    time: timeString,
    reaction: false,
    status: 'sent'
  };
  
  State.chats[username].push(newMsg);
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  // Transition sent -> delivered after 1.2s
  setTimeout(() => {
    const chat = State.chats[username];
    if (chat) {
      const msg = chat.find(m => m.id === msgId);
      if (msg && msg.status === 'sent') {
        msg.status = 'delivered';
        saveStateToStorage();
        updateMessageTickUI(msgId, 'delivered');
      }
    }
  }, 1200);
  
  // Transition delivered -> read after 2.8s
  setTimeout(() => {
    const chat = State.chats[username];
    if (chat) {
      const msg = chat.find(m => m.id === msgId);
      if (msg && msg.status === 'delivered') {
        msg.status = 'read';
        saveStateToStorage();
        updateMessageTickUI(msgId, 'read');
      }
    }
  }, 2800);

  setTimeout(() => {
    triggerMockReply(username, text);
  }, 3500);
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
  
  // Mark outgoing messages as read when receiving reply
  State.chats[username].forEach(m => {
    if (m.sender === 'me' || m.sender === State.currentUser.name) {
      m.status = 'read';
    }
  });
  
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  showToast(`New message from ${username}`);
}

const Backend = {
  createListing(listing) {
    return new Promise((resolve, reject) => {
      simulateApiCall(
        () => {
          State.marketplace.push(listing);
          saveStateToStorage();
          resolve();
        },
        () => {
          if (State.isOffline) {
            listing.pendingSync = true;
            State.marketplace.push(listing);
            State.syncQueue.push({ type: 'CREATE_LISTING', payload: listing });
            saveStateToStorage();
            updateConnectionUI();
            resolve();
          } else {
            reject(new Error("Network sync failed."));
          }
        }
      );
    });
  }
};

function createCropObject() {
  return {
    img: null,
    zoom: 1.0,
    x: 0,
    y: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
  };
}

function compressCanvasToJpeg(canvas, maxDimension = 800) {
  const width = canvas.width;
  const height = canvas.height;
  let targetWidth = width;
  let targetHeight = height;
  
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      targetWidth = maxDimension;
      targetHeight = Math.round((height * maxDimension) / width);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((width * maxDimension) / height);
    }
  }
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw the original canvas onto the temp canvas with scaling
  tempCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  
  // Export as compressed JPEG
  return tempCanvas.toDataURL("image/jpeg", 0.7);
}

function drawGenericCrop(cropObj, canvas, drawOverlay = true) {
  const ctx = canvas.getContext('2d');
  const img = cropObj.img;
  if (!img) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  // Scale factor to make image cover the canvas
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * cropObj.zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  
  ctx.drawImage(img, cropObj.x - w / 2, cropObj.y - h / 2, w, h);
  ctx.restore();
  
  if (drawOverlay) {
    ctx.strokeStyle = '#3B7A57';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  }
}

function initGenericCropHandlers(cropObj, canvas, zoomInput, onDrawCallback) {
  canvas._currentCropObj = cropObj;
  canvas._onDraw = onDrawCallback;
  
  if (canvas._hasCropHandlers) return;
  canvas._hasCropHandlers = true;
  
  const onStart = (e) => {
    const cur = canvas._currentCropObj;
    if (!cur) return;
    cur.isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cur.dragStart = { x: clientX - cur.x, y: clientY - cur.y };
  };
  
  const onMove = (e) => {
    const cur = canvas._currentCropObj;
    if (!cur || !cur.isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cur.x = clientX - cur.dragStart.x;
    cur.y = clientY - cur.dragStart.y;
    if (canvas._onDraw) canvas._onDraw(true);
  };
  
  const onEnd = () => {
    const cur = canvas._currentCropObj;
    if (cur) cur.isDragging = false;
  };
  
  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
  
  zoomInput.addEventListener('input', (e) => {
    const cur = canvas._currentCropObj;
    if (cur) {
      cur.zoom = parseFloat(e.target.value);
      if (canvas._onDraw) canvas._onDraw(true);
    }
  });
}

function checkRateLimit(type) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  const storageKey = `vanlyfa_rate_limit_${type}`;
  const timestampsStr = localStorage.getItem(storageKey);
  let timestamps = [];
  
  if (timestampsStr) {
    try {
      timestamps = JSON.parse(timestampsStr);
    } catch (e) {
      timestamps = [];
    }
  }
  
  timestamps = timestamps.filter(t => now - t < oneHour);
  
  const limit = type === 'post' ? 5 : 3;
  if (timestamps.length >= limit) {
    return false;
  }
  
  timestamps.push(now);
  localStorage.setItem(storageKey, JSON.stringify(timestamps));
  return true;
}

function toggleSavePost(postId) {
  if (!requireAuth()) return;
  const { target } = findPostOrItem(postId);
  if (target) {
    if (!State.currentUser.savedPostIds) {
      State.currentUser.savedPostIds = [];
    }
    const idx = State.currentUser.savedPostIds.indexOf(postId);
    const originalSaved = target.savedByUser;
    const originalSaves = target.saves || 0;
    
    if (idx > -1) {
      State.currentUser.savedPostIds.splice(idx, 1);
      target.savedByUser = false;
      target.saves = Math.max(0, originalSaves - 1);
      showToast("Post removed from bookmarks.");
    } else {
      State.currentUser.savedPostIds.push(postId);
      target.savedByUser = true;
      target.saves = originalSaves + 1;
      showToast("Post saved to bookmarks!", "success");
    }
    
    State._cachedFeeds = {};
    saveStateToStorage();
    renderDashboardFeed();
    renderFeedTabPosts();
  }
}

function toggleMeetupSave(meetupId) {
  if (!requireAuth()) return;
  if (!State.currentUser.savedMeetupIds) {
    State.currentUser.savedMeetupIds = [];
  }
  const idx = State.currentUser.savedMeetupIds.indexOf(meetupId);
  if (idx > -1) {
    State.currentUser.savedMeetupIds.splice(idx, 1);
    showToast("Meetup removed from bookmarks.");
  } else {
    State.currentUser.savedMeetupIds.push(meetupId);
    showToast("Meetup saved to bookmarks!", "success");
  }
  saveStateToStorage();
  renderMeetupsList();
}
