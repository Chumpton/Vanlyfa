/* ==========================================================================
   VANLYFA COMPONENT: MARKETPLACE.JS
   ========================================================================== */

function renderMarketplaceListings() {
  const grid = document.getElementById('marketplace-grid');
  grid.innerHTML = '';
  
  const catFilter = document.getElementById('market-filter-category').value;
  const priceSort = document.getElementById('market-sort-price').value;
  const zipFilter = document.getElementById('market-filter-zip').value.trim();
  const radiusFilter = document.getElementById('market-filter-radius').value;
  const query = State.searchQuery;
  
  let searchCoords = null;
  if (zipFilter) {
    searchCoords = resolveZipCoordinates(zipFilter);
  }
  
  let filtered = State.marketplace.filter(item => {
    const matchesCat = catFilter === 'all' || item.category === catFilter;
    const matchesQuery = item.title.toLowerCase().includes(query) || 
                         item.description.toLowerCase().includes(query) ||
                         item.location.toLowerCase().includes(query);
                         
    // Radius filtering
    if (searchCoords && radiusFilter !== 'any') {
      if (item.lat !== undefined && item.lng !== undefined) {
        const distance = calculateHaversineDistance(searchCoords.lat, searchCoords.lng, item.lat, item.lng);
        item.currentDistance = distance;
        return matchesCat && matchesQuery && distance <= parseFloat(radiusFilter);
      }
      return false;
    } else if (searchCoords) {
      if (item.lat !== undefined && item.lng !== undefined) {
        item.currentDistance = calculateHaversineDistance(searchCoords.lat, searchCoords.lng, item.lat, item.lng);
      } else {
        item.currentDistance = null;
      }
    } else {
      item.currentDistance = null;
    }
    
    return matchesCat && matchesQuery;
  });
  
  // Sort
  if (priceSort === 'low-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (priceSort === 'high-low') {
    filtered.sort((a, b) => b.price - a.price);
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 4; text-align:center; padding:64px; color:var(--muted-text);">No marketplace items match your filters.</div>`;
    return;
  }
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'market-card';
    
    const distanceText = item.currentDistance !== null ? ` • ${Math.round(item.currentDistance)} mi away` : '';
    const zipText = item.zip ? ` (${item.zip})` : '';
    
    const isService = item.category === 'services-offer' || item.category === 'services-want';
    const displayPrice = (isService || item.price === 0) ? 'Trade / Barter' : `$${item.price}`;
    
    const badgeClass = item.category === 'services-offer' ? 'badge-service-offer' : 
                       (item.category === 'services-want' ? 'badge-service-want' : '');
    
    const isOwner = State.isSignedIn && item.seller.name === State.currentUser.name;
    const actionButton = isOwner ? 
      `<button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.15); font-size: 11px; cursor: pointer;" onclick="deleteListing('${item.id}')">Delete</button>` :
      `<button class="btn btn-sm btn-primary" onclick="contactSeller('${item.seller.name}', '${item.title}')">Message</button>`;
      
    card.innerHTML = `
      <div class="market-img-wrapper">
        <img src="${getImageSrc(item.image)}" alt="${item.title}" class="market-img">
        <span class="market-badge ${badgeClass}">${item.condition}</span>
      </div>
      <div class="market-details">
        <h3 class="market-title">${item.title}</h3>
        <div class="market-price">${displayPrice}</div>
        <div class="market-location">
          <i data-lucide="map-pin"></i>
          <span>${item.location}${zipText}${distanceText}</span>
        </div>
        <p style="font-size:12px; color:var(--muted-text); line-height:1.4;">${item.description.substring(0, 80)}...</p>
        <div class="market-footer">
          <div class="market-seller" onclick="viewUserProfile('${item.seller.name}')" style="cursor:pointer;">
            <img src="${getAvatarSrc(item.seller.avatar)}" alt="${item.seller.name}">
            <span>By ${getUserRoleMarkup(item.seller.name)}</span>
          </div>
          ${actionButton}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  lucide.createIcons();
}

function contactSeller(sellerName, itemTitle) {
  if (localStorage.getItem('vanlyfa_marketplace_agreed') !== 'true') {
    State._onMarketplaceSafetyAgreed = () => {
      contactSeller(sellerName, itemTitle);
    };
    openModal('modal-market-safety');
    return;
  }
  openDirectChat(sellerName);
  if (itemTitle) {
    setTimeout(() => {
      const chatKey = sellerName;
      if (State.chats) {
        if (!State.chats[chatKey]) State.chats[chatKey] = [];
        const alreadyAsked = State.chats[chatKey].some(m => m.text.includes(itemTitle));
        if (!alreadyAsked) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            sender: State.currentUser.name,
            text: `Hi ${sellerName}! I'm interested in your listing: "${itemTitle}". Is it still available?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reaction: false
          };
          State.chats[chatKey].push(newMsg);
          saveStateToStorage();
          renderActiveChats();
          renderContactsSidebar();
          
          setTimeout(() => {
            simulateAutoReply(sellerName, `Hi Bob! Yes, it's still available. I'm currently parked near Flagstaff if you want to check it out.`, 1200);
          }, 800);
        }
      }
    }, 150);
  }
}

function deleteListing(itemId) {
  if (confirm("Are you sure you want to delete this listing?")) {
    State.marketplace = State.marketplace.filter(item => String(item.id) !== String(itemId));
    saveStateToStorage();
    State._cachedFeeds = {}; // Clear feed cache
    renderMarketplaceListings();
    renderDashboardFeed();
    renderFeedTabPosts();
    showToast("Listing deleted successfully.", "success");
  }
}
