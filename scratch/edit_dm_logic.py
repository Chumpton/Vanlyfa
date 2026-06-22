filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\logic.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target_start = "function sendChatMessage(username, text) {"
target_end = """  setTimeout(() => {
    triggerMockReply(username, text);
  }, 1500);
}"""

start_idx = content.find(target_start)
end_idx = content.find(target_end)

if start_idx == -1 or end_idx == -1:
    print("Error: sendChatMessage boundaries not found in logic.js")
    exit(1)

end_idx += len(target_end)

replacement = """function updateMessageTickUI(msgId, status) {
  const ticksEl = document.getElementById(`ticks-${msgId}`);
  if (ticksEl) {
    if (status === 'read') {
      ticksEl.innerHTML = `<i data-lucide="check-check" style="width: 11px; height: 11px; color: var(--accent-green); display: inline-block;"></i>`;
    } else if (status === 'delivered') {
      ticksEl.innerHTML = `<i data-lucide="check-check" style="width: 11px; height: 11px; color: var(--muted-text); display: inline-block;"></i>`;
    } else {
      ticksEl.innerHTML = `<i data-lucide="check" style="width: 11px; height: 11px; color: var(--muted-text); display: inline-block;"></i>`;
    }
    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function sendChatMessage(username, text) {
  if (!requireAuth()) return;
  if (!State.chats[username]) State.chats[username] = [];
  
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgId = `msg-${Date.now()}`;
  
  const newMsg = {
    id: msgId,
    sender: State.currentUser.name,
    text: text,
    time: timeString,
    reaction: false,
    status: 'sent'
  };
  
  State.chats[username].push(newMsg);
  saveStateToStorage();
  renderActiveChats();
  renderContactsSidebar();
  
  // Transition sent -> delivered after 1.2s
  setTimeout(() => {
    const chat = State.chats[username];
    if (chat) {
      const msg = chat.find(m => m.id === msgId);
      if (msg && msg.status === 'sent') {
        msg.status = 'delivered';
        saveStateToStorage();
        updateMessageTickUI(msgId, 'delivered');
      }
    }
  }, 1200);
  
  // Transition delivered -> read after 2.8s
  setTimeout(() => {
    const chat = State.chats[username];
    if (chat) {
      const msg = chat.find(m => m.id === msgId);
      if (msg && msg.status === 'delivered') {
        msg.status = 'read';
        saveStateToStorage();
        updateMessageTickUI(msgId, 'read');
      }
    }
  }, 2800);

  setTimeout(() => {
    triggerMockReply(username, text);
  }, 3500);
}"""

# Update triggerMockReply as well to mark outgoing messages as read on reply
content = content[:start_idx] + replacement + content[end_idx:]

# Find triggerMockReply to edit
reply_target = """  if (!State.chats[username]) State.chats[username] = [];
  State.chats[username].push(replyMsg);
  saveStateToStorage();"""

reply_replacement = """  if (!State.chats[username]) State.chats[username] = [];
  State.chats[username].push(replyMsg);
  
  // Mark outgoing messages as read when receiving reply
  State.chats[username].forEach(m => {
    if (m.sender === 'me' || m.sender === State.currentUser.name) {
      m.status = 'read';
    }
  });
  
  saveStateToStorage();"""

if reply_target in content:
    content = content.replace(reply_target, reply_replacement, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("logic.js DM ticks functionality updated successfully!")
