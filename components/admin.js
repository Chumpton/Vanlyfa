/* ==========================================================================
   VANLYFA COMPONENT: ADMIN.JS (Moderation & Content Approvals)
   ========================================================================== */

function renderAdminPanel() {
  const list = document.getElementById('admin-pending-list');
  if (!list) return;
  
  list.innerHTML = '';
  
  const filterType = document.getElementById('admin-filter-type') ? document.getElementById('admin-filter-type').value : 'all';
  
  let pendingItems = [];
  
  // 1. Gather all pending items
  if (State.posts && (filterType === 'all' || filterType === 'post')) {
    State.posts.forEach(p => {
      if (p.status === 'pending') {
        pendingItems.push({
          type: 'post',
          id: p.id,
          rawId: p.id,
          author: p.author ? p.author.name : 'Unknown',
          details: p.content,
          time: p.time || 'N/A'
        });
      }
    });
  }
  
  if (State.marketplace && (filterType === 'all' || filterType === 'marketplace')) {
    State.marketplace.forEach(m => {
      if (m.status === 'pending') {
        pendingItems.push({
          type: 'marketplace',
          id: `market-${m.id}`,
          rawId: m.id,
          author: m.seller ? m.seller.name : 'Unknown',
          details: `Listing: "${m.title}" - $${m.price}. ${m.description || ''}`,
          time: 'N/A'
        });
      }
    });
  }
  
  if (State.spots && (filterType === 'all' || filterType === 'spot')) {
    State.spots.forEach(s => {
      if (s.status === 'pending') {
        pendingItems.push({
          type: 'spot',
          id: `spot-${s.id}`,
          rawId: s.id,
          author: s.author ? s.author.name : 'Unknown',
          details: `Spot: "${s.title}" (${s.category}) at [${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}]. ${s.description || ''}`,
          time: 'N/A'
        });
      }
    });
  }
  
  if (State.meetups && (filterType === 'all' || filterType === 'meetup')) {
    State.meetups.forEach(mt => {
      if (mt.status === 'pending') {
        pendingItems.push({
          type: 'meetup',
          id: `meetup-${mt.id}`,
          rawId: mt.id,
          author: mt.host ? mt.host.name : 'Unknown',
          details: `Meetup: "${mt.title}" at ${mt.location} on ${mt.date} at ${mt.time}. ${mt.description || ''}`,
          time: 'N/A'
        });
      }
    });
  }

  if (State.feedbacks && (filterType === 'all' || filterType === 'feedback')) {
    State.feedbacks.forEach(fb => {
      if (fb.status === 'pending') {
        pendingItems.push({
          type: 'feedback',
          id: `feedback-${fb.id}`,
          rawId: fb.id,
          author: fb.user || 'Anonymous',
          details: fb.content,
          time: fb.time || 'N/A'
        });
      }
    });
  }
  
  if (pendingItems.length === 0) {
    list.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--muted-text); font-style:italic;">No pending items for review.</td></tr>`;
    return;
  }
  
  pendingItems.forEach(item => {
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
    
    const approveText = item.type === 'feedback' ? 'Mark Read' : 'Approve';
    const rejectText = item.type === 'feedback' ? 'Dismiss' : 'Reject';
    
    row.innerHTML = `
      <td style="padding: 12px 16px; font-weight: 700; color: ${typeColor};">${typeLabel}</td>
      <td style="padding: 12px 16px; font-weight: 600; color: var(--text-charcoal);">${item.author}</td>
      <td style="padding: 12px 16px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.details}</td>
      <td style="padding: 12px 16px; color: var(--muted-text);">${item.time}</td>
      <td style="padding: 12px 16px; text-align: right; display: flex; gap: 6px; justify-content: flex-end;">
        <button class="btn btn-sm" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15); cursor: pointer;" onclick="approveItem('${item.type}', '${item.rawId}')">${approveText}</button>
        <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.15); cursor: pointer;" onclick="rejectItem('${item.type}', '${item.rawId}')">${rejectText}</button>
      </td>
    `;
    list.appendChild(row);
  });
}

function approveItem(type, rawId) {
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
    saveStateToStorage();
    if (type !== 'feedback') {
      State._cachedFeeds = {}; // Clear feed cache
    }
    renderAdminPanel();
    
    // Refresh all views
    if (type !== 'feedback') {
      renderDashboardFeed();
      renderFeedTabPosts();
      renderMarketplaceListings();
      renderMeetupsList();
      if (State.leafletMap) {
        renderLeafletMarkers();
      }
    }
    
    showToast(type === 'feedback' ? "Feedback marked as read." : `Approved ${type} successfully.`, "success");
  }
}

function rejectItem(type, rawId) {
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
    const confirmMsg = type === 'feedback' 
      ? `Are you sure you want to dismiss this feedback?`
      : `Are you sure you want to reject and hide this ${type}?`;
    if (confirm(confirmMsg)) {
      item.status = type === 'feedback' ? 'dismissed' : 'rejected';
      saveStateToStorage();
      if (type !== 'feedback') {
        State._cachedFeeds = {}; // Clear feed cache
      }
      renderAdminPanel();
      
      // Refresh views
      if (type !== 'feedback') {
        renderDashboardFeed();
        renderFeedTabPosts();
        renderMarketplaceListings();
        renderMeetupsList();
        if (State.leafletMap) {
          renderLeafletMarkers();
        }
      }
      
      showToast(type === 'feedback' ? "Feedback dismissed." : `Rejected ${type} successfully.`, "info");
    }
  }
}
