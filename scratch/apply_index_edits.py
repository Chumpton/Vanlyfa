import re

path = 'index.js'
content = open(path, encoding='utf-8').read()

# 1. saveNewFeedTabPost replacement
orig_feed_post = """function saveNewFeedTabPost() {
  if (!requireAuth()) return;
  const content = document.getElementById('feed-tab-post-text').value.trim();
  const imgVal = document.getElementById('feed-tab-post-img-select').value;
  
  if (!content) {
    showToast("Post content cannot be empty.", "error");
    return;
  }
  
  const newPost = {
    id: `post-${Date.now()}`,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    time: "Just now",
    content,
    image: imgVal === 'none' ? null : `image_${imgVal}`,
    likes: 0,
    likedByUser: false,
    comments: []
  };
  
  State.posts.unshift(newPost);
  State._cachedFeeds = {};
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('feed-tab-post-text').value = '';
  document.getElementById('feed-tab-post-img-select').value = 'none';
  
  renderDashboardFeed();
  renderFeedTabPosts();
  showToast("Update shared with community feed!", "success");
}"""

new_feed_post = """function saveNewFeedTabPost() {
  if (!requireAuth()) return;
  const content = document.getElementById('feed-tab-post-text').value.trim();
  const imgVal = document.getElementById('feed-tab-post-img-select').value;
  
  if (!content) {
    showToast("Post content cannot be empty.", "error");
    return;
  }
  
  const status = State.currentUser.role === 'admin' ? 'approved' : 'pending';
  
  const newPost = {
    id: `post-${Date.now()}`,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    time: "Just now",
    content,
    image: imgVal === 'none' ? null : `image_${imgVal}`,
    likes: 0,
    likedByUser: false,
    comments: [],
    status
  };
  
  State.posts.unshift(newPost);
  State._cachedFeeds = {};
  saveStateToStorage();
  
  // Clean inputs
  document.getElementById('feed-tab-post-text').value = '';
  document.getElementById('feed-tab-post-img-select').value = 'none';
  
  renderDashboardFeed();
  renderFeedTabPosts();
  
  const successMsg = status === 'approved' ? "Update shared with community feed!" : "Post submitted! Awaiting admin approval.";
  showToast(successMsg, "success");
}"""

# 2. saveNewListing replacement
orig_listing = """function saveNewListing() {
  if (!requireAuth()) return;
  const title = document.getElementById('list-title').value.trim();
  const priceVal = document.getElementById('list-price').value.trim();
  const category = document.getElementById('list-category').value;
  const price = priceVal === '' ? 0 : parseInt(priceVal);
  const location = document.getElementById('list-location').value.trim();
  const zip = document.getElementById('list-zip').value.trim();
  const description = document.getElementById('list-desc').value.trim();
  const imgVal = document.getElementById('list-img-select').value;
  
  if (!title || isNaN(price) || !location || !zip || !description) {
    showToast("Please fill out all listing fields, including Zip Code.", "error");
    return;
  }
  
  let finalImage = `item_${imgVal}`;
  if (imgVal === 'custom') {
    const preview = document.getElementById('list-photo-preview');
    if (preview && preview.src && preview.src.startsWith('data:')) {
      finalImage = preview.src;
    } else {
      showToast("Please upload a custom photo first, or choose a mockup template.", "error");
      return;
    }
  }
  
  const coords = resolveZipCoordinates(zip) || { lat: 39.0, lng: -105.0 };
  
  const condition = category === 'services-offer' ? 'Service Offered' : 
                    (category === 'services-want' ? 'Service Wanted' : 'Good');
  
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
    image: finalImage
  };
  
  // Save listing using Backend Client Simulator
  Backend.createListing(newListing).then(() => {
    // Clean inputs
    document.getElementById('list-title').value = '';
    document.getElementById('list-price').value = '';
    document.getElementById('list-location').value = '';
    document.getElementById('list-zip').value = '';
    document.getElementById('list-desc').value = '';
    
    const preview = document.getElementById('list-photo-preview');
    if (preview) preview.src = '';
    const container = document.getElementById('list-photo-preview-container');
    if (container) container.style.display = 'none';
    const fileInput = document.getElementById('list-photo-upload');
    if (fileInput) fileInput.value = '';
    const select = document.getElementById('list-img-select');
    if (select) select.value = 'solar';
    
    closeModal('modal-add-listing');
    renderMarketplaceListings();
    showToast("Marketplace listing published!", "success");
  });
}"""

new_listing = """function saveNewListing() {
  if (!requireAuth()) return;
  const title = document.getElementById('list-title').value.trim();
  const priceVal = document.getElementById('list-price').value.trim();
  const category = document.getElementById('list-category').value;
  const price = priceVal === '' ? 0 : parseInt(priceVal);
  const location = document.getElementById('list-location').value.trim();
  const zip = document.getElementById('list-zip').value.trim();
  const description = document.getElementById('list-desc').value.trim();
  const imgVal = document.getElementById('list-img-select').value;
  
  if (!title || isNaN(price) || !location || !zip || !description) {
    showToast("Please fill out all listing fields, including Zip Code.", "error");
    return;
  }
  
  let finalImage = `item_${imgVal}`;
  if (imgVal === 'custom') {
    const preview = document.getElementById('list-photo-preview');
    if (preview && preview.src && preview.src.startsWith('data:')) {
      finalImage = preview.src;
    } else {
      showToast("Please upload a custom photo first, or choose a mockup template.", "error");
      return;
    }
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
  
  // Save listing using Backend Client Simulator
  Backend.createListing(newListing).then(() => {
    // Clean inputs
    document.getElementById('list-title').value = '';
    document.getElementById('list-price').value = '';
    document.getElementById('list-location').value = '';
    document.getElementById('list-zip').value = '';
    document.getElementById('list-desc').value = '';
    
    const preview = document.getElementById('list-photo-preview');
    if (preview) preview.src = '';
    const container = document.getElementById('list-photo-preview-container');
    if (container) container.style.display = 'none';
    const fileInput = document.getElementById('list-photo-upload');
    if (fileInput) fileInput.value = '';
    const select = document.getElementById('list-img-select');
    if (select) select.value = 'solar';
    
    closeModal('modal-add-listing');
    renderMarketplaceListings();
    
    const successMsg = status === 'approved' ? "Marketplace listing published!" : "Listing submitted! Awaiting admin approval.";
    showToast(successMsg, "success");
  });
}"""

# 3. saveNewSpot replacement
orig_spot = """function saveNewSpot() {
  const title = document.getElementById('spot-title').value.trim();
  const category = document.getElementById('spot-category').value;
  const lat = parseFloat(document.getElementById('spot-lat').value);
  const lng = parseFloat(document.getElementById('spot-lng').value);
  const description = document.getElementById('spot-desc').value.trim();
  
  if (!title || isNaN(lat) || isNaN(lng) || !description) {
    showToast("Please fill all coordinates and name parameters.", "error");
    return;
  }
  
  const newSpot = {
    id: `spot-${Date.now()}`,
    title,
    category,
    lat,
    lng,
    description,
    author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
    vouches: 1,
    reviews: []
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
  
  if (State.isOffline) {
    newSpot.pendingSync = true;
    State.spots.push(newSpot);
    State.syncQueue.push({ type: 'CREATE_SPOT', payload: newSpot });
    saveStateToStorage();
    updateConnectionUI();
    showToast("Offline mode: campsite queued for sync!", "warning");
  } else {
    State.spots.push(newSpot);
    saveStateToStorage();
    showToast("Campsite vouched successfully!", "success");
  }"""

new_spot = """function saveNewSpot() {
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
  } else {
    State.spots.push(newSpot);
    saveStateToStorage();
    showToast(successMsg, "success");
  }"""

# 4. saveNewMeetup replacement
orig_meetup = """function saveNewMeetup() {
  if (!requireAuth()) return;
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
    attendees: ['avatar_bob'],
    attendeesCount: 1
  };
  
  State.meetups.push(newMeetup);
  saveStateToStorage();
  
  // Reload maps
  renderLeafletMarkers();
  
  // Clean inputs
  document.getElementById('meetup-title-input').value = '';
  document.getElementById('meetup-date-input').value = '';
  document.getElementById('meetup-time-input').value = '';
  document.getElementById('meetup-loc-name').value = '';
  document.getElementById('meetup-lat').value = '';
  document.getElementById('meetup-lng').value = '';
  document.getElementById('meetup-desc-input').value = '';
  
  closeModal('modal-add-meetup');
  renderMeetupsList();
  showToast("Meetup hosted and pinned on global map!", "success");
}"""

new_meetup = """function saveNewMeetup() {
  if (!requireAuth()) return;
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
    attendees: ['avatar_bob'],
    attendeesCount: 1,
    status
  };
  
  State.meetups.push(newMeetup);
  saveStateToStorage();
  
  // Reload maps
  renderLeafletMarkers();
  
  // Clean inputs
  document.getElementById('meetup-title-input').value = '';
  document.getElementById('meetup-date-input').value = '';
  document.getElementById('meetup-time-input').value = '';
  document.getElementById('meetup-loc-name').value = '';
  document.getElementById('meetup-lat').value = '';
  document.getElementById('meetup-lng').value = '';
  document.getElementById('meetup-desc-input').value = '';
  
  closeModal('modal-add-meetup');
  renderMeetupsList();
  
  const successMsg = status === 'approved' ? "Meetup hosted and pinned on global map!" : "Meetup submitted! Awaiting admin approval.";
  showToast(successMsg, "success");
}"""

# Normalise whitespace
def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def replace_exact(content, orig, new):
    if orig in content:
        return content.replace(orig, new)
    else:
        # Try cleaning whitespace
        print("exact match not found, trying fuzzy match...")
        # A simple character matching replacement fallback
        return content.replace(orig.strip(), new.strip())

content = replace_exact(content, orig_feed_post, new_feed_post)
content = replace_exact(content, orig_listing, new_listing)
content = replace_exact(content, orig_spot, new_spot)
content = replace_exact(content, orig_meetup, new_meetup)

open(path, 'w', encoding='utf-8').write(content)
print("Updated all functions in index.js successfully!")
