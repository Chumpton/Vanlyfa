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
  meetupCropState: { img: null, zoom: 1.0, x: 0, y: 0, isDragging: false, dragStart: { x: 0, y: 0 } },
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
        State.currentUser.blockedUsers = State.currentUser.blockedUsers || [];
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
    const userInList = State.users.find(u => u.name === State.currentUser.name);
    if (userInList && userInList.banned) {
      State.isSignedIn = false;
      saveStateToStorage();
      updateSidebarProfileWidget();
      showToast("Your account has been deactivated by an administrator.", "error");
      switchTab('dashboard');
      return false;
    }
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
  try {
    Backend.toggleLike(postId);
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
  }
}

function submitComment(e, postId) {
  e.preventDefault();
  if (!requireAuth()) return;
  if (!checkRateLimit('comment')) {
    showToast("Rate limit exceeded. You can only comment 10 times per hour.", "error");
    return;
  }
  const input = document.getElementById(`comment-input-${postId}`) || document.getElementById(`modal-comment-input-${postId}`);
  if (input && input.value.trim() !== '') {
    const commentText = input.value.trim();
    try {
      Backend.addComment(postId, commentText);
      input.value = '';
      showToast("Comment posted!", "success");
    } catch (e) {
      if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
      showToast(e.message, 'error');
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
  try {
    const nowAttending = Backend.toggleAttendance(meetupId);
    if (nowAttending) {
      showToast("RSVP confirmed! See you at camp.", "success");
    } else {
      showToast("Cancelled your RSVP.");
    }
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
  }
}

function submitForumReply() {
  const textInput = document.getElementById('forum-reply-text');
  const body = textInput.value.trim();
  if (body === '') return;
  
  if (!requireAuth()) return;
  if (!checkRateLimit('comment')) {
    showToast("Rate limit exceeded. You can only reply 10 times per hour.", "error");
    return;
  }
  
  try {
    Backend.submitReply(State.activeThreadId, body);
    textInput.value = '';
    showToast("Reply published!", "success");
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
  }
}

function toggleFriend() {
  if (!requireAuth()) return;
  const user = getActiveUser();
  if (user.name === State.currentUser.name) return;
  
  try {
    const nowFollowing = Backend.toggleFollow(user.name);
    if (nowFollowing) {
      showToast(`Added ${user.name} as a friend!`, "success");
    } else {
      showToast(`Removed ${user.name} from friends.`, "info");
    }
    renderUserProfile();
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
  }
}

function toggleReputation() {
  if (!requireAuth()) return;
  try {
    const authorUser = Backend.giveReputation(State.activeThreadId);
    if (authorUser) {
      showToast(`Gave 1 reputation point to ${authorUser.name}!`, 'success');
    }
    renderUserProfile();
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    if (e.message === 'already_given') { showToast('You already gave reputation to this author.', 'info'); return; }
    showToast(e.message, 'error');
  }
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
  try {
    const spot = Backend.vouchSpot(spotId);
    updateVouchUI(spot);
    showToast("Vouched spot successfully!", "success");
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    if (e.message === 'already_vouched') { showToast('You have already vouched for this spot.', 'info'); return; }
    showToast(e.message, 'error');
  }
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

function handleMeetupPhotoUpload(e) {
  handleGenericPhotoUpload(e, State.meetupCropState, 'meetup-crop-canvas', 'meetup-crop-zoom', 'meetup-crop-workspace', 'meetup-photo-upload-status');
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
  if (!tribe) return;
  
  try {
    if (tribe.joined) {
      Backend.leaveTribe(tribeId);
      tribe.joined = false;
      showToast(`Left the "${tribe.title}" tribe.`);
    } else {
      if (!tribe.isPublic) {
        handlePrivateTribeJoin(tribe, () => {
          renderTribeHubHeader(tribeId);
        });
        return;
      }
      Backend.joinTribe(tribeId);
      tribe.joined = true;
      showToast(`Joined the "${tribe.title}" tribe!`, 'success');
    }
    renderTribeHubHeader(tribeId);
    const activeTab = document.querySelector('.tribe-hub-tabs .tab-btn.active').id.includes('chat') ? 'chat' : 'forum';
    switchTribeHubTab(activeTab);
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
  }
}

function sendTribeChatMessage(e) {
  e.preventDefault();
  if (!requireAuth()) return;
  const tribeId = State.activeTribeId;
  const input = document.getElementById('tribe-chat-input');
  if (!tribeId || !input || input.value.trim() === '') return;
  
  try {
    Backend.sendTribeChat(tribeId, input.value.trim());
    input.value = '';
    renderTribeHubChat(tribeId);
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
    return;
  }
  
  // Simulated bot reply
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
      
      if (!State.tribeChats[tribeId]) State.tribeChats[tribeId] = [];
      State.tribeChats[tribeId].push({
        sender: randomSender,
        text: randomMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      Backend.commit([]);
      renderTribeHubChat(tribeId);
    }
  }, 1500);
}

function submitTribeThreadReply(e, tribeId, threadId) {
  e.preventDefault();
  if (!requireAuth()) return;
  const input = e.target.querySelector('input');
  if (!input || input.value.trim() === '') return;
  
  const thread = State.tribeThreads[tribeId] ? State.tribeThreads[tribeId].find(t => t.id === threadId) : null;
  if (thread) {
    if (!thread.replies) thread.replies = [];
    thread.replies.push({
      author: State.currentUser.name,
      body: input.value.trim()
    });
    input.value = '';
    Backend.commit([]);
    renderTribeHubForum(tribeId);
    showToast("Reply published!", "success");
  }
}

function toggleTribeMembership(tribeId) {
  if (!requireAuth()) return;
  const tribe = State.tribes.find(t => t.id === tribeId);
  if (!tribe) return;
  
  try {
    if (tribe.joined) {
      Backend.leaveTribe(tribeId);
      tribe.joined = false;
      showToast(`Left the "${tribe.title}" tribe.`);
    } else {
      if (!tribe.isPublic) {
        handlePrivateTribeJoin(tribe, () => {
          renderTribesList();
        });
        return;
      }
      Backend.joinTribe(tribeId);
      tribe.joined = true;
      showToast(`Joined the "${tribe.title}" tribe!`, 'success');
    }
    renderTribesList();
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
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
  try {
    Backend.sendMessage(username, text);
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
    return;
  }

  setTimeout(() => {
    triggerMockReply(username, text);
  }, 3500);
}

function toggleHeartReaction(username, msgId) {
  const messages = State.chats[username] || [];
  const msg = messages.find(m => m.id === msgId);
  if (msg) {
    const newEmoji = msg.reaction ? null : '❤️';
    Backend.reactToMessage(username, msgId, newEmoji);
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
  
  if (!State.activeChats.includes(username)) {
    if (!State.unreadChats) State.unreadChats = [];
    if (!State.unreadChats.includes(username)) {
      State.unreadChats.push(username);
    }
  }
  
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  if (typeof renderNotifications === 'function') renderNotifications();
  
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
  let width = canvas.width;
  let height = canvas.height;

  // Scale down oversized media arrays bounds
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
    
    // Virtualize step-down container mapping
    const scalingCanvas = document.createElement('canvas');
    scalingCanvas.width = width;
    scalingCanvas.height = height;
    const scalingCtx = scalingCanvas.getContext('2d');
    scalingCtx.drawImage(canvas, 0, 0, width, height);
    return scalingCanvas.toDataURL('image/jpeg', 0.70); // Lossy compression map target
  }
  
  return canvas.toDataURL('image/jpeg', 0.75);
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
  try {
    const nowSaved = Backend.toggleSavePost(postId);
    if (nowSaved) {
      showToast("Post saved to bookmarks!", "success");
    } else {
      showToast("Post removed from bookmarks.");
    }
    Backend.commit(['feed', 'dashboard']);
  } catch (e) {
    if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
    showToast(e.message, 'error');
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
  Backend.commit(['meetups']);
}

async function safeFetchData(url, fallbackState) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Fetch failure encountered for ${url}. Engaging fallback dataset.`, error);
    if (typeof showToast === 'function') {
      showToast("Sync intermittent. Showing locally cached data.", "warning");
    }
    return fallbackState;
  }
}

function processPremiumPurchase(event) {
  if (event) event.preventDefault();
  if (!requireAuth()) return;
  
  State.currentUser.isPremium = true;
  
  const userInList = State.users.find(u => u.name === State.currentUser.name);
  if (userInList) {
    userInList.isPremium = true;
  }
  
  saveStateToStorage();
  closeModal('modal-premium-pass');
  
  // Refresh UI
  updateSidebarProfileWidget();
  if (typeof renderUserProfile === 'function') {
    renderUserProfile();
  }
  
  showToast("Congratulations! You are now a Vanlyfa Premium member!", "success");
}

function flagItem(type, itemId, commentIndex = null) {
  if (!requireAuth()) return;
  if (confirm(`Are you sure you want to report this ${type} for moderation?`)) {
    try {
      Backend.flagItem(type, itemId);
      showToast("Report submitted successfully.", "success");
      Backend.commit(['feed', 'dashboard', 'currentTab', 'marketplace', 'map']);
    } catch (e) {
      if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
      showToast(e.message, 'error');
    }
  }
}

function checkRateLimit(type) {
  if (!State.isSignedIn) return true;
  
  const now = Date.now();
  if (!State._userActionTimestamps) {
    State._userActionTimestamps = {};
  }
  const username = State.currentUser.name;
  if (!State._userActionTimestamps[username]) {
    State._userActionTimestamps[username] = [];
  }
  
  // Clean up older timestamps (last 1 hour)
  const oneHour = 60 * 60 * 1000;
  State._userActionTimestamps[username] = State._userActionTimestamps[username].filter(item => now - item.ts < oneHour);
  
  // Filter by action type
  const typeActions = State._userActionTimestamps[username].filter(item => item.type === type);
  
  let limit = 5; // Default limit
  if (type === 'post') limit = 5;
  else if (type === 'marketplace') limit = 3;
  else if (type === 'spot') limit = 5;
  else if (type === 'meetup') limit = 3;
  else if (type === 'comment') limit = 10;
  else if (type === 'forum') limit = 5;
  
  if (typeActions.length >= limit) {
    return false;
  }
  
  State._userActionTimestamps[username].push({ type, ts: now });
  saveStateToStorage();
  return true;
}

window.flagItem = flagItem;
window.checkRateLimit = checkRateLimit;
window.submitComment = submitComment;

function blockUser(username) {
  if (!requireAuth()) return;
  if (username === State.currentUser.name) {
    showToast("You cannot block yourself.", "error");
    return;
  }
  if (confirm(`Are you sure you want to block ${username}? You will no longer see their posts or comments.`)) {
    try {
      Backend.blockUser(username);
      showToast(`Blocked ${username}`, "success");
    } catch (e) {
      if (e.message === 'auth_required') { openModal('modal-auth-required'); return; }
      showToast(e.message, 'error');
    }
  }
}
window.blockUser = blockUser;

// --- Simulated Database Write Layer (Supabase Prep) ---
window.simulateDatabaseWrite = function(item, type, sql, rls, callback) {
  item.pendingSync = true;
  console.log(`%c[Supabase Sim] Writing new ${type}...`, 'color: #3ecf8e; font-weight: bold;');
  console.log(`%cSQL Query: %c${sql}`, 'color: #3b82f6; font-weight: bold;', 'color: #c084fc; font-family: monospace;');
  console.log(`%cRLS Policy Evaluated: %c${rls}`, 'color: #eab308; font-weight: bold;', 'color: #fb923c;');
  
  setTimeout(() => {
    item.pendingSync = false;
    if (callback) callback();
  }, 1000);
};

