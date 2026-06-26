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
          <div class="chat-msg-status-area" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; font-size: 9px; opacity: 0.65; align-self: flex-end;">
            <span style="font-size: 8px;">${msg.time || ''}</span>
            <span class="chat-msg-ticks" id="ticks-${msg.id}">
              <i data-lucide="${tickIcon}" style="width: 11px; height: 11px; color: ${tickColor}; display: inline-block;"></i>
            </span>
          </div>
        ` : '';

        let contentHtml = msg.text;
        if (msg.isImage || msg.text.startsWith('data:image') || msg.text.startsWith('http://') || msg.text.startsWith('https://')) {
          const src = msg.text;
          contentHtml = `<img src="${src}" style="max-width: 200px; max-height: 150px; border-radius: var(--radius-sm); object-fit: cover; cursor: pointer; display: block; margin: 2px 0;" onclick="window.expandChatImage('${src}')">`;
        }

        messagesHtml += `
          <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
            ${!isMe ? `<img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="chat-msg-avatar" onclick="viewUserProfile('${contact.name}')" style="cursor:pointer;">` : ''}
            <div class="chat-msg-bubble-wrap" style="display: flex; flex-direction: column; max-width: 75%; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
              <div class="chat-msg-bubble-container" style="position: relative; width: fit-content; max-width: 100%;">
                <div class="chat-msg-bubble" style="cursor:pointer; padding: 8px 12px; width: fit-content; max-width: 100%; word-wrap: break-word; overflow-wrap: break-word;" onclick="window.toggleReactionTray('${msg.id}', event)">
                  ${contentHtml}
                </div>
                ${msg.reaction ? `<div class="chat-bubble-reaction" onclick="window.toggleReactionTray('${msg.id}', event)" style="position: absolute; bottom: -8px; ${isMe ? 'left: 8px;' : 'right: 8px;'}; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); z-index: 2;">${msg.reaction}</div>` : ''}
                
                <!-- Reaction Tray -->
                <div class="message-reaction-tray" id="reaction-tray-${msg.id}" style="display: none; position: absolute; top: -32px; ${isMe ? 'right: 0;' : 'left: 0;'} background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); padding: 4px 8px; z-index: 10; gap: 8px; align-items: center; justify-content: center;">
                  ${['👍', '❤️', '😂', '🔥', '😮', '✕'].map(emoji => `
                    <span onclick="window.reactToMessage('${username}', '${msg.id}', '${emoji === '✕' ? '' : emoji}', event)" style="cursor: pointer; font-size: 14px; padding: 2px 4px; display: inline-block;">${emoji}</span>
                  `).join('')}
                </div>
              </div>
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
          <!-- Hidden Photo Input -->
          <input type="file" accept="image/*" id="chat-photo-input-${username}" style="display:none;" onchange="window.handleChatPhotoUpload(event, '${username}')">
          <button class="chat-footer-action-btn" title="Photos" onclick="document.getElementById('chat-photo-input-${username}').click()"><i data-lucide="image"></i></button>
          
          <button class="chat-footer-action-btn" title="Stickers" onclick="showToast('Stickers not loaded.', 'info')"><i data-lucide="smile"></i></button>
          
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input-field" placeholder="Aa" onkeypress="handleChatKeyPress(event, '${username}')" onfocus="setTimeout(adjustChatContainerForVisualViewport, 300)" onblur="setTimeout(adjustChatContainerForVisualViewport, 100)">
            <button class="chat-input-emoji-btn" title="Emoji" onclick="window.toggleEmojiPicker('${username}', event)">
              <i data-lucide="smile-plus"></i>
            </button>
            
            <!-- Emoji Picker Dropdown -->
            <div class="emoji-picker-dropdown" id="emoji-picker-${username}" style="display: none; position: absolute; bottom: 42px; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(0,0,0,0.25); padding: 6px; z-index: 100; grid-template-columns: repeat(5, 1fr); gap: 4px; width: max-content;">
              ${['👍', '❤️', '😂', '🔥', '😮', '🚐', '🌲', '⛺', '☀️', '🌊'].map(emoji => `
                <span onclick="window.appendEmojiToChat('${username}', '${emoji}', event)" style="font-size: 16px; cursor: pointer; text-align: center; display: inline-block; padding: 4px; border-radius: 4px;">${emoji}</span>
              `).join('')}
            </div>
          </div>
          
          <button class="chat-footer-action-btn chat-send-btn" title="Like" onclick="window.sendThumbsUp('${username}')"><i data-lucide="thumbs-up"></i></button>
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

// Global Chat Action Helpers

window.sendThumbsUp = function(username) {
  if (typeof sendChatMessage === 'function') {
    sendChatMessage(username, "👍");
  }
};

window.toggleEmojiPicker = function(username, event) {
  if (event) event.stopPropagation();
  const picker = document.getElementById(`emoji-picker-${username}`);
  if (picker) {
    const isVisible = picker.style.display === 'grid';
    // Close other pickers
    document.querySelectorAll('.emoji-picker-dropdown').forEach(p => p.style.display = 'none');
    picker.style.display = isVisible ? 'none' : 'grid';
  }
};

window.appendEmojiToChat = function(username, emoji, event) {
  if (event) event.stopPropagation();
  const input = document.querySelector(`.chat-window[data-username="${username}"] .chat-input-field`);
  if (input) {
    input.value += emoji;
    input.focus();
  }
  const picker = document.getElementById(`emoji-picker-${username}`);
  if (picker) {
    picker.style.display = 'none';
  }
};

window.toggleReactionTray = function(msgId, event) {
  if (event) event.stopPropagation();
  const trays = document.querySelectorAll('.message-reaction-tray');
  trays.forEach(t => {
    if (t.id !== `reaction-tray-${msgId}`) {
      t.style.display = 'none';
    }
  });
  const tray = document.getElementById(`reaction-tray-${msgId}`);
  if (tray) {
    const isVisible = tray.style.display === 'flex';
    tray.style.display = isVisible ? 'none' : 'flex';
  }
};

window.reactToMessage = function(username, msgId, emoji, event) {
  if (event) event.stopPropagation();
  const messages = State.chats[username] || [];
  const msg = messages.find(m => m.id === msgId);
  if (msg) {
    msg.reaction = emoji || null;
    saveStateToStorage();
    renderActiveChats();
  }
};

window.handleChatPhotoUpload = function(event, username) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const messages = State.chats[username] || [];
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: State.currentUser.name,
      text: dataUrl,
      isImage: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reaction: null,
      status: 'sent'
    };
    
    messages.push(newMsg);
    saveStateToStorage();
    renderActiveChats();
    renderContactsSidebar();
    
    setTimeout(() => {
      const replies = [
        "Wow, nice picture!",
        "That looks amazing!",
        "Cool! Is that where you are parked?",
        "Love it!"
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      if (typeof simulateAutoReply === 'function') {
        simulateAutoReply(username, randomReply, 1200);
      }
    }, 1500);
  };
  reader.readAsDataURL(file);
};

window.expandChatImage = function(src) {
  let modal = document.getElementById('modal-chat-image-preview');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-chat-image-preview';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 90%; background: transparent; border: none; box-shadow: none; display: flex; align-items: center; justify-content: center; position: relative;">
        <img id="chat-preview-img" src="" style="max-width: 100%; max-height: 85vh; border-radius: var(--radius-md); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <button onclick="closeModal('modal-chat-image-preview')" style="position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; font-weight: bold; border: 1px solid rgba(255,255,255,0.3);">✕</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('chat-preview-img').src = src;
  openModal('modal-chat-image-preview');
};
