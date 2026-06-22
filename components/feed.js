/* ==========================================================================
   VANLYFA COMPONENT: FEED.JS
   ========================================================================== */

function renderSocialFeed(containerId, isSidebar = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const query = State.searchQuery;
  
  // Cache check
  if (!State._cachedFeeds) {
    State._cachedFeeds = {};
  }
  const cacheKey = `${containerId}_${query}_${State.isSignedIn}_${State.currentUser ? State.currentUser.name : 'guest'}`;
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
        status: p.status || 'approved'
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
        status: m.status || 'approved'
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
        status: mt.status || 'approved'
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
          status: s.status || 'approved'
        });
      }
    });
  }
  
  // 2. Filter by search query
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
    
    return queryMatch && (isApproved || isOwner || isAdmin);
  });
  
  // 3. Sort Feed
  if (!State.isSignedIn) {
    // Guest Mode: Sort by popularity (likes)
    filtered.sort((a, b) => b.likes - a.likes);
  } else {
    // Logged In: chronological default (posts first or spots, let's keep array order or push newer ID first)
    // To mock chronological, we sort post-ID decreasing or keep post type order
    filtered.sort((a, b) => {
      // Keep post types at top, or sort by id timestamp if available
      const aTime = a.id.includes('-') ? parseInt(a.id.split('-').pop()) || 0 : 0;
      const bTime = b.id.includes('-') ? parseInt(b.id.split('-').pop()) || 0 : 0;
      if (aTime && bTime) return bTime - aTime;
      return 0;
    });
  }
  
  if (filtered.length === 0) {
    const emptyMarkup = `<div style="text-align:center; padding:32px 0; color:var(--muted-text); font-size:13px;">No feed items match your search.</div>`;
    container.innerHTML = emptyMarkup;
    State._cachedFeeds[cacheKey] = emptyMarkup;
    return;
  }
  
  let feedHtml = '';
  
  filtered.forEach(post => {
    let imgMarkup = '';
    if (post.image && post.image !== 'none') {
      imgMarkup = `<img src="${getImageSrc(post.image)}" alt="Post Media" class="post-image" style="border-radius:var(--radius-sm); margin-top:8px; width:100%; max-height:220px; object-fit:cover;">`;
    }
    
    // Type badges
    let typeBadgeMarkup = '';
    if (post.type === 'marketplace') {
      typeBadgeMarkup = `<span style="background:rgba(168,85,247,0.12); color:#a855f7; border: 1px solid rgba(168,85,247,0.2); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="shopping-bag" style="width:10px; height:10px;"></i> Marketplace</span>`;
    } else if (post.type === 'meetup') {
      typeBadgeMarkup = `<span style="background:rgba(239,68,68,0.12); color:#ef4444; border: 1px solid rgba(239,68,68,0.2); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="flame" style="width:10px; height:10px;"></i> Caravan Meetup</span>`;
    } else if (post.type === 'spot') {
      typeBadgeMarkup = `<span style="background:rgba(59,122,87,0.12); color:var(--accent-green); border: 1px solid var(--accent-green-light); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="map-pin" style="width:10px; height:10px;"></i> Vouched Spot</span>`;
    }
    
    // Moderation tag
    let modTagMarkup = '';
    if (post.status === 'pending') {
      modTagMarkup = `<span style="background:rgba(245,158,11,0.12); color:#f59e0b; border: 1px solid rgba(245,158,11,0.25); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; margin-left:6px; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="shield-alert" style="width:10px; height:10px;"></i> Pending Admin Approval</span>`;
    } else if (post.status === 'rejected') {
      modTagMarkup = `<span style="background:rgba(239,68,68,0.12); color:#ef4444; border: 1px solid rgba(239,68,68,0.25); font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600; margin-left:6px; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="shield-close" style="width:10px; height:10px;"></i> Flagged / Rejected</span>`;
    }

    // comments markup
    let commentsMarkup = '';
    if (post.comments && post.comments.length > 0) {
      commentsMarkup = `
        <div class="thread-replies-list" style="margin-top:10px; border-left: 2px solid var(--border-color); padding-left:12px; display:flex; flex-direction:column; gap:8px;">
          ${post.comments.map(c => {
            const commenter = State.users ? State.users.find(u => u.name === c.user) : null;
            const avatar = commenter ? commenter.avatar : 'avatar_bob';
            return `
              <div class="thread-reply-item" style="display:flex; gap:8px; align-items:flex-start; font-size:12px;">
                <img src="${getAvatarSrc(avatar)}" alt="${c.user}" class="reply-avatar" style="width:24px; height:24px; border-radius:50%; object-fit:cover; cursor:pointer;" onclick="viewUserProfile('${c.user}')">
                <div class="reply-content-box" style="background:var(--bg-sand); padding:6px 10px; border-radius:var(--radius-sm); flex-grow:1; text-align:left;">
                  <div class="reply-user-meta" style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <span class="reply-username" style="font-weight:700; color:var(--text-charcoal); cursor:pointer;" onclick="viewUserProfile('${c.user}')">${getUserRoleMarkup(c.user)}</span>
                    <span class="reply-time" style="font-size:10px; color:var(--muted-text);">Reply</span>
                  </div>
                  <p class="reply-text" style="color:var(--text-main); margin:0; line-height:1.3;">${parseMarkdownToHtml(c.text)}</p>
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
    const cardStyle = isSidebar ? '' : 'style="background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;"';

    // Action button handlers
    let clickGoMarkup = '';
    if (post.type === 'marketplace') {
      clickGoMarkup = `<button class="btn btn-xs" onclick="switchTab('marketplace')" style="font-size: 10px; background: rgba(168,85,247,0.1); color: #a855f7; border: 1px solid rgba(168,85,247,0.15); display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; cursor: pointer;"><i data-lucide="eye" style="width:12px; height:12px;"></i> View Listing</button>`;
    } else if (post.type === 'meetup') {
      clickGoMarkup = `<button class="btn btn-xs" onclick="switchTab('meetups')" style="font-size: 10px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; cursor: pointer;"><i data-lucide="calendar-days" style="width:12px; height:12px;"></i> View Event</button>`;
    } else if (post.type === 'spot') {
      clickGoMarkup = `<button class="btn btn-xs" onclick="viewSpotFromProfile('${post.rawId}')" style="font-size: 10px; background: rgba(59,122,87,0.1); color: var(--accent-green); border: 1px solid var(--accent-green-light); display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; cursor: pointer;"><i data-lucide="map" style="width:12px; height:12px;"></i> View Map Pin</button>`;
    }

    feedHtml += `
      <div class="feed-post-card" id="post-card-${post.id}" ${cardStyle}>
        <div class="thread-post-layout" style="display:flex; gap:12px;">
          <!-- Left Column: Avatar -->
          <div class="thread-left-col" style="display:flex; flex-direction:column; align-items:center;">
            <div class="thread-avatar-container" style="position:relative;">
              <img src="${getAvatarSrc(post.author.avatar)}" alt="${post.author.name}" onclick="viewUserProfile('${post.author.name}')" class="thread-avatar" style="width:36px; height:36px; border-radius:50%; object-fit:cover; cursor:pointer;">
            </div>
          </div>
          
          <!-- Right Column: Details & actions -->
          <div class="thread-right-col" style="flex-grow:1; text-align:left;">
            <div class="thread-header" style="display:flex; justify-content:space-between; align-items:center;">
              <div class="thread-user-meta" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:13px;">
                <span class="thread-author-name" onclick="viewUserProfile('${post.author.name}')" style="font-weight:700; color:var(--text-charcoal); cursor:pointer;">${getUserRoleMarkup(post.author.name)}</span>
                <span class="thread-dot" style="color:var(--muted-text);">•</span>
                <span class="thread-time" style="color:var(--muted-text); font-size:11px;">${post.time}</span>
                ${typeBadgeMarkup}
                ${modTagMarkup}
                ${clickGoMarkup}
              </div>
            </div>
            
            <div class="thread-body" style="margin-top:6px;">
              <p class="thread-content" style="margin:0; font-size:13px; line-height:1.5; color:var(--text-main);">${parseMarkdownToHtml(post.content)}</p>
              ${imgMarkup}
            </div>
            
            <div class="thread-actions-bar" style="display:flex; gap:16px; margin-top:12px; font-size:12px; color:var(--muted-text);">
              <button class="thread-action-icon-btn ${post.likedByUser ? 'liked' : ''}" onclick="toggleLike('${post.id}')" title="Like" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:4px; cursor:pointer;">
                <i data-lucide="heart" style="width:15px; height:15px; color:${post.likedByUser ? '#ef4444' : 'inherit'}; fill:${post.likedByUser ? '#ef4444' : 'none'};"></i>
                <span>${post.likes || 0}</span>
              </button>
              <button class="thread-action-icon-btn" onclick="focusCommentInput('${post.id}')" title="Comment" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:4px; cursor:pointer;">
                <i data-lucide="message-circle" style="width:15px; height:15px;"></i>
                <span>${post.comments ? post.comments.length : 0}</span>
              </button>
              <button class="thread-action-icon-btn" onclick="sharePost('${post.id}')" title="Share Link" style="background:none; border:none; color:inherit; display:flex; align-items:center; gap:4px; cursor:pointer;">
                <i data-lucide="share" style="width:15px; height:15px;"></i>
                <span>${post.shares || 0}</span>
              </button>
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
