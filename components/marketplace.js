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
  
  if (typeof State !== 'undefined' && !State.activeMarketplaceType) {
    State.activeMarketplaceType = 'items';
  }

  let filtered = State.marketplace.filter(item => {
    if (item.status === 'hidden_flagged') return false;

    // Marketplace division filtering
    const isServiceItem = item.category === 'services-offer' || item.category === 'services-want';
    const matchesType = (State.activeMarketplaceType === 'services') ? isServiceItem : !isServiceItem;
    if (!matchesType) return false;

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
  
  const defaultLimit = 12;
  const limit = State._marketLimit || defaultLimit;
  const displayItems = filtered.slice(0, limit);
  
  displayItems.forEach(item => {
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
      `<div style="display:flex; gap:6px;">
        <button class="btn btn-sm btn-primary" onclick="contactSeller('${item.seller.name}', '${item.title}')">Message</button>
        <button class="btn btn-sm" onclick="flagItem('marketplace', '${item.id}')" title="Flag/Report" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.15); font-size: 11px; cursor: pointer; padding: 4px 8px; display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="flag" style="width:13px; height:13px;"></i></button>
       </div>`;
      
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
  
  if (filtered.length > limit) {
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 12px; margin: 16px 0;';
    loadMoreContainer.innerHTML = `
      <button class="btn btn-primary" onclick="State._marketLimit = (State._marketLimit || 12) + 12; renderMarketplaceListings();" style="width: 100%; justify-content: center; box-sizing: border-box;">
        Show More Listings (${filtered.length - limit} remaining)
      </button>
    `;
    grid.appendChild(loadMoreContainer);
  }
  
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

window.switchMarketplaceType = function(type) {
  State.activeMarketplaceType = type;
  
  // Update Tab buttons visual state
  const itemsBtn = document.getElementById('market-tab-items');
  const servicesBtn = document.getElementById('market-tab-services');
  if (itemsBtn && servicesBtn) {
    if (type === 'items') {
      itemsBtn.classList.add('active');
      servicesBtn.classList.remove('active');
    } else {
      servicesBtn.classList.add('active');
      itemsBtn.classList.remove('active');
    }
  }
  
  // Dynamically update the category selector options
  const catFilter = document.getElementById('market-filter-category');
  if (catFilter) {
    const prevVal = catFilter.value;
    catFilter.innerHTML = '';
    
    if (type === 'items') {
      catFilter.innerHTML = `
        <option value="all">All Categories</option>
        <option value="campervan">Campervans</option>
        <option value="electrical">Solar & Electrical</option>
        <option value="parts">Rig Parts & Hardware</option>
        <option value="gear">Camping Gear</option>
      `;
    } else {
      catFilter.innerHTML = `
        <option value="all">All Categories</option>
        <option value="services-offer">Services Offered</option>
        <option value="services-want">Services Wanted</option>
      `;
    }
    
    if (catFilter.querySelector(`option[value="${prevVal}"]`)) {
      catFilter.value = prevVal;
    } else {
      catFilter.value = 'all';
    }
  }

  // Filter categories in "Add Listing" modal dropdown
  const addCategory = document.getElementById('list-category');
  if (addCategory) {
    addCategory.innerHTML = '';
    if (type === 'items') {
      addCategory.innerHTML = `
        <option value="campervan">Campervans</option>
        <option value="electrical">Solar & Electrical</option>
        <option value="parts">Rig Parts & Hardware</option>
        <option value="gear">Camping Gear</option>
      `;
    } else {
      addCategory.innerHTML = `
        <option value="services-offer">Services (Offered)</option>
        <option value="services-want">Services (Wanted)</option>
      `;
    }
  }

  renderMarketplaceListings();
};
