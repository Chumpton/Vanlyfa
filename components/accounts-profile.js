/* ==========================================================================
   VANLYFA COMPONENT: ACCOUNTS-PROFILE.JS
   ========================================================================== */

function renderUserProfile() {
  const user = getActiveUser();
  const isOwner = user.name === State.currentUser.name;
  
  // Update left column details
  document.getElementById('profile-user-avatar').src = getAvatarSrc(user.avatar);
  document.getElementById('profile-user-name').innerText = user.name;
  document.getElementById('profile-user-handle').innerText = user.handle || `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
  document.getElementById('profile-reputation-score').innerText = `Reputation: ${user.reputation || 0}`;
  document.getElementById('profile-user-bio').innerText = user.bio;
  
  // Render social links
  const igLink = document.getElementById('profile-link-instagram');
  const igHandle = document.getElementById('profile-handle-instagram');
  const ttLink = document.getElementById('profile-link-tiktok');
  const ttHandle = document.getElementById('profile-handle-tiktok');
  
  if (user.instagram_handle) {
    if (igLink && igHandle) {
      igLink.style.display = 'inline-flex';
      igLink.href = `https://instagram.com/${user.instagram_handle}`;
      igHandle.innerText = `@${user.instagram_handle}`;
    }
  } else {
    if (igLink) igLink.style.display = 'none';
  }
  
  if (user.tiktok_handle) {
    if (ttLink && ttHandle) {
      ttLink.style.display = 'inline-flex';
      ttLink.href = `https://tiktok.com/@${user.tiktok_handle}`;
      ttHandle.innerText = `@${user.tiktok_handle}`;
    }
  } else {
    if (ttLink) ttLink.style.display = 'none';
  }
  
  // Show edit button for owner, show visitor actions for visitor
  const editBtn = document.getElementById('profile-edit-btn');
  const visitorActions = document.getElementById('profile-visitor-actions');
  const friendBtn = document.getElementById('profile-friend-btn');
  const repBtn = document.getElementById('profile-rep-btn');
  
  const premiumBtn = document.getElementById('profile-premium-btn');
  
  if (isOwner) {
    if (editBtn) editBtn.style.display = 'inline-flex';
    if (visitorActions) visitorActions.style.display = 'none';
    if (premiumBtn) {
      premiumBtn.style.display = 'none';
    }
  } else {
    if (editBtn) editBtn.style.display = 'none';
    if (visitorActions) visitorActions.style.display = 'flex';
    if (premiumBtn) premiumBtn.style.display = 'none';
    
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
  
  // Inject Profile Feeds Tabs at the top of the right column
  const detailsRight = document.querySelector('.profile-details-right');
  if (detailsRight) {
    let tabsHeader = document.getElementById('profile-feeds-tabs');
    if (!tabsHeader) {
      tabsHeader = document.createElement('div');
      tabsHeader.id = 'profile-feeds-tabs';
      tabsHeader.className = 'profile-card-section';
      tabsHeader.style.paddingBottom = '0';
      tabsHeader.innerHTML = `
        <div class="profile-details-tabs" style="display: flex; gap: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
          <button class="profile-details-tab-btn active" data-profile-tab="posts" style="background: none; border: none; padding: 10px 4px; font-weight: 700; font-size: 13px; color: var(--text-charcoal); border-bottom: 2px solid var(--accent-green); cursor: pointer; transition: all 0.2s;">Posts</button>
          <button class="profile-details-tab-btn" data-profile-tab="replies" style="background: none; border: none; padding: 10px 4px; font-weight: 700; font-size: 13px; color: var(--muted-text); border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s;">Replies</button>
          <button class="profile-details-tab-btn" data-profile-tab="reposts" style="background: none; border: none; padding: 10px 4px; font-weight: 700; font-size: 13px; color: var(--muted-text); border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s;">Reposts</button>
          <button class="profile-details-tab-btn" data-profile-tab="forums" style="background: none; border: none; padding: 10px 4px; font-weight: 700; font-size: 13px; color: var(--muted-text); border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s;">Forums</button>
          <button class="profile-details-tab-btn" data-profile-tab="guestbook" style="background: none; border: none; padding: 10px 4px; font-weight: 700; font-size: 13px; color: var(--muted-text); border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s;">Guestbook</button>
        </div>
        <div id="profile-tab-content-area" style="display:flex; flex-direction:column; gap:0;"></div>
      `;
      detailsRight.insertBefore(tabsHeader, detailsRight.firstChild);
      
      // Bind click listeners
      tabsHeader.querySelectorAll('.profile-details-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = e.currentTarget.getAttribute('data-profile-tab');
          State.activeProfileTab = tab;
          
          tabsHeader.querySelectorAll('.profile-details-tab-btn').forEach(b => {
            const bVal = b.getAttribute('data-profile-tab');
            if (bVal === tab) {
              b.classList.add('active');
              b.style.color = 'var(--text-charcoal)';
              b.style.borderBottom = '2px solid var(--accent-green)';
            } else {
              b.classList.remove('active');
              b.style.color = 'var(--muted-text)';
              b.style.borderBottom = '2px solid transparent';
            }
          });
          
          renderProfileTabContent(user);
        });
      });
    }
    
    // Ensure active profile tab is set
    State.activeProfileTab = State.activeProfileTab || 'posts';
    
    // Set active tab styling initially
    tabsHeader.querySelectorAll('.profile-details-tab-btn').forEach(btn => {
      const bVal = btn.getAttribute('data-profile-tab');
      if (bVal === State.activeProfileTab) {
        btn.classList.add('active');
        btn.style.color = 'var(--text-charcoal)';
        btn.style.borderBottom = '2px solid var(--accent-green)';
      } else {
        btn.classList.remove('active');
        btn.style.color = 'var(--muted-text)';
        btn.style.borderBottom = '2px solid transparent';
      }
    });

    renderProfileTabContent(user);
  }

  // Render photo gallery unconditionally
  const gallerySection = document.getElementById('profile-gallery-section');
  if (gallerySection) gallerySection.style.display = 'block';
  
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
  const gallery = user.gallery || [];
  
  // Hide upload button if not owner or if gallery already has 3 or more photos
  if (uploadBtn) {
    uploadBtn.style.display = (isOwner && gallery.length < 3) ? 'inline-flex' : 'none';
  }
  
  if (galleryGrid) {
    galleryGrid.innerHTML = '';
    if (gallery.length === 0) {
      galleryGrid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:24px; color:var(--muted-text); font-size:12px; font-style:italic;">No photos in gallery.</div>`;
    } else {
      gallery.forEach((imgKey, index) => {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.aspectRatio = '1';
        
        const img = document.createElement('img');
        img.className = 'profile-gallery-item';
        img.src = getImageSrc(imgKey);
        img.alt = "Rig photo";
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = 'var(--radius-md)';
        container.appendChild(img);
        
        if (isOwner) {
          const deleteBtn = document.createElement('button');
          deleteBtn.innerHTML = '×';
          deleteBtn.style.cssText = "position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.65); color:white; border:none; border-radius:50%; width:22px; height:22px; font-size:16px; line-height:18px; text-align:center; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; z-index:10; border:1px solid rgba(255,255,255,0.4);";
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm("Remove this photo from your rig gallery?")) {
              user.gallery.splice(index, 1);
              saveStateToStorage();
              renderUserProfile();
              showToast("Photo removed from gallery.", "success");
            }
          });
          container.appendChild(deleteBtn);
        }
        
        galleryGrid.appendChild(container);
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
  
  // Render Active Marketplace Listings
  const profileListingsSection = document.getElementById('profile-listings-section');
  const profileListingsList = document.getElementById('profile-listings-list');
  if (profileListingsSection && profileListingsList) {
    profileListingsList.innerHTML = '';
    const userListings = State.marketplace.filter(item => item.seller && item.seller.name === user.name);
    
    if (userListings.length === 0) {
      profileListingsList.innerHTML = `<div style="font-size:12px; color:var(--muted-text); font-style:italic;">No active marketplace listings.</div>`;
    } else {
      userListings.forEach(item => {
        const row = document.createElement('div');
        row.className = 'visited-spot-row';
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid var(--border-color); font-size:13px;";
        
        const isService = item.category === 'services-offer' || item.category === 'services-want';
        const displayPrice = (isService || item.price === 0) ? 'Trade / Barter' : `$${item.price}`;
        const categoryLabel = item.category === 'services-offer' ? 'Service (Offered)' : 
                             (item.category === 'services-want' ? 'Service (Wanted)' : 'Item');
        
        row.innerHTML = `
          <div>
            <strong style="color:var(--text-charcoal); cursor:pointer;" class="profile-listing-title-link">${item.title}</strong>
            <span style="font-size:11px; color:var(--muted-text); margin-left:8px;">(${categoryLabel})</span>
          </div>
          <span style="font-weight:700; color:var(--accent-green);">${displayPrice}</span>
        `;
        
        const titleLink = row.querySelector('.profile-listing-title-link');
        titleLink.addEventListener('click', () => {
          switchTab('marketplace');
          if (isService) {
            if (window.switchMarketplaceType) {
              window.switchMarketplaceType('services');
            } else {
              State.activeMarketplaceType = 'services';
            }
          } else {
            if (window.switchMarketplaceType) {
              window.switchMarketplaceType('items');
            } else {
              State.activeMarketplaceType = 'items';
            }
          }
          const catFilter = document.getElementById('market-filter-category');
          if (catFilter) {
            catFilter.value = 'all';
          }
          State.searchQuery = item.title.toLowerCase();
          const searchInputEl = document.getElementById('global-search');
          if (searchInputEl) {
            searchInputEl.value = item.title;
          }
          renderMarketplaceListings();
        });
        
        profileListingsList.appendChild(row);
      });
    }
  }
  
  // Defer map initialization to prevent blocking the UI thread (resolves INP issue)
  setTimeout(() => {
    initProfileMap(user);
  }, 60);
  
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
    
    const tileUrl = (typeof getMapTileUrl === 'function') ? getMapTileUrl() : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
    State.profileTileLayer = L.tileLayer(tileUrl, {
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

function openProfileEditModal() {
  document.getElementById('edit-profile-name').value = State.currentUser.name;
  document.getElementById('edit-profile-bio').value = State.currentUser.bio;
  
  const roleGroup = document.getElementById('edit-profile-role-group');
  if (roleGroup) {
    if (State.currentUser.handle === '@google_traveler' || State.currentUser.role === 'admin') {
      roleGroup.style.display = 'block';
      const roleSelect = document.getElementById('edit-profile-role');
      if (roleSelect) roleSelect.value = State.currentUser.role || 'admin';
    } else {
      roleGroup.style.display = 'none';
    }
  }
  
  const handleInput = document.getElementById('edit-profile-handle');
  if (handleInput) {
    handleInput.value = State.currentUser.handle || "";
  }
  
  // Populate social handles
  document.getElementById('edit-profile-instagram').value = State.currentUser.instagram_handle || "";
  document.getElementById('edit-profile-tiktok').value = State.currentUser.tiktok_handle || "";
  
  // Reset crop workspace
  const workspace = document.getElementById('avatar-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  const fileInput = document.getElementById('edit-profile-avatar-upload');
  if (fileInput) fileInput.value = '';
  
  openModal('modal-edit-profile');
}

function renderProfileTabContent(user) {
  const container = document.getElementById('profile-tab-content-area');
  if (!container) return;
  container.innerHTML = '';
  
  const tab = State.activeProfileTab || 'posts';
  
  if (tab === 'posts') {
    const userPosts = State.posts.filter(p => p.author && p.author.name === user.name);
    if (userPosts.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:24px 0; color:var(--muted-text); font-size:12px; font-style:italic;">No posts yet.</div>`;
    } else {
      let html = '';
      userPosts.forEach(post => {
        html += getPostCardHtmlForProfile(post);
      });
      container.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    }
  } else if (tab === 'replies') {
    const replies = [];
    State.posts.forEach(p => {
      if (p.comments) {
        p.comments.forEach(c => {
          if (c.user === user.name) {
            replies.push({ post: p, comment: c });
          }
        });
      }
    });
    
    if (replies.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:24px 0; color:var(--muted-text); font-size:12px; font-style:italic;">No replies yet.</div>`;
    } else {
      let html = '';
      replies.forEach(r => {
        html += `
          <div class="thread-reply-item" style="display:flex; gap:12px; align-items:flex-start; padding:16px 0; border-bottom:1px solid var(--border-color);">
            <div style="position:relative; flex-shrink:0;">
              <img src="${getAvatarSrc(user.avatar)}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
            </div>
            <div style="flex-grow:1; text-align:left;">
              <div style="font-size:13px; font-weight:700; color:var(--text-charcoal); margin-bottom:4px;">
                ${user.name} <span style="font-weight:400; color:var(--muted-text);">replied to ${r.post.author ? r.post.author.name : 'Nomad'}'s post:</span>
              </div>
              <p style="color:var(--text-main); margin:0; font-size:13px; line-height:1.4; font-weight:500;">${parseMarkdownToHtml(r.comment.text)}</p>
              <div style="font-size:11px; color:var(--muted-text); margin-top:8px; cursor:pointer;" onclick="window.openPostDetailModal('${r.post.id}')">
                View original post
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  } else if (tab === 'reposts') {
    const repostedIds = user.repostedPostIds || [];
    const repostedPosts = State.posts.filter(p => repostedIds.includes(p.id));
    
    if (repostedPosts.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:24px 0; color:var(--muted-text); font-size:12px; font-style:italic;">No reposts yet.</div>`;
    } else {
      let html = '';
      repostedPosts.forEach(post => {
        html += getPostCardHtmlForProfile(post);
      });
      container.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    }
  } else if (tab === 'forums') {
    const userThreads = (State.forum || []).filter(t => t.author && t.author.name === user.name);
    
    if (userThreads.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:24px 0; color:var(--muted-text); font-size:12px; font-style:italic;">No forum threads yet.</div>`;
    } else {
      let html = '';
      userThreads.forEach(t => {
        html += `
          <div style="padding:16px 0; border-bottom:1px solid var(--border-color); text-align:left; cursor:pointer;" onclick="window.viewForumThreadFromProfile('${t.id}')">
            <div style="font-weight:700; font-size:14px; color:var(--text-charcoal);">${t.title}</div>
            <div style="font-size:12px; color:var(--muted-text); margin-top:4px;">In ${t.category} • ${t.repliesCount} replies • ${t.viewsCount} views</div>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  } else if (tab === 'guestbook') {
    const comments = user.profileComments || [];
    let commentsHtml = '';
    
    comments.forEach((c, idx) => {
      const commenter = State.users.find(u => u.name === c.user) || { avatar: 'avatar_bob' };
      commentsHtml += `
        <div style="display:flex; gap:12px; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--border-color);">
          <img src="${getAvatarSrc(commenter.avatar)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
          <div style="flex-grow:1; text-align:left;">
            <div style="font-size:12px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; color:var(--text-charcoal);">${c.user}</span>
              <span style="color:var(--muted-text); font-size:11px;">${c.time || 'Just now'}</span>
            </div>
            <p style="color:var(--text-main); margin:4px 0 0 0; font-size:12px; line-height:1.4;">${parseMarkdownToHtml(c.text)}</p>
          </div>
        </div>
      `;
    });
    
    const isGuest = !State.isSignedIn;
    const composeHtml = isGuest ? `
      <div style="font-size:12px; color:var(--muted-text); font-style:italic; margin-bottom:16px;">Please sign in to write a comment.</div>
    ` : `
      <form onsubmit="window.submitProfileComment(event, '${user.name.replace(/'/g, "\\'")}')" style="display:flex; gap:8px; align-items:center; margin-bottom:16px;">
        <img src="${getAvatarSrc(State.currentUser.avatar)}" alt="Me" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">
        <input type="text" id="profile-comment-input" placeholder="Write a comment on ${user.name}'s profile..." style="flex-grow:1; border: 1px solid var(--border-color); border-radius: 20px; padding: 6px 14px; outline:none; font-size:12px; background:var(--card-bg); color:var(--text-main);" required />
        <button class="btn btn-sm btn-primary" type="submit" style="border-radius:20px;">Send</button>
      </form>
    `;
    
    container.innerHTML = `
      <div style="padding:16px 0;">
        ${composeHtml}
        <div style="display:flex; flex-direction:column; gap:0;">
          ${commentsHtml || '<div style="text-align:center; padding:12px 0; color:var(--muted-text); font-style:italic; font-size:12px;">No comments yet.</div>'}
        </div>
      </div>
    `;
  }
}

function getPostCardHtmlForProfile(post) {
  const isSaved = State.currentUser && State.currentUser.savedPostIds && State.currentUser.savedPostIds.includes(post.id);
  const likedByUser = post.likedByUser || false;
  
  let imgMarkup = '';
  if (post.image && post.image !== 'none') {
    imgMarkup = `<img src="${getImageSrc(post.image)}" alt="Post Media" style="border-radius:var(--radius-md); margin-top:8px; width:100%; max-height:250px; object-fit:contain; background:#111;">`;
  }
  
  return `
    <div class="feed-post-card" style="background-color: transparent; border: none; border-bottom: 1px solid var(--border-color); border-radius: 0; padding: 16px 0; margin-bottom: 0; width:100%;">
      <div class="thread-post-layout" style="display:flex; gap:12px;">
        <div class="thread-left-col" style="display:flex; flex-direction:column; align-items:center;">
          <img src="${getAvatarSrc(post.author.avatar)}" alt="${post.author.name}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
        </div>
        <div class="thread-right-col" style="flex-grow:1; text-align:left;">
          <div class="thread-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="thread-user-meta" style="display:flex; align-items:center; gap:6px; font-size:14px;">
              <span class="thread-author-name" style="font-weight:700; color:var(--text-charcoal);">${post.author.name}</span>
              <i data-lucide="check-circle-2" style="width:14px; height:14px; fill:#3B82F6; color:white; flex-shrink:0;"></i>
              <span class="thread-time" style="color:var(--muted-text); font-size:13px; margin-left:4px;">${post.time || 'Just now'}</span>
            </div>
          </div>
          <div style="margin-top:8px; font-size:14px; line-height:1.5; color:var(--text-main); font-weight:500;">${parseMarkdownToHtml(post.content)}</div>
          ${imgMarkup}
          <div style="display:flex; gap:28px; margin-top:12px; font-size:13px; color:var(--muted-text); align-items:center;">
            <button onclick="window.toggleLike('${post.id}'); renderUserProfile('${post.author.name}')" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
              <i data-lucide="heart" style="width:18px; height:18px; color:${likedByUser ? '#ef4444' : 'inherit'}; fill:${likedByUser ? '#ef4444' : 'none'};"></i>
              <span>${post.likes || 0}</span>
            </button>
            <button onclick="window.openPostDetailModal('${post.id}')" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
              <i data-lucide="message-circle" style="width:18px; height:18px;"></i>
              <span>${post.comments ? post.comments.length : 0}</span>
            </button>
            <button onclick="window.toggleRepost('${post.id}'); renderUserProfile('${post.author.name}')" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
              <i data-lucide="repeat" style="width:18px; height:18px;"></i>
              <span>${post.reposts || 0}</span>
            </button>
            <button onclick="window.openShareMenu('${post.id}')" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
              <i data-lucide="send" style="width:18px; height:18px;"></i>
              <span>${post.shares || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.viewForumThreadFromProfile = function(threadId) {
  State.activeThreadId = threadId;
  switchTab('forum');
  if (typeof renderForumView === 'function') renderForumView();
};

window.submitProfileComment = async function(event, profileOwnerName) {
  event.preventDefault();
  if (!requireAuth()) return;
  
  const input = document.getElementById('profile-comment-input');
  if (!input || !input.value.trim()) return;
  
  const text = input.value.trim();
  
  try {
    await Backend.addGuestbookComment(profileOwnerName, text);
    input.value = '';
    
    let targetUser = State.users.find(u => u.name === profileOwnerName);
    if (targetUser) {
      renderProfileTabContent(targetUser);
    }
  } catch(e) {
    if (e.message === 'auth_required') openModal('modal-auth-required');
    else showToast(e.message, 'error');
  }
};

window.shareUserProfile = function(username) {
  const name = username || (State.activeProfileName || (State.currentUser ? State.currentUser.name : ''));
  if (!name) {
    showToast("Please sign in or view a profile first.", "info");
    return;
  }
  const shareUrl = `${window.location.origin}${window.location.pathname}?profile=${encodeURIComponent(name)}`;
  
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast("Profile link copied to clipboard!", "success");
  }).catch(() => {
    showToast("Failed to copy link.", "error");
  });
};
