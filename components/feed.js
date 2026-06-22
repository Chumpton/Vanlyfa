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
