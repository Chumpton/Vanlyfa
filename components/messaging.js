/* ==========================================================================
   VANLYFA COMPONENT: MESSAGING.JS
   ========================================================================== */

function renderContactsSidebar() {
  const sidebarContainer = document.getElementById('contacts-list-scroll');
  const tabContainer = document.getElementById('messages-tab-contacts-list');
  
  const contacts = State.users.filter(u => u.name !== State.currentUser.name);
  
  const populate = (container) => {
    if (!container) return;
    container.innerHTML = '';
    
    contacts.forEach(contact => {
      const row = document.createElement('div');
      row.className = 'contact-item-row';
      row.onclick = () => openDirectChat(contact.name);
      
      const isOnline = contact.name === "Clara Outdoors" || contact.name === "Forest Nomad" || contact.name === "Baja Surfer";
      
      const messages = State.chats[contact.name] || [];
      let lastMsgText = "No messages yet";
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        lastMsgText = (lastMsg.sender === State.currentUser.name ? "You: " : "") + lastMsg.text;
      }
      
      row.innerHTML = `
        <div class="contact-item-avatar-wrap">
          <img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="contact-item-avatar">
          <div class="contact-status-dot ${isOnline ? 'online' : ''}"></div>
        </div>
        <div class="contact-item-details">
          <div class="contact-item-name">${contact.name}</div>
          <div class="contact-item-preview">${lastMsgText}</div>
        </div>
      `;
      container.appendChild(row);
    });
  };
  
  populate(sidebarContainer);
  populate(tabContainer);
  
  // Compute unread count based on active chats that are closed or seed
  const unreadCount = (State.unreadChats || []).length;
  const openActive = State.activeChats.length > 0;
  
  const badges = [
    document.getElementById('contacts-unread-badge'),
    document.getElementById('nav-messages-badge'),
    document.getElementById('mobile-feed-unread-badge')
  ];
  
  badges.forEach(badge => {
    if (badge) {
      if (unreadCount > 0 && !openActive) {
        badge.innerText = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  });
}

function openDirectChat(username) {
  if (!requireAuth()) return;
  const sidebar = document.getElementById('contacts-sidebar');
  if (sidebar) sidebar.classList.remove('open');
  
  if (!State.chats) State.chats = {};
  if (!State.chats[username]) {
    State.chats[username] = [];
  }
  if (State.unreadChats && State.unreadChats.includes(username)) {
    State.unreadChats = State.unreadChats.filter(name => name !== username);
  }
  
  if (!State.activeChats.includes(username)) {
    const isMobile = window.innerWidth <= 768;
    const limit = isMobile ? 1 : 3;
    
    if (State.activeChats.length >= limit) {
      State.activeChats.shift();
    }
    State.activeChats.push(username);
    if (isMobile) {
      history.pushState({ chat: true }, '');
    }
  }
  
  State.minimizedChats = State.minimizedChats.filter(name => name !== username);
  
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  setTimeout(() => {
    const chatArea = document.querySelector(`.chat-window[data-username="${username}"] .chat-messages-area`);
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    
    const inputEl = document.querySelector(`.chat-window[data-username="${username}"] .chat-input-field`);
    if (inputEl) inputEl.focus();
  }, 100);
}

function toggleChatMinimize(username, event) {
  if (event) event.stopPropagation();
  
  if (State.minimizedChats.includes(username)) {
    State.minimizedChats = State.minimizedChats.filter(name => name !== username);
  } else {
    State.minimizedChats.push(username);
  }
  
  saveStateToStorage();
  renderActiveChats();
}

function closeDirectChat(username, event) {
  if (event) event.stopPropagation();
  
  State.activeChats = State.activeChats.filter(name => name !== username);
  State.minimizedChats = State.minimizedChats.filter(name => name !== username);
  
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
}

function renderActiveChats() {
  const container = document.getElementById('chat-windows-container');
  if (!container) return;

  const isMobile = window.innerWidth <= 768;
  const chatBackdrop = document.getElementById('chat-backdrop');
  if (chatBackdrop) {
    const hasActiveOpenChat = isMobile && State.activeChats.length > 0 && !State.minimizedChats.includes(State.activeChats[State.activeChats.length - 1]);
    if (hasActiveOpenChat) {
      chatBackdrop.classList.add('active');
      chatBackdrop.style.display = 'block';
    } else {
      chatBackdrop.classList.remove('active');
      setTimeout(() => {
        if (!chatBackdrop.classList.contains('active')) {
          chatBackdrop.style.display = 'none';
        }
      }, 300);
    }
  }
  
  // Set body class for hiding bottom navigation drawer on mobile when chat is active
  const hasOpenChat = isMobile && State.activeChats.length > 0 && !State.minimizedChats.includes(State.activeChats[State.activeChats.length - 1]);
  if (hasOpenChat) {
    document.body.classList.add('mobile-chat-open');
  } else {
    document.body.classList.remove('mobile-chat-open');
  }
  
  container.innerHTML = '';
  if (State.activeChats.length === 0) {
    container.style.height = '';
  }
  
  State.activeChats.forEach(username => {
    const contact = State.users.find(u => u.name === username);
    if (!contact) return;
    
    const isMinimized = State.minimizedChats.includes(username);
    
    const chatBox = document.createElement('div');
    chatBox.className = `chat-window ${isMinimized ? 'minimized' : ''}`;
    chatBox.setAttribute('data-username', username);
    
    const isOnline = username === "Clara Outdoors" || username === "Forest Nomad" || username === "Baja Surfer";
    const statusText = isOnline ? "Active now" : "Active 2h ago";
    
    const messages = State.chats[username] || [];
    let messagesHtml = '';
    
    if (messages.length === 0) {
      messagesHtml = `<div style="text-align:center; color:var(--muted-text); font-size:11px; margin-top:20px; font-style:italic;">No messages yet. Say hi!</div>`;
    } else {
      let lastTime = '';
      messages.forEach(msg => {
        if (msg.time && msg.time !== lastTime && (msg.time.includes('PM') || msg.time.includes('AM') || msg.time === 'Yesterday')) {
          messagesHtml += `<div class="chat-date-divider">${msg.time}</div>`;
          lastTime = msg.time;
        }
        
        const isMe = msg.sender === State.currentUser.name || msg.sender === 'me';
        
        let tickIcon = 'check'; // Default sent status
        let tickColor = 'var(--muted-text)';
        if (msg.status === 'read') {
          tickIcon = 'check-check';
          tickColor = 'var(--accent-green)';
        } else if (msg.status === 'delivered') {
          tickIcon = 'check-check';
          tickColor = 'var(--muted-text)';
        }
        
        const statusMarkup = isMe ? `
          <div class="chat-msg-status-area" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; font-size: 9px; opacity: 0.65; justify-content: flex-end; width: 100%;">
            <span style="font-size: 8px;">${msg.time || ''}</span>
            <span class="chat-msg-ticks" id="ticks-${msg.id}">
              <i data-lucide="${tickIcon}" style="width: 11px; height: 11px; color: ${tickColor}; display: inline-block;"></i>
            </span>
          </div>
        ` : '';

        messagesHtml += `
          <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
            ${!isMe ? `<img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="chat-msg-avatar" onclick="viewUserProfile('${contact.name}')" style="cursor:pointer;">` : ''}
            <div class="chat-msg-bubble-wrap" style="display: flex; flex-direction: column; width: max-content; max-width: 75%; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
              <div class="chat-msg-bubble" style="cursor:pointer; padding: 8px 12px; width: fit-content; max-width: 100%; word-break: break-word;" onclick="toggleHeartReaction('${username}', '${msg.id}')" title="Click to react with Heart">
                ${msg.text}
              </div>
              ${msg.reaction ? `<div class="chat-bubble-reaction" onclick="toggleHeartReaction('${username}', '${msg.id}')" style="margin-top: -8px; z-index: 1;">❤️</div>` : ''}
              ${statusMarkup}
            </div>
          </div>
        `;
      });
    }
    
    const backBtnHtml = isMobile ? `
      <button class="chat-header-back-btn" onclick="closeDirectChat('${username}', event)" title="Back">
        <i data-lucide="arrow-left"></i>
      </button>
    ` : '';
    
    chatBox.innerHTML = `
      <div class="chat-header" ${!isMobile ? `onclick="toggleChatMinimize('${username}')"` : ''}>
        <div class="chat-header-left">
          ${backBtnHtml}
          <div class="chat-header-info">
            <img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="chat-header-avatar" onclick="event.stopPropagation(); viewUserProfile('${contact.name}')" style="cursor:pointer;">
            <div class="chat-header-meta">
              <span class="chat-header-name">${getUserRoleMarkup(contact.name)}</span>
              <span class="chat-header-status">${statusText}</span>
            </div>
          </div>
        </div>
        <div class="chat-header-controls">
          ${!isMobile ? `<button class="chat-header-control-btn" title="Minimize" onclick="toggleChatMinimize('${username}', event)"><i data-lucide="minus"></i></button>` : ''}
          <button class="chat-header-control-btn chat-close-btn" title="Close" onclick="closeDirectChat('${username}', event)"><i data-lucide="x"></i></button>
        </div>
      </div>
      
      <div class="chat-messages-area">
        ${messagesHtml}
      </div>
      
      <div class="chat-footer">
        <div class="chat-footer-top">
          <button class="chat-footer-action-btn" title="Photos" onclick="showToast('Media attachment not supported in chat.', 'info')"><i data-lucide="image"></i></button>
          <button class="chat-footer-action-btn" title="Stickers" onclick="showToast('Stickers not loaded.', 'info')"><i data-lucide="smile"></i></button>
          
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input-field" placeholder="Aa" onkeypress="handleChatKeyPress(event, '${username}')" onfocus="setTimeout(adjustChatContainerForVisualViewport, 300)" onblur="setTimeout(adjustChatContainerForVisualViewport, 100)">
            <button class="chat-input-emoji-btn" title="Emoji" onclick="insertSampleEmoji('${username}')">
              <i data-lucide="smile-plus"></i>
            </button>
          </div>
          
          <button class="chat-footer-action-btn chat-send-btn" title="Like" onclick="sendPlantSticker('${username}')"><i data-lucide="thumbs-up"></i></button>
        </div>
      </div>
    `;
    container.appendChild(chatBox);
    
    if (!isMinimized) {
      const messagesArea = chatBox.querySelector('.chat-messages-area');
      if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  });
  
  lucide.createIcons();
  adjustChatContainerForVisualViewport();
}

function adjustChatContainerForVisualViewport() {
  const container = document.getElementById('chat-windows-container');
  if (!container) return;
  
  if (window.innerWidth <= 768) {
    if (State.activeChats.length === 0) {
      container.style.height = '';
      container.style.top = '';
      return;
    }
    if (window.visualViewport) {
      container.style.top = `${window.visualViewport.offsetTop}px`;
      container.style.height = `${window.visualViewport.height}px`;
    } else {
      container.style.top = '0';
      container.style.height = '100vh';
    }
    
    // Scroll active chat messages to bottom
    const activeMsgArea = container.querySelector('.chat-messages-area');
    if (activeMsgArea) {
      activeMsgArea.scrollTop = activeMsgArea.scrollHeight;
    }
  } else {
    container.style.height = '';
    container.style.top = '';
  }
}

function handleChatKeyPress(e, username) {
  if (e.key === 'Enter') {
    const input = e.target;
    const text = input.value.trim();
    if (!text) return;
    
    sendChatMessage(username, text);
    input.value = '';
  }
}

function sendPlantSticker(username) {
  sendChatMessage(username, "🌵 (Sent a plant sticker!)");
}

function insertSampleEmoji(username) {
  const input = document.querySelector(`.chat-window[data-username="${username}"] .chat-input-field`);
  if (input) {
    input.value += " 👍";
    input.focus();
  }
}
