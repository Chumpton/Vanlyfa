/* ==========================================================================
   VANLYFA COMPONENT: FORUM.JS
   ========================================================================== */

function renderForumSidebar() {
  const sidebar = document.getElementById('forum-categories-sidebar');
  if (!sidebar) return;
  
  let html = `
    <button class="forum-cat-btn ${State.activeForumCategory === 'all' ? 'active' : ''}" data-cat="all">
      <i data-lucide="message-square"></i>
      <span>All Topics</span>
    </button>
  `;
  
  if (typeof FORUM_CATEGORIES !== 'undefined') {
    FORUM_CATEGORIES.forEach(cat => {
      html += `
        <button class="forum-cat-btn ${State.activeForumCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
          <i data-lucide="${cat.icon}"></i>
          <span>${cat.name}</span>
        </button>
      `;
    });
  }
  
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
    card.style = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      margin-bottom: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
      gap: 16px;
    `;
    card.addEventListener('click', () => {
      viewThreadDetail(thread.id);
    });
    
    const authorUser = State.users.find(u => u.name === thread.author.name) || { avatar: 'avatar_bob', name: thread.author.name };
    const authorAvatarSrc = getAvatarSrc(authorUser.avatar);
    const rep = authorUser.reputation || 0;
    let roleBadge = 'NOMAD';
    let badgeColor = 'rgba(120, 120, 120, 0.1)';
    let textColor = 'var(--muted-text)';
    let borderColor = 'rgba(120, 120, 120, 0.2)';
    if (rep >= 30) {
      roleBadge = '★ ELITE';
      badgeColor = 'rgba(245, 158, 11, 0.15)';
      textColor = '#F59E0B';
      borderColor = '#F59E0B';
    } else if (rep >= 20) {
      roleBadge = 'VET';
      badgeColor = 'rgba(249, 115, 22, 0.15)';
      textColor = '#F97316';
      borderColor = '#F97316';
    } else if (rep >= 10) {
      roleBadge = 'EXPLORER';
      badgeColor = 'rgba(59, 130, 246, 0.15)';
      textColor = '#3B82F6';
      borderColor = '#3B82F6';
    }
    const badgeHtml = `<span class="sleek-badge" style="background: ${badgeColor}; color: ${textColor}; border: 1px solid ${borderColor}; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 700; display: inline-block; white-space: nowrap; flex-shrink: 0; margin-left: 6px;">${roleBadge}</span>`;

    let lastPostMarkup = '';
    if (lastReply) {
      const replyUser = State.users.find(u => u.name === lastReply.author.name) || { avatar: 'avatar_bob', name: lastReply.author.name };
      const replyAvatar = getAvatarSrc(replyUser.avatar);
      lastPostMarkup = `
        <div style="display: flex; align-items: center; gap: 8px; border-left: 1px solid var(--border-color); padding-left: 16px; min-width: 130px; justify-content: flex-start; box-sizing: border-box;">
          <img src="${replyAvatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
          <div style="display: flex; flex-direction: column; line-height: 1.1; font-size: 11px;">
            <span style="font-weight: 700; color: var(--text-main); white-space: nowrap;">${lastReply.author.name}</span>
            <span style="font-size: 9px; color: var(--muted-text);">Yesterday</span>
          </div>
        </div>
      `;
    } else {
      lastPostMarkup = `
        <div style="display: flex; align-items: center; border-left: 1px solid var(--border-color); padding-left: 16px; min-width: 130px; justify-content: flex-start; box-sizing: border-box;">
          <span style="font-size: 11px; color: var(--muted-text); font-style: italic; white-space: nowrap;">No replies yet</span>
        </div>
      `;
    }
    
    const catObj = typeof FORUM_CATEGORIES !== 'undefined' ? FORUM_CATEGORIES.find(c => c.id === (thread.category || '').toLowerCase()) : null;
    const catName = catObj ? catObj.name : thread.category;

    card.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: center; flex-grow: 1; min-width: 0;">
        ${thread.image ? `<img src="${thread.image}" style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0;" />` : ''}
        <div style="display: flex; flex-direction: column; gap: 6px; flex-grow: 1; min-width: 0;">
          <h3 class="thread-title" style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-charcoal); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${thread.title}${thread.pendingSync ? ' <span class="sync-badge pending" style="font-size:10px; padding:2px 6px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:8px; font-weight:600; vertical-align:middle;">Pending Sync</span>' : ''}</h3>
          <div class="thread-meta" style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; font-size: 12px; color: var(--muted-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; white-space: nowrap; font-weight: 600; color: var(--text-main);" onclick="event.stopPropagation(); viewUserProfile('${thread.author.name}')">
              <img src="${authorAvatarSrc}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
              <span style="white-space: nowrap;">${thread.author.name}</span>
            </div>
            ${badgeHtml}
            <span style="flex-shrink: 0;">•</span>
            <span style="color:var(--accent-green); font-weight:600; flex-shrink: 0;">${catName}</span>
            <span style="flex-shrink: 0;">•</span>
            <span style="flex-shrink: 0;">2 hours ago</span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 20px; flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--muted-text);">
          <span style="display: flex; align-items: center; gap: 4px; white-space: nowrap;"><i data-lucide="message-square" style="width: 14px; height: 14px;"></i> ${thread.repliesCount} replies</span>
          <span style="display: flex; align-items: center; gap: 4px; white-space: nowrap;"><i data-lucide="eye" style="width: 14px; height: 14px;"></i> ${thread.viewsCount} views</span>
        </div>
        ${lastPostMarkup}
      </div>
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
  let bannerHtml = '';
  if (thread.image) {
    bannerHtml = `<div class="thread-detail-banner" style="width: 100%; height: 200px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px;"><img src="${thread.image}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`;
  }

  opContainer.innerHTML = `
    ${bannerHtml}
    <div class="post-user-info">
      <img src="${getAvatarSrc(thread.author.avatar)}" alt="${thread.author.name}" onclick="viewUserProfile('${thread.author.name}')" style="cursor:pointer;">
      <div class="post-meta">
        <span class="post-username" onclick="viewUserProfile('${thread.author.name}')" style="cursor:pointer;">${getUserRoleMarkup(thread.author.name)}</span>
        <span class="post-time">${thread.date}</span>
      </div>
    </div>
    <h3 style="font-size:18px; font-weight:800; margin-top:8px;">${thread.title}${thread.pendingSync ? ' <span class="sync-badge pending" style="font-size:10px; padding:2px 6px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; margin-left:8px; font-weight:600; vertical-align:middle;">Pending Sync</span>' : ''}</h3>
    <p class="post-content" style="font-size:14px; line-height:1.6;">${parseMarkdownToHtml(thread.body)}</p>
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
        <p class="post-content" style="font-size:13px; line-height:1.5;">${parseMarkdownToHtml(reply.body)}</p>
      `;
      repliesContainer.appendChild(card);
    });
  }
  
  lucide.createIcons();
}
