filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\components\messaging.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target_start = "        const isMe = msg.sender === State.currentUser.name;"
target_end = """        messagesHtml += `
          <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
            ${!isMe ? `<img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="chat-msg-avatar" onclick="viewUserProfile('${contact.name}')" style="cursor:pointer;">` : ''}
            <div class="chat-msg-bubble-wrap">
              <div class="chat-msg-bubble" style="cursor:pointer;" onclick="toggleHeartReaction('${username}', '${msg.id}')" title="Click to react with Heart">
                ${msg.text}
              </div>
              ${msg.reaction ? `<div class="chat-bubble-reaction" onclick="toggleHeartReaction('${username}', '${msg.id}')">❤️</div>` : ''}
            </div>
          </div>
        `;"""

start_idx = content.find(target_start)
end_idx = content.find(target_end)

if start_idx == -1 or end_idx == -1:
    print("Error: messaging rendering boundaries not found in components/messaging.js")
    exit(1)

end_idx += len(target_end)

replacement = """        const isMe = msg.sender === State.currentUser.name || msg.sender === 'me';
        
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
          <div class="chat-msg-status-area" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; float: right; font-size: 9px; opacity: 0.65; vertical-align: bottom; justify-content: flex-end; clear: both; width: 100%;">
            <span style="font-size: 8px;">${msg.time || ''}</span>
            <span class="chat-msg-ticks" id="ticks-${msg.id}">
              <i data-lucide="${tickIcon}" style="width: 11px; height: 11px; color: ${tickColor}; display: inline-block;"></i>
            </span>
          </div>
        ` : '';

        messagesHtml += `
          <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
            ${!isMe ? `<img src="${getAvatarSrc(contact.avatar)}" alt="${contact.name}" class="chat-msg-avatar" onclick="viewUserProfile('${contact.name}')" style="cursor:pointer;">` : ''}
            <div class="chat-msg-bubble-wrap" style="display: flex; flex-direction: column; max-width: 75%;">
              <div class="chat-msg-bubble" style="cursor:pointer; display: flow-root; padding: 8px 12px; width: fit-content; max-width: 100%; word-break: break-word;" onclick="toggleHeartReaction('${username}', '${msg.id}')" title="Click to react with Heart">
                <div style="float: left;">${msg.text}</div>
                ${statusMarkup}
              </div>
              ${msg.reaction ? `<div class="chat-bubble-reaction" onclick="toggleHeartReaction('${username}', '${msg.id}')" style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; margin-top: -8px; z-index: 1;">❤️</div>` : ''}
            </div>
          </div>
        `;"""

content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("components/messaging.js rendering updated successfully!")
