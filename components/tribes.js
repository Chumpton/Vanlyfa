/* ==========================================================================
   VANLYFA COMPONENT: TRIBES.JS
   ========================================================================== */

function renderTribesList() {
  const grid = document.getElementById('tribes-grid');
  const yourGrid = document.getElementById('your-tribes-grid');
  const yourSection = document.getElementById('your-tribes-section');
  
  if (!grid) return;
  grid.innerHTML = '';
  if (yourGrid) yourGrid.innerHTML = '';
  
  const catFilter = document.getElementById('tribe-filter-category')?.value || 'all';
  const stateFilter = document.getElementById('tribe-filter-state')?.value || 'all';
  const idealFilter = document.getElementById('tribe-filter-ideal')?.value || 'all';
  
  const query = State.searchQuery;
  const filtered = State.tribes.filter(t => {
    const matchesQuery = t.title.toLowerCase().includes(query) || 
                         t.description.toLowerCase().includes(query);
    const matchesCat = catFilter === 'all' || t.category === catFilter;
    const matchesState = stateFilter === 'all' || t.state === stateFilter;
    const matchesIdeal = idealFilter === 'all' || t.ideal === idealFilter;
    return matchesQuery && matchesCat && matchesState && matchesIdeal;
  });
  
  const bannerColors = {
    forest: "linear-gradient(to right, #3B7A57, #5C8D70)",
    desert: "linear-gradient(to right, #DCD6C5, #6E6A5F)",
    ocean: "linear-gradient(to right, #2D2D2D, #3B7A57)",
    mountain: "linear-gradient(to right, #A6A194, #2D2D2D)"
  };
  
  // Populate "Your Tribes"
  const joinedTribes = State.tribes.filter(t => t.joined);
  if (joinedTribes.length > 0 && yourSection && yourGrid) {
    yourSection.style.display = 'block';
    joinedTribes.forEach(tribe => {
      const card = document.createElement('div');
      card.className = 'tribe-card';
      card.style.cursor = 'pointer';
      card.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') openTribeHub(tribe.id);
      };
      
      const bgGrad = bannerColors[tribe.banner] || bannerColors.forest;
      const bannerStyle = tribe.banner && tribe.banner.startsWith('data:') 
        ? `background-image: url(${tribe.banner}); background-size: cover; background-position: center;`
        : `background: ${bgGrad};`;
        
      const iconHtml = tribe.icon && tribe.icon.startsWith('data:')
        ? `<img src="${tribe.icon}" style="width:100%; height:100%; border-radius:inherit; object-fit:cover;" />`
        : tribe.iconLetter;
        
      card.innerHTML = `
        <div class="tribe-banner" style="${bannerStyle} height: 60px;">
          <div class="tribe-icon-overlap" style="width:36px; height:36px; font-size:14px; bottom:-12px; left:12px; overflow:hidden; border-radius:50%; display:flex; align-items:center; justify-content:center;">${iconHtml}</div>
        </div>
        <div class="tribe-details" style="padding: 16px 12px 12px 12px;">
          <h3 class="tribe-title" style="margin-top: 4px; font-size: 13px;">${tribe.title}${tribe.pendingSync ? ' <span class="sync-spinner" title="Syncing with database..."></span>' : ''}</h3>
          <div class="tribe-meta" style="font-size:11px; margin-bottom:8px;">
            <span>${tribe.membersCount} Members</span>
          </div>
          <button class="btn btn-sm" style="width:100%; font-size:11px;" onclick="toggleTribeMembership('${tribe.id}')">Leave</button>
        </div>
      `;
      yourGrid.appendChild(card);
    });
  } else if (yourSection) {
    yourSection.style.display = 'none';
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:64px; color:var(--muted-text);">No tribes found matching your search.</div>`;
    return;
  }
  
  filtered.forEach(tribe => {
    const card = document.createElement('div');
    card.className = 'tribe-card';
    card.style.cursor = 'pointer';
    card.onclick = (e) => {
      if (e.target.tagName !== 'BUTTON') openTribeHub(tribe.id);
    };
    
    const bgGrad = bannerColors[tribe.banner] || bannerColors.forest;
    const bannerStyle = tribe.banner && tribe.banner.startsWith('data:') 
      ? `background-image: url(${tribe.banner}); background-size: cover; background-position: center;`
      : `background: ${bgGrad};`;
      
    const iconHtml = tribe.icon && tribe.icon.startsWith('data:')
      ? `<img src="${tribe.icon}" style="width:100%; height:100%; border-radius:inherit; object-fit:cover;" />`
      : tribe.iconLetter;

    const joinBtnText = tribe.pendingJoin ? 'Pending Approval' : (tribe.joined ? 'Leave Tribe' : 'Join Tribe');
    const joinBtnClass = tribe.joined ? '' : 'btn-primary';
    const joinBtnDisabled = tribe.pendingJoin ? 'disabled' : '';

    card.innerHTML = `
      <div class="tribe-banner" style="${bannerStyle}">
        <div class="tribe-icon-overlap" style="overflow:hidden; border-radius:50%; display:flex; align-items:center; justify-content:center;">${iconHtml}</div>
      </div>
      <div class="tribe-details">
        <h3 class="tribe-title" style="margin-top: 12px;">${tribe.title}${tribe.pendingSync ? ' <span class="sync-spinner" title="Syncing with database..."></span>' : ''}</h3>
        <div class="tribe-meta" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span>${tribe.membersCount} Members</span>
          <div style="display:flex; gap:4px; align-items:center;">
            <span style="font-size:10px; font-weight:600; color:var(--muted-text); background:var(--bg-sand); padding:2px 6px; border-radius:4px;">${tribe.state} • ${tribe.category}</span>
            <span style="font-size:10px; font-weight:600; color:${tribe.isPublic ? 'var(--accent-green)' : '#f59e0b'}; background:var(--bg-sand); padding:2px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:2px;">
              <i data-lucide="${tribe.isPublic ? 'globe' : 'lock'}" style="width:10px; height:10px;"></i>
              ${tribe.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
        <p class="tribe-description">${tribe.description}</p>
        <div class="tribe-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top: 12px;">
          <span style="font-size:10px; color:var(--muted-text); font-style:italic;">Ideal: ${tribe.ideal}</span>
          <button class="btn btn-sm ${joinBtnClass}" ${joinBtnDisabled} onclick="toggleTribeMembership('${tribe.id}')">
            ${joinBtnText}
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  lucide.createIcons();
}

function openTribeHub(tribeId) {
  State.activeTribeId = tribeId;
  
  // Hide main list, show hub
  document.getElementById('tribes-main-view').style.display = 'none';
  document.getElementById('tribe-detail-view').style.display = 'block';
  
  // Render hub header
  renderTribeHubHeader(tribeId);
  
  // Default tab
  switchTribeHubTab('chat');
}

function closeTribeHub() {
  State.activeTribeId = null;
  document.getElementById('tribe-detail-view').style.display = 'none';
  document.getElementById('tribes-main-view').style.display = 'block';
  renderTribesList();
}

function renderTribeHubHeader(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  const container = document.getElementById('tribe-hub-header-card');
  if (!tribe || !container) return;
  
  const bannerColors = {
    forest: "linear-gradient(to right, #3B7A57, #5C8D70)",
    desert: "linear-gradient(to right, #DCD6C5, #6E6A5F)",
    ocean: "linear-gradient(to right, #2D2D2D, #3B7A57)",
    mountain: "linear-gradient(to right, #A6A194, #2D2D2D)"
  };
  const bgGrad = bannerColors[tribe.banner] || bannerColors.forest;
  const bannerStyle = tribe.banner && tribe.banner.startsWith('data:') 
    ? `background-image: url(${tribe.banner}); background-size: cover; background-position: center;`
    : `background: ${bgGrad};`;
    
  const iconHtml = tribe.icon && tribe.icon.startsWith('data:')
    ? `<img src="${tribe.icon}" style="width:100%; height:100%; border-radius:inherit; object-fit:cover;" />`
    : tribe.iconLetter;

  const joinBtnText = tribe.pendingJoin ? 'Pending Approval' : (tribe.joined ? 'Leave Tribe' : 'Join Tribe');
  const joinBtnClass = tribe.joined ? 'btn-outline' : 'btn-primary';
  const joinBtnDisabled = tribe.pendingJoin ? 'disabled' : '';

  container.innerHTML = `
    <div class="tribe-banner" style="${bannerStyle} height: 120px; position: relative;">
      <button class="btn btn-sm" onclick="closeTribeHub()" style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; padding: 6px; display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="arrow-left"></i></button>
      <div class="tribe-icon-overlap" style="position: absolute; bottom: -20px; left: 24px; width: 64px; height: 64px; border-radius: 50%; background-color: var(--accent-green); color: white; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 4px solid var(--card-bg); box-shadow: var(--shadow-md); overflow: hidden;">${iconHtml}</div>
    </div>
    <div style="padding: 32px 24px 24px 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text-charcoal);">${tribe.title}</h2>
          <span style="font-size: 13px; color: var(--muted-text); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            ${tribe.membersCount} members • 
            <span style="display: inline-flex; align-items: center; gap: 2px;">
              <i data-lucide="${tribe.isPublic ? 'globe' : 'lock'}" style="width: 12px; height: 12px;"></i>
              ${tribe.isPublic ? 'Public' : 'Private'}
            </span>
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline" onclick="window.shareTribe('${tribe.id}')" style="display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="share-2" style="width: 14px; height: 14px;"></i> Share
          </button>
          <button class="btn ${joinBtnClass}" ${joinBtnDisabled} onclick="toggleTribeHubMembership('${tribe.id}')">
            ${joinBtnText}
          </button>
        </div>
      </div>
      <p style="font-size: 14px; color: var(--text-charcoal); margin-top: 12px; line-height: 1.5;">${tribe.description}</p>
    </div>
  `;
  lucide.createIcons();
}

function switchTribeHubTab(tabName) {
  const chatBtn = document.getElementById('tribe-tab-chat-btn');
  const forumBtn = document.getElementById('tribe-tab-forum-btn');
  
  const chatPane = document.getElementById('tribe-pane-chat');
  const forumPane = document.getElementById('tribe-pane-forum');
  
  if (tabName === 'chat') {
    chatBtn.classList.add('active');
    forumBtn.classList.remove('active');
    chatPane.style.display = 'block';
    forumPane.style.display = 'none';
    renderTribeHubChat(State.activeTribeId);
  } else {
    chatBtn.classList.remove('active');
    forumBtn.classList.add('active');
    chatPane.style.display = 'none';
    forumPane.style.display = 'block';
    renderTribeHubForum(State.activeTribeId);
  }
}

function renderTribeHubChat(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  const container = document.getElementById('tribe-chat-messages-area');
  const form = document.getElementById('tribe-chat-form');
  if (!tribe || !container) return;
  
  if (!tribe.joined) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; padding:32px; color:var(--muted-text);">
        <i data-lucide="lock" style="width:36px; height:36px; margin-bottom:12px; color:var(--muted-text);"></i>
        <h4 style="font-weight:700; color:var(--text-charcoal); margin-bottom:4px;">Join this Tribe</h4>
        <p style="font-size:13px; max-width:280px; line-height:1.4;">Only members of this tribe can read and participate in the live group chat.</p>
      </div>
    `;
    form.style.opacity = '0.5';
    form.querySelector('input').disabled = true;
    form.querySelector('button').disabled = true;
    lucide.createIcons();
    return;
  }
  
  form.style.opacity = '1';
  form.querySelector('input').disabled = false;
  form.querySelector('button').disabled = false;
  
  const chats = (State.tribeChats && State.tribeChats[tribeId]) || [];
  container.innerHTML = '';
  
  if (chats.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:32px 0; color:var(--muted-text); font-size:13px; font-style:italic;">No messages in this chat room yet. Send the first message!</div>`;
    return;
  }
  
  chats.forEach(msg => {
    const isMe = msg.sender === State.currentUser.name;
    const msgDiv = document.createElement('div');
    msgDiv.style.display = 'flex';
    msgDiv.style.flexDirection = 'column';
    msgDiv.style.alignItems = isMe ? 'flex-end' : 'flex-start';
    msgDiv.style.gap = '2px';
    
    const senderObj = State.users.find(u => u.name === msg.sender);
    const avatar = senderObj ? senderObj.avatar : 'solar';
    
    msgDiv.innerHTML = `
      <div style="font-size:10px; color:var(--muted-text); font-weight:600; display:flex; align-items:center; gap:4px;">
        ${!isMe ? `<img src="${getAvatarSrc(avatar)}" style="width:14px; height:14px; border-radius:50%; object-fit:cover;" />` : ''}
        <span>${getUserRoleMarkup(msg.sender)}</span>
        <span style="font-size:8px;">${msg.time}</span>
      </div>
      <div style="max-width:70%; padding:8px 12px; font-size:13px; line-height:1.4; border-radius:16px; background-color:${isMe ? 'var(--accent-green)' : 'var(--card-bg)'}; color:${isMe ? 'white' : 'var(--text-charcoal)'}; border:${isMe ? 'none' : '1px solid var(--border-light)'}; margin-top:2px;">
        ${msg.text}
      </div>
    `;
    container.appendChild(msgDiv);
  });
  
  container.scrollTop = container.scrollHeight;
}

function renderTribeHubForum(tribeId) {
  const tribe = State.tribes.find(t => t.id === tribeId);
  const container = document.getElementById('tribe-forum-list');
  if (!tribe || !container) return;
  
  if (!tribe.joined) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:64px 32px; color:var(--muted-text);">
        <i data-lucide="lock" style="width:36px; height:36px; margin-bottom:12px; color:var(--muted-text);"></i>
        <h4 style="font-weight:700; color:var(--text-charcoal); margin-bottom:4px;">Join this Tribe</h4>
        <p style="font-size:13px; max-width:280px; line-height:1.4;">Only members of this tribe can read and start discussion forum threads.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  const threads = (State.tribeThreads && State.tribeThreads[tribeId]) || [];
  container.innerHTML = '';
  
  if (threads.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:48px 0; color:var(--muted-text); font-size:13px; background-color:var(--card-bg); border:1px solid var(--border-color); border-radius:8px;">
        No discussion threads in this tribe yet. Start the conversation!
      </div>
    `;
    return;
  }
  
  threads.forEach(thread => {
    const row = document.createElement('div');
    row.style.backgroundColor = 'var(--card-bg)';
    row.style.border = '1px solid var(--border-color)';
    row.style.borderRadius = 'var(--radius-md)';
    row.style.padding = '16px';
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.gap = '8px';
    
    let repliesHtml = '';
    if (thread.replies && thread.replies.length > 0) {
      repliesHtml = `
        <div style="margin-top:12px; border-top:1px solid var(--border-light); padding-top:8px; display:flex; flex-direction:column; gap:8px;">
          ${thread.replies.map(r => `
            <div style="background-color:var(--bg-sand); padding:8px 12px; border-radius:8px; font-size:12px;">
              <span style="font-weight:700; color:var(--text-charcoal);">${r.author}:</span>
              <span style="color:var(--muted-text); margin-left:4px;">${r.body}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h4 style="font-size:14px; font-weight:700; color:var(--text-charcoal);">${thread.title}</h4>
          <span style="font-size:11px; color:var(--muted-text);">Posted by ${thread.author} • ${thread.time}</span>
        </div>
      </div>
      <p style="font-size:13px; color:var(--text-charcoal); line-height:1.4; margin-top:4px;">${thread.body}</p>
      
      ${repliesHtml}
      
      <!-- Quick reply form -->
      <form style="display:flex; gap:8px; margin-top:8px;" onsubmit="submitTribeThreadReply(event, '${tribeId}', '${thread.id}')">
        <input type="text" placeholder="Add to the discussion..." style="flex-grow:1; background-color:var(--bg-sand); border:1px solid var(--border-color); border-radius:16px; padding:6px 12px; font-size:11px; outline:none;" required />
        <button type="submit" class="btn btn-sm btn-primary" style="border-radius:16px; padding:4px 12px; font-size:10px;">Reply</button>
      </form>
    `;
    container.appendChild(row);
  });
}

function openTribeNewThreadModal() {
  if (!requireAuth()) return;
  document.getElementById('tribe-thread-title').value = '';
  document.getElementById('tribe-thread-body').value = '';
  openModal('modal-add-tribe-thread');
}

window.saveNewTribeThread = function() {
  if (!requireAuth()) return;
  const title = document.getElementById('tribe-thread-title').value.trim();
  const body = document.getElementById('tribe-thread-body').value.trim();
  
  if (!title || !body) {
    showToast("Please fill out both the title and details fields.", "error");
    return;
  }
  
  const tribeId = State.activeTribeId;
  if (!tribeId) return;
  
  if (!State.tribeThreads) State.tribeThreads = {};
  if (!State.tribeThreads[tribeId]) State.tribeThreads[tribeId] = [];
  
  State.tribeThreads[tribeId].unshift({
    id: 'tthread-' + Date.now(),
    title: title,
    body: body,
    author: State.currentUser.name,
    time: 'Just now',
    replies: []
  });
  
  saveStateToStorage();
  closeModal('modal-add-tribe-thread');
  renderTribeHubForum(tribeId);
  showToast("Discussion thread posted!", "success");
};

window.shareTribe = function(tribeId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?tribe=${tribeId}`;
  navigator.clipboard.writeText(shareUrl);
  showToast("Tribe invite link copied to clipboard!", "success");
};
