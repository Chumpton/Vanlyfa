/* ==========================================================================
   VANLYFA COMPONENT: FORUM.JS
   ========================================================================== */

function renderForumSidebar() {
  const sidebar = document.getElementById('forum-categories-sidebar');
  if (!sidebar) return;
  
  // Extract unique categories from threads, ignoring empty or undefined ones
  const categories = new Set();
  State.forum.forEach(thread => {
    if (thread.category) {
      const cat = thread.category.trim();
      if (cat) categories.add(cat.toLowerCase());
    }
  });
  
  // Convert set to sorted array
  const sortedCats = Array.from(categories).sort();
  
  // Start building the HTML.
  // The first button is "All Topics"
  let html = `
    <button class="forum-cat-btn ${State.activeForumCategory === 'all' ? 'active' : ''}" data-cat="all">
      <i data-lucide="message-square"></i>
      <span>All Topics</span>
    </button>
  `;
  
  // Add a button for each category
  sortedCats.forEach(cat => {
    // Capitalize category name for display
    const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
    
    // Select an icon based on category name if we want, or just use a default hash icon
    let icon = "hash";
    if (cat === "electrical") icon = "zap";
    else if (cat === "destinations" || cat === "spots") icon = "map-pin";
    else if (cat === "builds" || cat === "campervan") icon = "wrench";
    else if (cat === "cooking" || cat === "food") icon = "utensils";
    else if (cat === "pets" || cat === "dog") icon = "heart";
    
    html += `
      <button class="forum-cat-btn ${State.activeForumCategory === cat ? 'active' : ''}" data-cat="${cat}">
        <i data-lucide="${icon}"></i>
        <span style="text-transform: capitalize;">${displayName}</span>
      </button>
    `;
  });
  
  sidebar.innerHTML = html;
  lucide.createIcons();
}

function renderForumView() {
  const mainView = document.getElementById('forum-main-view');
  const detailView = document.getElementById('forum-thread-detail');
  
  if (State.activeThreadId) {
    mainView.style.display = 'none';
    detailView.style.display = 'block';
    renderThreadDetail();
  } else {
    mainView.style.display = 'grid';
    detailView.style.display = 'none';
    renderForumSidebar();
    renderThreadsList();
  }
}

function renderThreadsList() {
  const container = document.getElementById('forum-thread-list');
  container.innerHTML = '';
  
  const category = State.activeForumCategory;
  const query = State.searchQuery;
  
  const filtered = State.forum.filter(t => {
    const threadCat = (t.category || '').trim().toLowerCase();
    const matchesCat = category === 'all' || threadCat === category.toLowerCase();
    const matchesQuery = t.title.toLowerCase().includes(query) || 
                         t.body.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:64px; color:var(--muted-text);">No forum threads found matching your criteria.</div>`;
    return;
  }
  
  filtered.forEach(thread => {
    const lastReply = thread.replies.length > 0 ? thread.replies[thread.replies.length - 1] : null;
    
    const card = document.createElement('div');
    card.className = 'forum-thread-card';
    card.addEventListener('click', () => {
      viewThreadDetail(thread.id);
    });
    
    let lastPostMarkup = `<div class="thread-last-post"><span class="thread-last-user" onclick="event.stopPropagation(); viewUserProfile('${thread.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(thread.author.name)}</span><span style="font-size:9px;">OP</span></div>`;
    if (lastReply) {
      lastPostMarkup = `
        <div class="thread-last-post">
          <span class="thread-last-user" onclick="event.stopPropagation(); viewUserProfile('${lastReply.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(lastReply.author.name)}</span>
          <span style="font-size:9px;">Yesterday</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="thread-main">
        <h3 class="thread-title">${thread.title}${thread.pendingSync ? ' <span class="sync-badge pending" style="font-size:10px; padding:2px 6px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:8px; font-weight:600; vertical-align:middle;">Pending Sync</span>' : ''}</h3>
        <div class="thread-meta">
          <span>Started by <strong onclick="event.stopPropagation(); viewUserProfile('${thread.author.name}')" style="cursor:pointer; hover:underline;">${getUserRoleMarkup(thread.author.name)}</strong></span>
          <span>•</span>
          <span style="text-transform: capitalize; color:var(--accent-green); font-weight:600;">${thread.category}</span>
        </div>
      </div>
      <div class="thread-stats">
        <div class="thread-stat-item">
          <span class="thread-stat-val">${thread.repliesCount}</span>
          <span>Replies</span>
        </div>
        <div class="thread-stat-item">
          <span class="thread-stat-val">${thread.viewsCount}</span>
          <span>Views</span>
        </div>
      </div>
      ${lastPostMarkup}
    `;
    container.appendChild(card);
  });
}

function viewThreadDetail(threadId) {
  const thread = State.forum.find(t => t.id === threadId);
  if (thread) {
    thread.viewsCount++;
    State.activeThreadId = threadId;
    saveStateToStorage();
    renderForumView();
  }
}

function renderThreadDetail() {
  const thread = State.forum.find(t => t.id === State.activeThreadId);
  if (!thread) return;
  
  const opContainer = document.getElementById('thread-op-container');
  const repliesContainer = document.getElementById('thread-replies-list');
  
  // Render OP
  opContainer.innerHTML = `
    <div class="post-user-info">
      <img src="${getAvatarSrc(thread.author.avatar)}" alt="${thread.author.name}" onclick="viewUserProfile('${thread.author.name}')" style="cursor:pointer;">
      <div class="post-meta">
        <span class="post-username" onclick="viewUserProfile('${thread.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(thread.author.name)}</span>
        <span class="post-time">${thread.date}</span>
      </div>
    </div>
    <h3 style="font-size:18px; font-weight:800; margin-top:8px;">${thread.title}${thread.pendingSync ? ' <span class="sync-badge pending" style="font-size:10px; padding:2px 6px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:8px; font-weight:600; vertical-align:middle;">Pending Sync</span>' : ''}</h3>
    <p class="post-content" style="font-size:14px; line-height:1.6;">${thread.body}</p>
  `;
  
  // Render Replies
  repliesContainer.innerHTML = '';
  if (thread.replies.length === 0) {
    repliesContainer.innerHTML = `<p style="color:var(--muted-text); font-size:12px; font-style:italic;">No replies yet. Be the first to answer!</p>`;
  } else {
    thread.replies.forEach(reply => {
      const card = document.createElement('div');
      card.className = 'reply-card';
      card.innerHTML = `
        <div class="post-user-info">
          <img src="${getAvatarSrc(reply.author.avatar)}" alt="${reply.author.name}" onclick="viewUserProfile('${reply.author.name}')" style="cursor:pointer;">
          <div class="post-meta">
            <span class="post-username" onclick="viewUserProfile('${reply.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(reply.author.name)}</span>
            <span class="post-time">${reply.date}${reply.pendingSync ? ' <span class="sync-badge pending" style="font-size:9px; padding:1px 4px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:6px; font-weight:600;">Pending Sync</span>' : ''}</span>
          </div>
        </div>
        <p class="post-content" style="font-size:13px; line-height:1.5;">${reply.body}</p>
      `;
      repliesContainer.appendChild(card);
    });
  }
  
  lucide.createIcons();
}
