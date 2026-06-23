/* ==========================================================================
   VANLYFA COMPONENT: ADMIN.JS (Moderation & Content Approvals)
   ========================================================================== */

function renderAdminPanel() {
  const list = document.getElementById('admin-pending-list');
  if (!list) return;
  
  list.innerHTML = '';
  
  const statusFilter = document.getElementById('admin-filter-status') ? document.getElementById('admin-filter-status').value : 'pending';
  const filterType = document.getElementById('admin-filter-type') ? document.getElementById('admin-filter-type').value : 'all';
  
  // Update table headers based on statusFilter
  const thead = list.closest('table').querySelector('thead');
  if (thead) {
    if (statusFilter === 'users') {
      thead.innerHTML = `
        <tr style="background: var(--bg-sand); border-bottom: 1px solid var(--border-color); color: var(--text-charcoal); font-weight: 700;">
          <th style="padding: 12px 16px;">User</th>
          <th style="padding: 12px 16px;">Handle</th>
          <th style="padding: 12px 16px;">Reputation</th>
          <th style="padding: 12px 16px;">Status</th>
          <th style="padding: 12px 16px; text-align: right;">Actions</th>
        </tr>
      `;
    } else if (statusFilter === 'flagged') {
      thead.innerHTML = `
        <tr style="background: var(--bg-sand); border-bottom: 1px solid var(--border-color); color: var(--text-charcoal); font-weight: 700;">
          <th style="padding: 12px 16px;">Type</th>
          <th style="padding: 12px 16px;">Author / Seller</th>
          <th style="padding: 12px 16px;">Content Details</th>
          <th style="padding: 12px 16px;">Flags</th>
          <th style="padding: 12px 16px; text-align: right;">Actions</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr style="background: var(--bg-sand); border-bottom: 1px solid var(--border-color); color: var(--text-charcoal); font-weight: 700;">
          <th style="padding: 12px 16px;">Type</th>
          <th style="padding: 12px 16px;">Author / Seller</th>
          <th style="padding: 12px 16px;">Content Details</th>
          <th style="padding: 12px 16px;">Submitted</th>
          <th style="padding: 12px 16px; text-align: right;">Actions</th>
        </tr>
      `;
    }
  }

  if (statusFilter === 'users') {
    // Render user list
    const users = State.users || [];
    if (users.length === 0) {
      list.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--muted-text); font-style:italic;">No user accounts found.</td></tr>`;
      return;
    }
    
    users.forEach(u => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid var(--border-color)';
      row.style.color = 'var(--text-main)';
      
      const isBanned = u.banned === true;
      const isPremium = u.isPremium === true;
      const statusText = isBanned ? '<span style="color:#ef4444; font-weight:700;">Banned</span>' : 
                         (isPremium ? '<span style="color:#10b981; font-weight:700;">Premium (Verified)</span>' : '<span style="color:var(--muted-text);">Active</span>');
      
      const banBtnText = isBanned ? 'Unban' : 'Ban';
      const banBtnStyle = isBanned ? 
        'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15);' :
        'background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.15);';
        
      const premiumBtnText = isPremium ? 'Revoke Premium' : 'Grant Premium';
      const premiumBtnStyle = isPremium ?
        'background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.15);' :
        'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15);';
      
      row.innerHTML = `
        <td style="padding: 12px 16px; font-weight: 700; display:flex; align-items:center; gap:8px;">
          <img src="${getAvatarSrc(u.avatar)}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
          <span>${u.name}</span>
        </td>
        <td style="padding: 12px 16px; color: var(--text-charcoal); font-weight: 500;">${u.handle || `@${u.name.toLowerCase().replace(/\s+/g, '_')}`}</td>
        <td style="padding: 12px 16px; font-weight: 600;">★${u.reputation || 0}</td>
        <td style="padding: 12px 16px;">${statusText}</td>
        <td style="padding: 12px 16px; text-align: right; display: flex; gap: 6px; justify-content: flex-end;">
          <button class="btn btn-sm" style="${premiumBtnStyle} cursor: pointer;" onclick="window.adminTogglePremiumUser('${u.name}')">${premiumBtnText}</button>
          ${u.name !== State.currentUser.name ? `<button class="btn btn-sm" style="${banBtnStyle} cursor: pointer;" onclick="window.adminToggleBanUser('${u.name}')">${banBtnText}</button>` : ''}
        </td>
      `;
      list.appendChild(row);
    });
    return;
  }

  let items = [];
  
  if (statusFilter === 'pending') {
    // Gather pending approvals
    if (State.posts && (filterType === 'all' || filterType === 'post')) {
      State.posts.forEach(p => {
        if (p.status === 'pending') {
          items.push({
            type: 'post',
            id: p.id,
            rawId: p.id,
            author: p.author ? p.author.name : 'Unknown',
            details: p.content,
            time: p.time || 'N/A',
            flags: 0
          });
        }
      });
    }
    if (State.marketplace && (filterType === 'all' || filterType === 'marketplace')) {
      State.marketplace.forEach(m => {
        if (m.status === 'pending') {
          items.push({
            type: 'marketplace',
            id: `market-${m.id}`,
            rawId: m.id,
            author: m.seller ? m.seller.name : 'Unknown',
            details: `Listing: "${m.title}" - $${m.price}. ${m.description || ''}`,
            time: 'N/A',
            flags: 0
          });
        }
      });
    }
    if (State.spots && (filterType === 'all' || filterType === 'spot')) {
      State.spots.forEach(s => {
        if (s.status === 'pending') {
          items.push({
            type: 'spot',
            id: `spot-${s.id}`,
            rawId: s.id,
            author: s.author ? s.author.name : 'Unknown',
            details: `Spot: "${s.title}" (${s.category}) at [${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}]. ${s.description || ''}`,
            time: 'N/A',
            flags: 0
          });
        }
      });
    }
    if (State.meetups && (filterType === 'all' || filterType === 'meetup')) {
      State.meetups.forEach(mt => {
        if (mt.status === 'pending') {
          items.push({
            type: 'meetup',
            id: `meetup-${mt.id}`,
            rawId: mt.id,
            author: mt.host ? mt.host.name : 'Unknown',
            details: `Meetup: "${mt.title}" at ${mt.location} on ${mt.date} at ${mt.time}. ${mt.description || ''}`,
            time: 'N/A',
            flags: 0
          });
        }
      });
    }
    if (State.feedbacks && (filterType === 'all' || filterType === 'feedback')) {
      State.feedbacks.forEach(fb => {
        if (fb.status === 'pending') {
          items.push({
            type: 'feedback',
            id: `feedback-${fb.id}`,
            rawId: fb.id,
            author: fb.user || 'Anonymous',
            details: fb.content,
            time: fb.time || 'N/A',
            flags: 0
          });
        }
      });
    }
  } else if (statusFilter === 'flagged') {
    // Gather flagged content
    if (State.posts && (filterType === 'all' || filterType === 'post')) {
      State.posts.forEach(p => {
        if ((p.flags && p.flags > 0) || p.status === 'rejected') {
          items.push({
            type: 'post',
            id: p.id,
            rawId: p.id,
            author: p.author ? p.author.name : 'Unknown',
            details: p.content,
            time: p.time || 'N/A',
            flags: p.flags || 0,
            status: p.status
          });
        }
      });
    }
    if (State.marketplace && (filterType === 'all' || filterType === 'marketplace')) {
      State.marketplace.forEach(m => {
        if ((m.flags && m.flags > 0) || m.status === 'hidden_flagged') {
          items.push({
            type: 'marketplace',
            id: `market-${m.id}`,
            rawId: m.id,
            author: m.seller ? m.seller.name : 'Unknown',
            details: `Listing: "${m.title}" - $${m.price}. ${m.description || ''}`,
            time: 'N/A',
            flags: m.flags || 0,
            status: m.status
          });
        }
      });
    }
    if (State.spots && (filterType === 'all' || filterType === 'spot')) {
      State.spots.forEach(s => {
        if ((s.flags && s.flags > 0) || s.status === 'hidden_flagged') {
          items.push({
            type: 'spot',
            id: `spot-${s.id}`,
            rawId: s.id,
            author: s.author ? s.author.name : 'Unknown',
            details: `Spot: "${s.title}" (${s.category}) at [${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}]. ${s.description || ''}`,
            time: 'N/A',
            flags: s.flags || 0,
            status: s.status
          });
        }
      });
    }
  }

  if (items.length === 0) {
    list.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--muted-text); font-style:italic;">No items found.</td></tr>`;
    return;
  }

  items.forEach(item => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--border-color)';
    row.style.color = 'var(--text-main)';
    
    let typeLabel = '';
    let typeColor = '';
    if (item.type === 'post') {
      typeLabel = 'Feed Post';
      typeColor = '#3b82f6';
    } else if (item.type === 'marketplace') {
      typeLabel = 'Marketplace';
      typeColor = '#a855f7';
    } else if (item.type === 'spot') {
      typeLabel = 'Map Pin';
      typeColor = 'var(--accent-green)';
    } else if (item.type === 'meetup') {
      typeLabel = 'Meetup';
      typeColor = '#ef4444';
    } else if (item.type === 'feedback') {
      typeLabel = 'User Feedback';
      typeColor = '#eab308';
    }
    
    let fourthColVal = item.time;
    let actionsHtml = '';
    
    if (statusFilter === 'pending') {
      const approveText = item.type === 'feedback' ? 'Mark Read' : 'Approve';
      const rejectText = item.type === 'feedback' ? 'Dismiss' : 'Reject';
      actionsHtml = `
        <button class="btn btn-sm" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15); cursor: pointer;" onclick="window.adminApproveItem('${item.type}', '${item.rawId}')">${approveText}</button>
        <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.15); cursor: pointer;" onclick="window.adminRejectItem('${item.type}', '${item.rawId}')">${rejectText}</button>
      `;
    } else if (statusFilter === 'flagged') {
      fourthColVal = `<strong style="color:#ef4444;">${item.flags} Flags</strong>${item.status === 'rejected' || item.status === 'hidden_flagged' ? ' <span style="font-size:10px;color:#ef4444;background:rgba(239,68,68,0.1);padding:2px 4px;border-radius:4px;">HIDDEN</span>' : ''}`;
      actionsHtml = `
        <button class="btn btn-sm" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15); cursor: pointer;" onclick="window.adminKeepItem('${item.type}', '${item.rawId}')">Keep / Approve</button>
        <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.15); cursor: pointer;" onclick="window.adminDeleteItem('${item.type}', '${item.rawId}')">Delete Content</button>
      `;
    }
    
    row.innerHTML = `
      <td style="padding: 12px 16px; font-weight: 700; color: ${typeColor};">${typeLabel}</td>
      <td style="padding: 12px 16px; font-weight: 600; color: var(--text-charcoal);">${item.author}</td>
      <td style="padding: 12px 16px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.details}</td>
      <td style="padding: 12px 16px; color: var(--text-main); font-weight: 500;">${fourthColVal}</td>
      <td style="padding: 12px 16px; text-align: right; display: flex; gap: 6px; justify-content: flex-end;">
        ${actionsHtml}
      </td>
    `;
    list.appendChild(row);
  });
}

// Bind handlers
window.adminApproveItem = function(type, rawId) {
  let item = null;
  if (type === 'post') {
    item = State.posts.find(p => String(p.id) === String(rawId));
  } else if (type === 'marketplace') {
    item = State.marketplace.find(m => String(m.id) === String(rawId));
  } else if (type === 'spot') {
    item = State.spots.find(s => String(s.id) === String(rawId));
  } else if (type === 'meetup') {
    item = State.meetups.find(mt => String(mt.id) === String(rawId));
  } else if (type === 'feedback') {
    item = State.feedbacks.find(fb => String(fb.id) === String(rawId));
  }
  
  if (item) {
    item.status = type === 'feedback' ? 'read' : 'approved';
    item.flags = 0;
    item.flaggedBy = [];
    saveStateToStorage();
    State._cachedFeeds = {};
    renderAdminPanel();
    
    // Refresh views
    renderDashboardFeed();
    renderFeedTabPosts();
    renderMarketplaceListings();
    renderMeetupsList();
    if (State.leafletMap) {
      renderLeafletMarkers();
    }
    
    showToast(`Approved ${type} successfully.`, "success");
  }
};

window.adminRejectItem = function(type, rawId) {
  let item = null;
  if (type === 'post') {
    item = State.posts.find(p => String(p.id) === String(rawId));
  } else if (type === 'marketplace') {
    item = State.marketplace.find(m => String(m.id) === String(rawId));
  } else if (type === 'spot') {
    item = State.spots.find(s => String(s.id) === String(rawId));
  } else if (type === 'meetup') {
    item = State.meetups.find(mt => String(mt.id) === String(rawId));
  } else if (type === 'feedback') {
    item = State.feedbacks.find(fb => String(fb.id) === String(rawId));
  }
  
  if (item) {
    if (confirm(`Reject and hide this ${type}?`)) {
      item.status = type === 'feedback' ? 'dismissed' : 'rejected';
      saveStateToStorage();
      State._cachedFeeds = {};
      renderAdminPanel();
      
      // Refresh views
      renderDashboardFeed();
      renderFeedTabPosts();
      renderMarketplaceListings();
      renderMeetupsList();
      if (State.leafletMap) {
        renderLeafletMarkers();
      }
      
      showToast(`Rejected ${type}.`, "info");
    }
  }
};

window.adminKeepItem = function(type, rawId) {
  window.adminApproveItem(type, rawId);
};

window.adminDeleteItem = function(type, rawId) {
  if (confirm(`Permanently delete this ${type}? This action cannot be undone.`)) {
    if (type === 'post') {
      State.posts = State.posts.filter(p => String(p.id) !== String(rawId));
    } else if (type === 'marketplace') {
      State.marketplace = State.marketplace.filter(m => String(m.id) !== String(rawId));
    } else if (type === 'spot') {
      State.spots = State.spots.filter(s => String(s.id) !== String(rawId));
    } else if (type === 'meetup') {
      State.meetups = State.meetups.filter(mt => String(mt.id) !== String(rawId));
    }
    
    saveStateToStorage();
    State._cachedFeeds = {};
    renderAdminPanel();
    
    // Refresh views
    renderDashboardFeed();
    renderFeedTabPosts();
    renderMarketplaceListings();
    renderMeetupsList();
    if (State.leafletMap) {
      renderLeafletMarkers();
    }
    
    showToast(`Permanently deleted ${type}.`, "success");
  }
};

window.adminToggleBanUser = function(username) {
  const user = State.users.find(u => u.name === username);
  if (user) {
    const isBanned = user.banned === true;
    if (confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} user "${username}"?`)) {
      user.banned = !isBanned;
      
      if (user.banned) {
        showToast(`User "${username}" has been banned.`, "warning");
        // Log out immediately if the banned user is the current user
        if (State.currentUser && State.currentUser.name === username) {
          State.isSignedIn = false;
          saveStateToStorage();
          updateSidebarProfileWidget();
          switchTab('dashboard');
        }
      } else {
        showToast(`User "${username}" has been unbanned.`, "success");
      }
      
      saveStateToStorage();
      renderAdminPanel();
    }
  }
};

window.adminTogglePremiumUser = function(username) {
  const user = State.users.find(u => u.name === username);
  if (user) {
    const isPremium = user.isPremium === true;
    user.isPremium = !isPremium;
    saveStateToStorage();
    renderAdminPanel();
    showToast(`Premium status for "${username}" set to ${user.isPremium}.`, "success");
  }
};
