/* ==========================================================================
   VANLYFA COMPONENT: FEED.JS
   ========================================================================== */

function renderSocialFeed(containerId, isSidebar = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const query = State.searchQuery;
  
  const selectedArea = State.feedFilterArea || 'all';
  const selectedSort = State.feedFilterSort || 'trending';
  const selectedSaved = State.feedFilterSaved || 'all';

  // Cache check
  if (!State._cachedFeeds) {
    State._cachedFeeds = {};
  }
  const cacheKey = `${containerId}_${query}_${State.isSignedIn}_${State.currentUser ? State.currentUser.name : 'guest'}_${selectedArea}_${selectedSort}_${selectedSaved}`;
  if (State._cachedFeeds[cacheKey]) {
    container.innerHTML = State._cachedFeeds[cacheKey];
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = '';
  
  // 1. Build combined feed list
  let combinedItems = [];
  
  // Add standard posts
  if (State.posts) {
    State.posts.forEach(p => {
      combinedItems.push({
        id: p.id,
        rawId: p.id,
        type: 'post',
        content: p.content,
        image: p.image,
        author: p.author || { name: "Nomad", avatar: "avatar_bob" },
        likes: p.likes || 0,
        likedByUser: p.likedByUser || false,
        reposts: p.reposts || 0,
        shares: p.shares || 0,
        time: p.time || '1h ago',
        comments: p.comments || [],
        status: p.status || 'approved',
        lat: p.lat,
        lng: p.lng,
        views: p.views || 0,
        saves: p.saves || 0
      });
    });
  }
  
  // Add marketplace listings
  if (State.marketplace) {
    State.marketplace.forEach(m => {
      combinedItems.push({
        id: `market-post-${m.id}`,
        rawId: m.id,
        type: 'marketplace',
        content: `📢 NEW MARKETPLACE LISTING: "${m.title}" - ${m.price === 0 ? 'Trade / Free' : '$' + m.price}.\n${m.description || ''}`,
        image: m.image,
        author: m.seller ? { name: m.seller.name, avatar: m.seller.avatar } : { name: "Nomad Seller", avatar: "avatar_clara" },
        likes: m.likes || 0,
        likedByUser: m.likedByUser || false,
        time: 'Marketplace',
        comments: [],
        status: m.status || 'approved',
        lat: m.lat,
        lng: m.lng,
        views: m.views || 0,
        saves: m.saves || 0
      });
    });
  }
  
  // Add meetups
  if (State.meetups) {
    State.meetups.forEach(mt => {
      combinedItems.push({
        id: `meetup-post-${mt.id}`,
        rawId: mt.id,
        type: 'meetup',
        content: `🔥 NEW CARAVAN MEETUP: "${mt.title}" at ${mt.location} on ${mt.date} at ${mt.time}. Bring your campfire chairs!\n${mt.description || ''}`,
        image: 'none',
        author: mt.host ? { name: mt.host.name, avatar: mt.host.avatar } : { name: "Host", avatar: "avatar_surf" },
        likes: mt.likes || 0,
        likedByUser: mt.likedByUser || false,
        time: 'Meetup Event',
        comments: mt.comments || [],
        status: mt.status || 'approved',
        lat: mt.lat,
        lng: mt.lng,
        views: mt.views || 0,
        saves: mt.saves || 0
      });
    });
  }
  
  // Add community spots
  if (State.spots) {
    State.spots.forEach(s => {
      if (s.id && !s.id.startsWith('usfs-')) {
        combinedItems.push({
          id: `spot-post-${s.id}`,
          rawId: s.id,
          type: 'spot',
          content: `📍 NEW CAMP SPOT VOUCHED: "${s.title}" (${s.category}). Coordinates: ${s.lat.toFixed(3)}, ${s.lng.toFixed(3)}.\n${s.description || ''}`,
          image: 'image_desert',
          author: s.author ? { name: s.author.name, avatar: s.author.avatar } : { name: "Spot Finder", avatar: "avatar_surf" },
          likes: s.likes || 0,
          likedByUser: s.likedByUser || false,
          time: 'New Spot',
          comments: [],
          status: s.status || 'approved',
          lat: s.lat,
          lng: s.lng,
          views: s.views || 0,
          saves: s.saves || 0
        });
      }
    });
  }
  
  // Helper for Area matching
  function postMatchesArea(item, area) {
    if (area === 'all') return true;
    let targetLat, targetLng;
    if (area === 'near') {
      const loc = getCachedLocation();
      if (loc && loc.status === 'present') {
        targetLat = loc.lat;
        targetLng = loc.lng;
      } else {
        return true; // if location not available, show everything
      }
    } else {
      const areaCoords = {
        moab: { lat: 38.5733, lng: -109.5498 },
        bend: { lat: 44.0582, lng: -121.3153 },
        flagstaff: { lat: 35.1983, lng: -111.6513 },
        baja: { lat: 24.1426, lng: -110.3128 }
      };
      const coords = areaCoords[area];
      if (!coords) return true;
      targetLat = coords.lat;
      targetLng = coords.lng;
    }
    
    if (typeof item.lat === 'number' && typeof item.lng === 'number') {
      const dist = calculateHaversineDistance(item.lat, item.lng, targetLat, targetLng);
      const maxRadius = area === 'near' ? 150 : 100;
      return dist <= maxRadius;
    }
    
    // String fallback for specific areas
    if (area !== 'near') {
      const txt = (item.content || '').toLowerCase();
      if (txt.includes(area)) return true;
    }
    return false;
  }

  // 2. Filter by search query, area, saves, and blocked users
  let filtered = combinedItems.filter(p => {
    const queryMatch = p.content.toLowerCase().includes(query.toLowerCase()) || 
                       p.author.name.toLowerCase().includes(query.toLowerCase()) ||
                       p.type.toLowerCase().includes(query.toLowerCase());
                        
    // Moderation Filter:
    // Approved items show to everyone.
    // Pending/Rejected items only show to the author or to the Admin
    const isOwner = State.isSignedIn && p.author.name === State.currentUser.name;
    const isAdmin = State.isSignedIn && State.currentUser.role === 'admin';
    const isApproved = p.status === 'approved';
    
    if (!(queryMatch && (isApproved || isOwner || isAdmin))) {
      return false;
    }

    // Blocked Users filter
    if (State.currentUser && State.currentUser.blockedUsers && State.currentUser.blockedUsers.includes(p.author.name)) {
      return false;
    }

    // Area filter
    if (!postMatchesArea(p, selectedArea)) {
      return false;
    }

    // Saved/Following filter
    if (selectedSaved === 'saved') {
      if (!State.currentUser || !State.currentUser.savedPostIds) return false;
      const isSaved = State.currentUser.savedPostIds.includes(p.rawId);
      if (!isSaved) return false;
    } else if (selectedSaved === 'following') {
      if (!State.isSignedIn) return false;
      const userObj = State.users.find(u => u.name === State.currentUser.name);
      const friends = userObj ? (userObj.friends || []) : [];
      if (!friends.includes(p.author.name)) return false;
    }
    
    return true;
  });
  
  // 3. Sort Feed
  if (selectedSort === 'trending') {
    // Sense user interests
    const userInterests = new Set(['#vanlife', '#camper', '#roadtrip']);
    if (State.isSignedIn) {
      if (State.currentUser.bio) {
        const bioWords = State.currentUser.bio.toLowerCase().match(/\b\w+\b/g) || [];
        bioWords.forEach(w => {
          if (w.length > 3) userInterests.add('#' + w);
        });
      }
      if (State.posts) {
        State.posts.forEach(postItem => {
          if (postItem.author && postItem.author.name === State.currentUser.name) {
            const tags = postItem.content.match(/#\w+/g) || [];
            tags.forEach(tag => userInterests.add(tag.toLowerCase()));
          }
        });
      }
    }

    // Sense community trending tags
    const hashtagCounts = {};
    if (State.posts) {
      State.posts.forEach(postItem => {
        const tags = postItem.content.match(/#\w+/g) || [];
        tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          hashtagCounts[lowerTag] = (hashtagCounts[lowerTag] || 0) + 1;
        });
      });
    }
    const trendingTags = Object.keys(hashtagCounts).filter(tag => hashtagCounts[tag] >= 2);

    filtered.forEach(p => {
      let recencyBoost = 0;
      const parts = p.id.split('-');
      const ts = parseInt(parts[parts.length - 1]);
      if (!isNaN(ts) && ts > 0) {
        const ageInHours = (Date.now() - ts) / (1000 * 60 * 60);
        recencyBoost = Math.max(0, 50 - ageInHours);
      }
      
      // Hashtag Boost
      let hashtagBoost = 0;
      const postTags = p.content.match(/#\w+/g) || [];
      postTags.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        if (userInterests.has(lowerTag)) hashtagBoost += 15;
        if (trendingTags.includes(lowerTag)) hashtagBoost += 5;
      });

      p._engagementScore = (p.likes * 3) + (p.saves * 5) + ((p.comments ? p.comments.length : 0) * 4) + (p.views * 0.5) + recencyBoost + hashtagBoost;
    });
    filtered.sort((a, b) => b._engagementScore - a._engagementScore);
  } else {
    // Chronological (Recent)
    filtered.sort((a, b) => {
      const aTime = a.id.includes('-') ? parseInt(a.id.split('-').pop()) || 0 : 0;
      const bTime = b.id.includes('-') ? parseInt(b.id.split('-').pop()) || 0 : 0;
      return bTime - aTime;
    });
  }
  
  if (filtered.length === 0) {
    const emptyMarkup = `<div style="text-align:center; padding:32px 0; color:var(--muted-text); font-size:13px;">No feed items match your search.</div>`;
    container.innerHTML = emptyMarkup;
    State._cachedFeeds[cacheKey] = emptyMarkup;
    return;
  }
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const defaultLimit = isMobile ? 12 : 30;
  const limit = State._feedLimit || defaultLimit;
  const displayItems = filtered.slice(0, limit);
  
  let feedHtml = '';
  
  displayItems.forEach(post => {
    // Views tracking (once per session) for all feed types (posts, marketplace, meetups, spots)
    if (!isSidebar) {
      if (!State.viewedPostsInSession) {
        State.viewedPostsInSession = new Set();
      }
      if (!State.viewedPostsInSession.has(post.id)) {
        State.viewedPostsInSession.add(post.id);
        let rawItem = null;
        if (post.type === 'post') {
          rawItem = State.posts.find(p => p.id === post.rawId);
        } else if (post.type === 'marketplace') {
          rawItem = State.marketplace.find(m => m.id === post.rawId);
        } else if (post.type === 'meetup') {
          rawItem = State.meetups.find(mt => mt.id === post.rawId);
        } else if (post.type === 'spot') {
          rawItem = State.spots.find(s => s.id === post.rawId);
        }
        
        if (rawItem) {
          rawItem.views = (rawItem.views || 0) + 1;
          post.views = rawItem.views; // Sync current rendering copy
          saveStateToStorage();
        }
      }
    }

    let imgMarkup = '';
    if (post.image && post.image !== 'none') {
      imgMarkup = `<img src="${getImageSrc(post.image)}" alt="Post Media" class="post-image" style="border-radius:var(--radius-sm); margin-top:8px; width:100%; max-height:220px; object-fit:cover;">`;
    }
    
    // Type badges
    let typeBadgeMarkup = '';
    if (post.type === 'marketplace') {
      typeBadgeMarkup = `<span style="background:rgba(168,85,247,0.12); color:#a855f7; border: 1px solid rgba(168,85,247,0.2); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="shopping-bag" style="width:10px; height:10px;"></i> market</span>`;
    } else if (post.type === 'meetup') {
      typeBadgeMarkup = `<span style="background:rgba(239,68,68,0.12); color:#ef4444; border: 1px solid rgba(239,68,68,0.2); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="flame" style="width:10px; height:10px;"></i> meetup</span>`;
    } else if (post.type === 'spot') {
      typeBadgeMarkup = `<span style="background:rgba(59,122,87,0.12); color:var(--accent-green); border: 1px solid var(--accent-green-light); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="map-pin" style="width:10px; height:10px;"></i> vouched</span>`;
    }
    
    // Moderation tag
    let modTagMarkup = '';
    if (post.status === 'pending') {
      modTagMarkup = `<span style="background:rgba(245,158,11,0.12); color:#f59e0b; border: 1px solid rgba(245,158,11,0.25); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; margin-left:6px; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="shield-alert" style="width:10px; height:10px;"></i> pending</span>`;
    } else if (post.status === 'rejected') {
      modTagMarkup = `<span style="background:rgba(239,68,68,0.12); color:#ef4444; border: 1px solid rgba(239,68,68,0.25); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; margin-left:6px; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="shield-close" style="width:10px; height:10px;"></i> rejected</span>`;
    }

    // comments markup (showing 1-2 visible inline, expand/collapse enabled)
    let commentsMarkup = '';
    if (post.comments && post.comments.length > 0) {
      const isExpanded = State._expandedPostComments && State._expandedPostComments.has(post.id);
      let renderedCount = 0;
      const totalVisible = post.comments.filter(c => !(State.currentUser && State.currentUser.blockedUsers && State.currentUser.blockedUsers.includes(c.user))).length;
      
      const commentItemsHtml = post.comments.map((c, index) => {
        const isBlocked = State.currentUser && State.currentUser.blockedUsers && State.currentUser.blockedUsers.includes(c.user);
        if (isBlocked) return '';
        
        renderedCount++;
        if (!isExpanded && renderedCount > 2) return '';
        
        const commenter = State.users ? State.users.find(u => u.name === c.user) : null;
        const avatar = commenter ? commenter.avatar : 'avatar_bob';
        return `
          <div class="thread-reply-item" style="display:flex; gap:8px; align-items:flex-start; font-size:12px;">
            <img src="${getAvatarSrc(avatar)}" alt="${c.user}" class="reply-avatar" style="width:24px; height:24px; border-radius:50%; object-fit:cover; cursor:pointer;" onclick="viewUserProfile('${c.user}')">
            <div class="reply-content-box" style="background:var(--bg-sand); padding:6px 10px; border-radius:var(--radius-sm); flex-grow:1; text-align:left;">
              <div class="reply-user-meta" style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span class="reply-username" style="font-weight:700; color:var(--text-charcoal); cursor:pointer;" onclick="viewUserProfile('${c.user}')">${getUserRoleMarkup(c.user)}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button onclick="window.replyToComment('${post.id}', '${c.user}')" class="reply-time-btn" style="background:none; border:none; padding:0; font-size:10px; color:var(--muted-text); cursor:pointer; font-weight:700; display:inline-flex; align-items:center;">Reply</button>
                  ${c.pendingSync ? '<span class="sync-spinner" title="Syncing with database..."></span>' : ''}
                  <button onclick="window.flagItem('comment', '${post.id}', ${index})" title="Flag/Report" style="background:none; border:none; padding:0; color:#ef4444; cursor:pointer; display:inline-flex; align-items:center;"><i data-lucide="flag" style="width:11px; height:11px;"></i></button>
                </div>
              </div>
              <p class="reply-text" style="color:var(--text-main); margin:0; line-height:1.3;">${parseMarkdownToHtml(c.text)}</p>
            </div>
          </div>
        `;
      }).join('');

      if (totalVisible > 0) {
        let threadLink = '';
        if (totalVisible > 2) {
          threadLink = `
            <button class="btn-view-thread" onclick="window.openPostDetailModal('${post.id}')" style="background:none; border:none; color:var(--accent-green); font-size:11px; font-weight:700; cursor:pointer; padding:6px 0; display:flex; align-items:center; gap:4px; margin-top: 4px;">
              <i data-lucide="messages-square" style="width:14px; height:14px;"></i>
              <span>View Discussion (${totalVisible} replies)</span>
            </button>
          `;
        } else {
          threadLink = `
            <button class="btn-view-thread" onclick="window.openPostDetailModal('${post.id}')" style="background:none; border:none; color:var(--accent-green); font-size:11px; font-weight:700; cursor:pointer; padding:6px 0; display:flex; align-items:center; gap:4px; margin-top: 4px;">
              <i data-lucide="messages-square" style="width:14px; height:14px;"></i>
              <span>View full conversation</span>
            </button>
          `;
        }

        commentsMarkup = `
          <div class="thread-replies-list" style="margin-top:10px; border-left: 2px solid var(--border-color); padding-left:12px; display:flex; flex-direction:column; gap:8px;">
            ${commentItemsHtml}
            ${threadLink}
          </div>
        `;
      }
    }
    
    const isGuest = !State.isSignedIn;
    const placeholderText = isGuest ? "Please sign in to reply..." : `Reply to ${post.author.name}...`;
    const disabledAttr = isGuest ? "disabled" : "";
    const avatarToUse = isGuest ? 'avatar_guest' : State.currentUser.avatar;
    const cardStyle = isSidebar ? '' : 'style="background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;"';

    // Action button handlers
    let clickGoMarkup = '';
    if (post.type === 'marketplace') {
      clickGoMarkup = `<button class="btn btn-xs" onclick="switchTab('marketplace')" title="View Listing" style="font-size: 10px; background: rgba(168,85,247,0.1); color: #a855f7; border: 1px solid rgba(168,85,247,0.15); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; padding: 0; cursor: pointer; margin-left: 2px;"><i data-lucide="eye" style="width:13px; height:13px;"></i></button>`;
    } else if (post.type === 'meetup') {
      clickGoMarkup = `<button class="btn btn-xs" onclick="switchTab('meetups')" title="View Event" style="font-size: 10px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; padding: 0; cursor: pointer; margin-left: 2px;"><i data-lucide="calendar-days" style="width:13px; height:13px;"></i></button>`;
    } else if (post.type === 'spot') {
      clickGoMarkup = `<button class="btn btn-xs" onclick="viewSpotFromProfile('${post.rawId}')" title="View Map Pin" style="font-size: 10px; background: rgba(59,122,87,0.1); color: var(--accent-green); border: 1px solid var(--accent-green-light); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; padding: 0; cursor: pointer; margin-left: 2px;"><i data-lucide="map" style="width:13px; height:13px;"></i></button>`;
    }

    const isSaved = State.currentUser && State.currentUser.savedPostIds && State.currentUser.savedPostIds.includes(post.rawId);

    feedHtml += `
      <div class="feed-post-card" id="post-card-${post.id}" ${cardStyle}>
        <div class="thread-post-layout" style="display:flex; gap:12px;">
          <!-- Left Column: Avatar with Follow Badge -->
          <div class="thread-left-col" style="display:flex; flex-direction:column; align-items:center;">
            <div class="thread-avatar-container" style="position:relative;">
              <img src="${getAvatarSrc(post.author.avatar)}" alt="${post.author.name}" onclick="viewUserProfile('${post.author.name}')" class="thread-avatar" style="width:36px; height:36px; border-radius:50%; object-fit:cover; cursor:pointer;">
              <div style="position:absolute; bottom:0px; right:0px; background:white; color:black; width:12px; height:12px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:bold; border:1px solid var(--card-bg); box-shadow:0 1px 3px rgba(0,0,0,0.2); cursor:pointer;" onclick="event.stopPropagation(); window.blockUser('${post.author.name}')">+</div>
            </div>
          </div>
          
          <!-- Right Column: Details & actions -->
          <div class="thread-right-col" style="flex-grow:1; text-align:left;">
            <div class="thread-header" style="display:flex; justify-content:space-between; align-items:center;">
              <div class="thread-user-meta" style="display:flex; align-items:center; gap:6px; font-size:14px;">
                <span class="thread-author-name" onclick="viewUserProfile('${post.author.name}')" style="font-weight:700; color:var(--text-charcoal); cursor:pointer;">${post.author.name}</span>
                <i data-lucide="check-circle-2" style="width:14px; height:14px; fill:#3B82F6; color:white; flex-shrink:0;"></i>
                <span class="thread-time" style="color:var(--muted-text); font-size:13px; margin-left:4px;">${post.time}</span>
                ${post.pendingSync ? '<span class="sync-spinner" title="Syncing with database..."></span>' : ''}
                ${modTagMarkup}
                ${clickGoMarkup}
              </div>
              
              <!-- More Options Button at top-right -->
              <div style="position: relative; display: flex; align-items: center;">
                <button class="thread-action-icon-btn feed-more-btn" onclick="window.toggleFeedPostMenu(event, '${post.id}')" title="More Options" style="background:none; border:none; color:var(--muted-text); display:flex; align-items:center; cursor:pointer; padding: 4px;">
                  <i data-lucide="more-horizontal" style="width:18px; height:18px;"></i>
                </button>
                <div id="post-menu-${post.id}" class="hidden" style="position: absolute; right: 0; top: 24px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1015; min-width: 120px;">
                  <button onclick="window.flagItem('post', '${post.id}'); window.toggleFeedPostMenu(event, '${post.id}')" style="display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; font-size: 11px; color: var(--text-main); cursor: pointer; border-bottom: 1px solid var(--border-color); font-weight:600;">
                    <i data-lucide="flag" style="width:12px; height:12px; color:#ef4444;"></i> Report Post
                  </button>
                  <button onclick="window.blockUser('${post.author.name}'); window.toggleFeedPostMenu(event, '${post.id}')" style="display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; font-size: 11px; color: var(--text-main); cursor: pointer; font-weight:600;">
                    <i data-lucide="slash" style="width:12px; height:12px; color:#ef4444;"></i> Block User
                  </button>
                </div>
              </div>
            </div>
            
            <div class="thread-body" style="margin-top:6px; cursor:pointer;" onclick="window.openPostDetailModal('${post.id}')">
              <p class="thread-content" style="margin:0; font-size:14px; line-height:1.5; color:var(--text-main);">${parseMarkdownToHtml(post.content)}</p>
              ${imgMarkup}
            </div>
            
            <div class="thread-actions-bar" style="display:flex; gap:28px; margin-top:12px; font-size:13px; color:var(--muted-text); align-items:center;">
              <button class="thread-action-icon-btn ${post.likedByUser ? 'liked' : ''}" onclick="toggleLike('${post.id}')" title="Like" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
                <i data-lucide="heart" style="width:18px; height:18px; color:${post.likedByUser ? '#ef4444' : 'inherit'}; fill:${post.likedByUser ? '#ef4444' : 'none'};"></i>
                <span>${post.likes || 0}</span>
              </button>
              <button class="thread-action-icon-btn" onclick="window.openPostDetailModal('${post.id}')" title="Comment" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
                <i data-lucide="message-circle" style="width:18px; height:18px;"></i>
                <span>${post.comments ? post.comments.length : 0}</span>
              </button>
              <button class="thread-action-icon-btn" onclick="window.toggleRepost('${post.id}')" title="Repost" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
                <i data-lucide="repeat" style="width:18px; height:18px;"></i>
                <span>${post.reposts || 0}</span>
              </button>
              <button class="thread-action-icon-btn" onclick="sharePost('${post.id}')" title="Share Link" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
                <i data-lucide="send" style="width:18px; height:18px;"></i>
                <span>${post.shares || 0}</span>
              </button>
            </div>
          </div>
        </div>
        ${commentsMarkup}
            
            <!-- Reply form -->
            <form class="thread-reply-form" onsubmit="submitComment(event, '${post.id}')" style="display:flex; gap:8px; margin-top:10px; align-items:center;">
              <img src="${getAvatarSrc(avatarToUse)}" alt="Me" class="thread-reply-avatar" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
              <div class="thread-reply-input-wrapper" style="display:flex; border:1px solid var(--border-color); border-radius:16px; padding:4px 8px; flex-grow:1; background:var(--bg-sand); align-items:center;">
                <input type="text" placeholder="${placeholderText}" id="comment-input-${post.id}" class="thread-reply-input" ${disabledAttr} style="border:none; background:none; flex-grow:1; font-size:12px; color:var(--text-main); outline:none;">
                <button type="submit" class="thread-reply-submit-btn" ${disabledAttr} style="background:none; border:none; color:var(--accent-green); cursor:pointer;"><i data-lucide="corner-down-left" style="width:14px; height:14px;"></i></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  });
  
  if (filtered.length > limit) {
    feedHtml += `
      <div id="feed-load-more-btn" onclick="State._feedLimit = (State._feedLimit || ${defaultLimit}) + 15; State._cachedFeeds = {}; ${isSidebar ? 'renderDashboardFeed()' : 'renderFeedTabPosts()'};" style="text-align:center; padding:12px; margin: 16px 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--accent-green); font-weight: bold; cursor: pointer; font-size: 12px; display: block; width: 100%; box-sizing: border-box;">
        Show More Updates (${filtered.length - limit} remaining)
      </div>
    `;
  }
  
  container.innerHTML = feedHtml;
  State._cachedFeeds[cacheKey] = feedHtml;
  if (window.lucide) lucide.createIcons();
}

function sharePost(postId) {
  const { target } = findPostOrItem(postId);
  if (target) {
    if (!target.shares) target.shares = 0;
    target.shares++;
    saveStateToStorage();
    State._cachedFeeds = {};
    renderDashboardFeed();
    renderFeedTabPosts();

    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("Post link copied to clipboard!", "success");
      }).catch(err => {
        console.error("Failed to copy: ", err);
        fallbackCopyText(shareUrl);
      });
    } else {
      fallbackCopyText(shareUrl);
    }
  }
}

function fallbackCopyText(text) {
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand('copy');
    showToast("Post link copied to clipboard!", "success");
  } catch (err) {
    showToast("Could not copy link. Copy manually: " + text, "warning");
  }
  document.body.removeChild(input);
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

window.toggleExpandComments = function(postId) {
  if (!State._expandedPostComments) {
    State._expandedPostComments = new Set();
  }
  if (State._expandedPostComments.has(postId)) {
    State._expandedPostComments.delete(postId);
  } else {
    State._expandedPostComments.add(postId);
  }
  State._cachedFeeds = {};
  renderDashboardFeed();
  renderFeedTabPosts();
};

window.toggleFeedPostMenu = function(event, postId) {
  event.stopPropagation();
  const menu = document.getElementById(`post-menu-${postId}`);
  if (menu) {
    const isHidden = menu.classList.contains('hidden');
    document.querySelectorAll('[id^="post-menu-"]').forEach(m => {
      m.classList.add('hidden');
    });
    if (isHidden) {
      menu.classList.remove('hidden');
    }
  }
};

document.addEventListener('click', () => {
  document.querySelectorAll('[id^="post-menu-"]').forEach(m => {
    m.classList.add('hidden');
  });
});

window.replyToComment = function(postId, username) {
  if (!State.isSignedIn) {
    showToast("Please sign in to reply.", "warning");
    return;
  }
  const input = document.getElementById(`comment-input-${postId}`);
  if (input) {
    input.focus();
    const userObj = State.users.find(u => u.name === username);
    const handle = userObj ? userObj.handle : `@${username.toLowerCase().replace(/\s+/g, '_')}`;
    input.value = `${handle} ${input.value}`;
  }
};

window.openPostDetailModal = function(postId) {
  const { target } = findPostOrItem(postId);
  if (!target) return;

  const modal = document.getElementById('modal-post-detail');
  const body = document.getElementById('post-detail-modal-body');
  if (!modal || !body) return;

  // Track views once per session
  if (!State.viewedPostsInSession) {
    State.viewedPostsInSession = new Set();
  }
  if (!State.viewedPostsInSession.has(postId)) {
    State.viewedPostsInSession.add(postId);
    target.views = (target.views || 0) + 1;
    saveStateToStorage();
    renderDashboardFeed();
    renderFeedTabPosts();
  }

  const authorAvatar = getAvatarSrc(target.author ? target.author.avatar : 'avatar_bob');
  const postAuthorName = target.author ? target.author.name : 'Nomad';
  const postTime = target.time || 'Just now';
  const postContent = parseMarkdownToHtml(target.content);
  
  let imgMarkup = '';
  if (target.image && target.image !== 'none') {
    imgMarkup = `<img src="${getImageSrc(target.image)}" alt="Post Media" style="border-radius:var(--radius-md); margin-top:12px; width:100%; max-height:350px; object-fit:contain; background:#111;">`;
  }

  let typeBadgeMarkup = '';
  if (postId.startsWith('market-post-')) {
    typeBadgeMarkup = `<span style="background:rgba(168,85,247,0.12); color:#a855f7; border: 1px solid rgba(168,85,247,0.2); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="shopping-bag" style="width:10px; height:10px;"></i> market</span>`;
  } else if (postId.startsWith('meetup-post-')) {
    typeBadgeMarkup = `<span style="background:rgba(239,68,68,0.12); color:#ef4444; border: 1px solid rgba(239,68,68,0.2); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="flame" style="width:10px; height:10px;"></i> meetup</span>`;
  } else if (postId.startsWith('spot-post-')) {
    typeBadgeMarkup = `<span style="background:rgba(59,122,87,0.12); color:var(--accent-green); border: 1px solid var(--accent-green-light); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="map-pin" style="width:10px; height:10px;"></i> vouched</span>`;
  }

  let commentsListHtml = '';
  const comments = target.comments || [];
  const blockedUsers = State.currentUser?.blockedUsers || [];
  const visibleComments = comments.filter(c => !blockedUsers.includes(c.user));

  if (visibleComments.length === 0) {
    commentsListHtml = `<div style="text-align:center; padding:24px 0; color:var(--muted-text); font-size:12px; font-style:italic;">No replies yet. Start the conversation!</div>`;
  } else {
    visibleComments.forEach((c, index) => {
      const commenter = State.users ? State.users.find(u => u.name === c.user) : null;
      const avatar = commenter ? commenter.avatar : 'avatar_bob';
      commentsListHtml += `
        <div class="thread-reply-item" style="display:flex; gap:10px; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--border-color);">
          <img src="${getAvatarSrc(avatar)}" alt="${c.user}" class="reply-avatar" style="width:28px; height:28px; border-radius:50%; object-fit:cover; cursor:pointer;" onclick="closeModal('modal-post-detail'); viewUserProfile('${c.user}')">
          <div style="flex-grow:1; text-align:left;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
              <span style="font-weight:700; color:var(--text-charcoal); cursor:pointer;" onclick="closeModal('modal-post-detail'); viewUserProfile('${c.user}')">${getUserRoleMarkup(c.user)}</span>
              <div style="display:flex; gap:8px; align-items:center;">
                <button onclick="window.replyToModalComment('${postId}', '${c.user}')" style="background:none; border:none; padding:0; font-size:10px; color:var(--muted-text); cursor:pointer; font-weight:700;">Reply</button>
                <button onclick="window.flagItem('comment', '${postId}', ${index})" title="Flag/Report" style="background:none; border:none; padding:0; color:#ef4444; cursor:pointer; display:inline-flex; align-items:center;"><i data-lucide="flag" style="width:11px; height:11px;"></i></button>
              </div>
            </div>
            <p style="color:var(--text-main); margin:0; font-size:12px; line-height:1.4;">${parseMarkdownToHtml(c.text)}</p>
          </div>
        </div>
      `;
    });
  }

  const isGuest = !State.isSignedIn;
  const placeholderText = isGuest ? "Please sign in to reply..." : `Reply to ${postAuthorName}...`;
  const disabledAttr = isGuest ? "disabled" : "";
  const avatarToUse = isGuest ? 'avatar_guest' : State.currentUser.avatar;

  const isSaved = State.currentUser && State.currentUser.savedPostIds && State.currentUser.savedPostIds.includes(target.id);
  const likedByUser = target.likedByUser || false;

  body.innerHTML = `
    <!-- Original Post -->
    <div style="display:flex; gap:12px; border-bottom:1px solid var(--border-color); padding-bottom:16px; margin-bottom:16px;">
      <img src="${authorAvatar}" alt="${postAuthorName}" onclick="closeModal('modal-post-detail'); viewUserProfile('${postAuthorName}')" style="width:40px; height:40px; border-radius:50%; object-fit:cover; cursor:pointer;">
      <div style="flex-grow:1; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:13px;">
            <span style="font-weight:700; color:var(--text-charcoal); cursor:pointer;" onclick="closeModal('modal-post-detail'); viewUserProfile('${postAuthorName}')">${getUserRoleMarkup(postAuthorName)}</span>
            <span style="color:var(--muted-text);">•</span>
            <span style="color:var(--muted-text); font-size:11px;">${postTime}</span>
          </div>
        </div>
        <div style="margin-top:8px; font-size:14px; line-height:1.5; color:var(--text-main);">${postContent}</div>
        ${imgMarkup}
        
        <!-- Post Stats & Action Bar -->
        <div style="display:flex; gap:28px; margin-top:16px; font-size:13px; color:var(--muted-text); border-top:1.5px solid var(--border-color); padding-top:12px; align-items:center;">
          <button onclick="window.toggleLike('${postId}'); window.openPostDetailModal('${postId}')" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
            <i data-lucide="heart" style="width:18px; height:18px; color:${likedByUser ? '#ef4444' : 'inherit'}; fill:${likedByUser ? '#ef4444' : 'none'};"></i>
            <span>${target.likes || 0}</span>
          </button>
          <span style="display:flex; align-items:center; gap:6px;">
            <i data-lucide="message-circle" style="width:18px; height:18px;"></i>
            <span>${comments.length}</span>
          </span>
          <button onclick="window.toggleRepost('${postId}'); window.openPostDetailModal('${postId}')" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
            <i data-lucide="repeat" style="width:18px; height:18px;"></i>
            <span>${target.reposts || 0}</span>
          </button>
          <button onclick="sharePost('${postId}')" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:6px; cursor:pointer; padding:0;">
            <i data-lucide="send" style="width:18px; height:18px;"></i>
            <span>${target.shares || 0}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Comments / Thread replies list -->
    <h4 style="font-size:13px; font-weight:700; color:var(--text-charcoal); margin-bottom:8px; text-align:left;">Discussion (${comments.length})</h4>
    <div style="max-height: 250px; overflow-y: auto; padding-right: 4px; display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
      ${commentsListHtml}
    </div>

    <!-- Reply input form for modal -->
    <form onsubmit="window.submitModalComment(event, '${postId}')" style="display:flex; gap:8px; align-items:center; border-top:1px solid var(--border-color); padding-top:12px;">
      <img src="${getAvatarSrc(avatarToUse)}" alt="Me" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">
      <div style="display:flex; border:1px solid var(--border-color); border-radius:16px; padding:4px 8px; flex-grow:1; background:var(--bg-sand); align-items:center;">
        <input type="text" placeholder="${placeholderText}" id="modal-comment-input-${postId}" ${disabledAttr} style="border:none; background:none; flex-grow:1; font-size:12px; color:var(--text-main); outline:none;">
        <button type="submit" ${disabledAttr} style="background:none; border:none; color:var(--accent-green); cursor:pointer;"><i data-lucide="corner-down-left" style="width:14px; height:14px;"></i></button>
      </div>
    </form>
  `;

  openModal('modal-post-detail');
  if (window.lucide) lucide.createIcons();
};

window.replyToModalComment = function(postId, username) {
  const input = document.getElementById(`modal-comment-input-${postId}`);
  if (input) {
    input.focus();
    const userObj = State.users.find(u => u.name === username);
    const handle = userObj ? userObj.handle : `@${username.toLowerCase().replace(/\s+/g, '_')}`;
    input.value = `${handle} ${input.value}`;
  }
};

window.submitModalComment = function(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`modal-comment-input-${postId}`);
  if (input && input.value.trim() !== '') {
    const tempInput = document.createElement('input');
    tempInput.id = `comment-input-${postId}`;
    tempInput.value = input.value;
    document.body.appendChild(tempInput);
    
    window.submitComment({ preventDefault: () => {} }, postId);
    
    document.body.removeChild(tempInput);
    
    setTimeout(() => {
      window.openPostDetailModal(postId);
    }, 200);
  }
};

window.toggleRepost = function(postId) {
  const { target } = findPostOrItem(postId);
  if (target) {
    if (!target.reposts) target.reposts = 0;
    if (target.repostedByUser) {
      target.reposts--;
      target.repostedByUser = false;
    } else {
      target.reposts++;
      target.repostedByUser = true;
    }
    saveStateToStorage();
    State._cachedFeeds = {};
    renderDashboardFeed();
    renderFeedTabPosts();
  }
};

