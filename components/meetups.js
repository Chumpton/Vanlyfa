/* ==========================================================================
   VANLYFA COMPONENT: MEETUPS.JS
   ========================================================================== */

function renderMeetupsList() {
  const container = document.getElementById('meetup-list-container');
  container.innerHTML = '';
  
  const query = State.searchQuery;
  const selectedArea = document.getElementById('meetup-filter-area') ? document.getElementById('meetup-filter-area').value : 'all';
  const selectedSaved = document.getElementById('meetup-filter-saved') ? document.getElementById('meetup-filter-saved').value : 'all';

  function meetupMatchesArea(meetup, area) {
    if (area === 'all') return true;
    let targetLat, targetLng;
    if (area === 'near') {
      const loc = getCachedLocation();
      if (loc && loc.status === 'present') {
        targetLat = loc.lat;
        targetLng = loc.lng;
      } else {
        return true;
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

    if (typeof meetup.lat === 'number' && typeof meetup.lng === 'number') {
      const dist = calculateHaversineDistance(meetup.lat, meetup.lng, targetLat, targetLng);
      const maxRadius = area === 'near' ? 150 : 100;
      return dist <= maxRadius;
    }
    
    // text fallback
    if (area !== 'near') {
      const txt = (meetup.location + " " + meetup.title + " " + meetup.description).toLowerCase();
      if (txt.includes(area)) return true;
    }
    return false;
  }

  const filtered = State.meetups.filter(m => {
    const queryMatch = m.title.toLowerCase().includes(query) || 
                       m.description.toLowerCase().includes(query) ||
                       m.location.toLowerCase().includes(query);
                       
    if (!queryMatch) return false;
    
    if (!meetupMatchesArea(m, selectedArea)) return false;
    
    // Saved filter
    if (selectedSaved === 'saved') {
      if (!State.currentUser || !State.currentUser.savedMeetupIds) return false;
      if (!State.currentUser.savedMeetupIds.includes(m.id)) return false;
    }
    
    return true;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:64px; color:var(--muted-text);">No caravan meetups match your search.</div>`;
    return;
  }
  
  filtered.forEach(meetup => {
    // Parse Date for Badge
    const d = new Date(meetup.date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()] || "Nov";
    const day = d.getDate() || "15";
    
    // User RSVP status
    const userAvatar = State.currentUser ? State.currentUser.avatar : 'avatar_bob';
    const hasRsvped = meetup.attendees.includes(userAvatar);
    const isSaved = State.currentUser && State.currentUser.savedMeetupIds && State.currentUser.savedMeetupIds.includes(meetup.id);
    
    const card = document.createElement('div');
    card.className = 'meetup-card';
    card.id = `meetup-card-${meetup.id}`;
    card.innerHTML = `
      <div class="meetup-date-badge">
        <span class="meetup-date-month">${month}</span>
        <span class="meetup-date-day">${day}</span>
      </div>
      <div class="meetup-info" style="flex-grow: 1;">
        <h3 class="meetup-title" style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="calendar" class="meetup-mobile-icon" style="display: none; width: 16px; height: 16px; color: var(--accent-green); flex-shrink: 0;"></i>
          <span>${meetup.title}</span>
          ${meetup.pendingSync ? ' <span class="sync-spinner" title="Syncing with database..."></span>' : ''}
        </h3>
        <div style="display:flex; align-items:center; gap:6px; margin: 4px 0 8px 0;">
          <img src="${getAvatarSrc(meetup.host.avatar)}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;" />
          <span style="font-size:11px; font-weight:600; color:var(--text-charcoal);">${getUserRoleMarkup(meetup.host.name)}</span>
        </div>
        <div class="meetup-meta-items">
          <div class="meetup-meta-item">
            <i data-lucide="map-pin"></i>
            <span>${meetup.location}</span>
          </div>
          <div class="meetup-meta-item">
            <i data-lucide="clock"></i>
            <span>${meetup.time}</span>
          </div>
        </div>
        <p class="meetup-description">${meetup.description}</p>
        
        <!-- Comments Section for Meetup -->
        <div class="meetup-comments-section" style="margin-top: 12px; border-top: 1px dashed var(--border-color); padding-top: 12px; width: 100%;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-charcoal); margin-bottom: 8px;">Comments</div>
          <div class="meetup-comments-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 120px; overflow-y: auto; margin-bottom: 8px;">
            ${(!meetup.comments || meetup.comments.length === 0) ? `
              <div style="font-size: 10px; color: var(--muted-text); font-style: italic;">No comments yet.</div>
            ` : meetup.comments.map(c => `
              <div style="display: flex; gap: 8px; align-items: flex-start; background: var(--bg-sand); padding: 6px; border-radius: var(--radius-sm);">
                <img src="${getAvatarSrc(c.avatar)}" style="width: 16px; height: 16px; border-radius: 50%; object-fit: cover;" />
                <div style="display: flex; flex-direction: column; gap: 1px; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600;">
                    <span>${getUserRoleMarkup(c.author)}</span>
                    <span style="font-size: 8px; color: var(--muted-text);">${c.time}</span>
                  </div>
                  <div style="font-size: 10px; color: var(--text-main); line-height: 1.3;">${c.text}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <form onsubmit="saveMeetupComment(event, '${meetup.id}')" style="display: flex; gap: 6px; margin-top: 6px;">
            <input type="text" id="meetup-comment-input-${meetup.id}" placeholder="Ask a question or comment..." required style="flex-grow: 1; font-size: 11px; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px; background: var(--bg-card); color: var(--text-main); outline: none;" />
            <button type="submit" class="btn btn-sm btn-primary" style="padding: 2px 8px; font-size: 10px; height: auto;">Comment</button>
          </form>
        </div>
      </div>
      <div class="meetup-actions" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px; width: 100%; flex-wrap: wrap; gap: 8px;">
        <div class="meetup-attendees" style="display: flex; align-items: center;">
          ${meetup.attendees.slice(0, 4).map(a => `<img src="${getAvatarSrc(a)}" alt="Attendee" class="attendee-img">`).join('')}
          ${meetup.attendees.length > 4 ? `<div class="attendee-img" style="background:#6E6A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">+${meetup.attendees.length - 4}</div>` : ''}
          <span class="attendee-count">${meetup.attendeesCount} RSVP'd</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="btn btn-sm" onclick="shareMeetup('${meetup.id}')" title="Share Meetup" style="padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center;">
            <i data-lucide="share-2" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="btn btn-sm ${isSaved ? 'saved' : ''}" onclick="toggleMeetupSave('${meetup.id}')" title="Save Meetup" style="padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center; color: ${isSaved ? 'var(--accent-green)' : 'inherit'};">
            <i data-lucide="bookmark" style="width: 14px; height: 14px; fill: ${isSaved ? 'var(--accent-green)' : 'none'};"></i>
          </button>
          ${meetup.host.name !== State.currentUser.name ? `
            <button class="btn btn-sm" onclick="contactHost('${meetup.host.name}', 'Caravan Meetup: ${meetup.title}')" style="padding: 6px 10px; display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
              <span>Host</span>
            </button>
          ` : ''}
          <button class="btn btn-sm ${hasRsvped ? '' : 'btn-primary'}" onclick="toggleMeetupRsvp('${meetup.id}')">
            ${hasRsvped ? 'Going' : 'RSVP'}
          </button>
        </div>
      </div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('form') || e.target.closest('input') || e.target.closest('.attendee-img')) {
        return;
      }
      openMeetupDetailModal(meetup.id);
    });
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

function saveMeetupComment(event, meetupId) {
  event.preventDefault();
  if (!requireAuth()) return;
  if (!checkRateLimit('comment')) {
    showToast("Rate limit exceeded. You can only comment 10 times per hour.", "error");
    return;
  }
  const input = document.getElementById(`meetup-comment-input-${meetupId}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  
  const meetup = State.meetups.find(m => m.id === meetupId);
  if (meetup) {
    if (!meetup.comments) meetup.comments = [];
    meetup.comments.push({
      id: `comment-${Date.now()}`,
      author: State.currentUser.name,
      avatar: State.currentUser.avatar || 'avatar_bob',
      text: text,
      time: "Just now"
    });
    input.value = '';
    saveStateToStorage();
    renderMeetupsList();
    showToast("Comment posted!");
  }
}

function shareMeetup(meetupId) {
  const url = `${window.location.origin}${window.location.pathname}?meetup=${meetupId}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Meetup sharing link copied to clipboard!", "success");
  }).catch(() => {
    showToast("Failed to copy link.", "error");
  });
}

function openMeetupDetailModal(meetupId) {
  const meetup = State.meetups.find(m => m.id === meetupId);
  if (!meetup) return;

  const titleEl = document.getElementById('meetup-view-title');
  const dateBadgeEl = document.getElementById('meetup-view-date-badge');
  const hostAvatarEl = document.getElementById('meetup-view-host-avatar');
  const hostNameEl = document.getElementById('meetup-view-host-name');
  const locationEl = document.getElementById('meetup-view-location');
  const timeEl = document.getElementById('meetup-view-time');
  const descEl = document.getElementById('meetup-view-description');
  const heroEl = document.getElementById('meetup-view-hero');
  const attendeesFacesEl = document.getElementById('meetup-view-attendee-faces');
  const attendeeCountEl = document.getElementById('meetup-view-attendee-count');
  const rsvpBtn = document.getElementById('meetup-view-rsvp-btn');
  const commentsListEl = document.getElementById('meetup-view-comments-list');
  const commentForm = document.getElementById('meetup-view-comment-form');

  if (titleEl) titleEl.innerText = meetup.title;
  if (dateBadgeEl) dateBadgeEl.innerText = meetup.date;
  if (hostAvatarEl) hostAvatarEl.src = getAvatarSrc(meetup.host.avatar);
  if (hostNameEl) hostNameEl.innerText = meetup.host.name;
  if (locationEl) locationEl.innerText = meetup.location;
  if (timeEl) timeEl.innerText = meetup.time;
  if (descEl) descEl.innerText = meetup.description;
  
  if (heroEl) {
    if (meetup.thumbnail && meetup.thumbnail !== 'none') {
      heroEl.style.backgroundImage = `url(${meetup.thumbnail})`;
    } else {
      heroEl.style.backgroundImage = 'linear-gradient(135deg, var(--accent-green-light), var(--bg-sand))';
    }
  }

  // Populate attendees
  if (attendeesFacesEl) {
    attendeesFacesEl.innerHTML = (meetup.attendees || []).slice(0, 5).map(a => 
      `<img src="${getAvatarSrc(a)}" alt="Attendee" class="attendee-img" style="width:24px; height:24px; border-radius:50%; margin-right:-6px; border:2px solid var(--card-bg); object-fit:cover;">`
    ).join('');
  }
  if (attendeeCountEl) {
    attendeeCountEl.innerText = `${meetup.attendees ? meetup.attendees.length : 0} RSVP'd`;
  }

  // RSVP Button state
  if (rsvpBtn) {
    const userAvatar = State.currentUser ? State.currentUser.avatar : 'avatar_bob';
    const hasRsvped = meetup.attendees && meetup.attendees.includes(userAvatar);
    rsvpBtn.innerText = hasRsvped ? 'Going' : 'RSVP';
    rsvpBtn.className = hasRsvped ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary';
    rsvpBtn.onclick = () => {
      toggleMeetupRsvp(meetup.id);
      openMeetupDetailModal(meetup.id); // refresh modal details
      renderMeetupsList(); // sync list view
    };
  }

  // Render comments
  if (commentsListEl) {
    commentsListEl.innerHTML = '';
    if (!meetup.comments || meetup.comments.length === 0) {
      commentsListEl.innerHTML = `<div style="font-size: 11px; color: var(--muted-text); font-style: italic; text-align: center; padding: 12px;">No comments yet. Be the first to say something!</div>`;
    } else {
      meetup.comments.forEach(c => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '8px';
        div.style.alignItems = 'flex-start';
        div.style.background = 'var(--bg-sand)';
        div.style.padding = '8px';
        div.style.borderRadius = 'var(--radius-sm)';
        div.innerHTML = `
          <img src="${getAvatarSrc(c.avatar)}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />
          <div style="display: flex; flex-direction: column; gap: 2px; width: 100%;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600;">
              <span>${getUserRoleMarkup(c.author)}</span>
              <span style="font-size: 9px; color: var(--muted-text); font-weight: normal;">${c.time}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-main); line-height: 1.4; text-align: left;">${c.text}</div>
          </div>
        `;
        commentsListEl.appendChild(div);
      });
    }
  }

  // Comment submission inside modal
  if (commentForm) {
    commentForm.onsubmit = (e) => {
      e.preventDefault();
      if (!requireAuth()) return;
      const input = document.getElementById('meetup-view-comment-input');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      if (!meetup.comments) meetup.comments = [];
      meetup.comments.push({
        id: `comment-${Date.now()}`,
        author: State.currentUser.name,
        avatar: State.currentUser.avatar || 'avatar_bob',
        text: text,
        time: "Just now"
      });
      input.value = '';
      saveStateToStorage();
      openMeetupDetailModal(meetup.id); // refresh modal details
      renderMeetupsList(); // sync list view
      showToast("Comment posted!");
    };
  }

  openModal('modal-view-meetup');
}
