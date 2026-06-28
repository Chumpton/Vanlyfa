/* ==========================================================================
   VANLYFA BACKEND ABSTRACTION LAYER — backend.js
   
   Centralizes ALL data mutations behind a clean async API.
   Currently uses localStorage (via State + saveStateToStorage).
   Designed to swap internals to Supabase without touching callers.
   
   Usage:  Backend.createPost({ content, image })
           Backend.toggleLike(postId)
           Backend.commit(['feed', 'dashboard'])
   ========================================================================== */

const Backend = {

  // ─── Configuration ─────────────────────────────────────────────────
  _mode: 'local',        // 'local' | 'supabase'
  _supabase: null,       // Supabase client instance (set during init)

  // ─── Internal Helpers ──────────────────────────────────────────────

  /** Persist entire State to localStorage */
  _persist() {
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
  },

  /** Clear cached feed renders so next render rebuilds */
  _invalidateFeeds() {
    State._cachedFeeds = {};
  },

  /** Simulate a backend write (clears pendingSync after delay) */
  _scheduleSync(item, type, callback) {
    if (!item) return;
    item.pendingSync = true;

    if (this._mode === 'local') {
      // Log simulated SQL for debugging
      console.log(`%c[Backend] Writing ${type}...`, 'color: #3ecf8e; font-weight: bold;');
      setTimeout(() => {
        if (item) item.pendingSync = false;
        this._persist();
        if (callback) callback();
      }, 1000);
    }
    // Supabase mode: caller handles async write directly
  },

  /** 
   * Commit: persist state + selectively re-render affected UI areas.
   * Replaces the scattered saveStateToStorage() + render*() calls.
   * 
   * @param {string[]} targets - Areas to re-render: 
   *   'feed', 'dashboard', 'forum', 'thread', 'map', 'meetups',
   *   'marketplace', 'chats', 'contacts', 'tribes', 'profile',
   *   'jobs', 'postDetail', 'notifications'
   */
  commit(targets = []) {
    this._persist();
    this._invalidateFeeds();

    const renderMap = {
      feed:        () => { if (typeof renderFeedTabPosts === 'function') renderFeedTabPosts(); },
      dashboard:   () => { if (typeof renderDashboardFeed === 'function') renderDashboardFeed(); },
      forum:       () => { if (typeof renderForumView === 'function') renderForumView(); },
      thread:      () => { if (typeof renderThreadDetail === 'function') renderThreadDetail(); },
      map:         () => { if (typeof renderLeafletMarkers === 'function') renderLeafletMarkers(); },
      meetups:     () => { if (typeof renderMeetupsList === 'function') renderMeetupsList(); },
      marketplace: () => { if (typeof renderMarketplaceListings === 'function') renderMarketplaceListings(); },
      chats:       () => { if (typeof renderActiveChats === 'function') renderActiveChats(); },
      contacts:    () => { if (typeof renderContactsSidebar === 'function') renderContactsSidebar(); },
      tribes:      () => { if (typeof renderTribesGrid === 'function') renderTribesGrid(); },
      profile:     () => { if (typeof updateSidebarProfileWidget === 'function') updateSidebarProfileWidget(); },
      jobs:        () => { if (typeof renderJobsList === 'function') renderJobsList(); },
      notifications: () => { if (typeof renderNotifications === 'function') renderNotifications(); },
      postDetail:  () => {
        const modal = document.getElementById('modal-post-detail');
        if (modal && modal.classList.contains('open')) {
          // Re-open the currently viewed post detail
          if (typeof window.openPostDetailModal === 'function' && State._activePostDetailId) {
            window.openPostDetailModal(State._activePostDetailId);
          }
        }
      },
      currentTab: () => { if (typeof renderCurrentTab === 'function') renderCurrentTab(); }
    };

    targets.forEach(t => {
      if (renderMap[t]) {
        try { renderMap[t](); } catch(e) { console.warn(`[Backend] Render error for '${t}':`, e); }
      }
    });
  },


  // ═══════════════════════════════════════════════════════════════════
  //  POSTS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a new feed post.
   * @returns {object} The created post object.
   */
  createPost({ content, image = null, lat = null, lng = null }) {
    if (!content) throw new Error('Post content cannot be empty.');
    if (!State.isSignedIn) throw new Error('auth_required');
    if (typeof checkRateLimit === 'function' && !checkRateLimit('post')) {
      throw new Error('Rate limit exceeded. You can only create 5 posts per hour.');
    }

    const newPost = {
      id: `post-${Date.now()}`,
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      time: 'Just now',
      content,
      image,
      likes: 0,
      likedByUser: false,
      comments: [],
      reposts: 0,
      shares: 0,
      status: 'approved',
      pendingSync: true,
      lat, lng
    };

    State.posts.unshift(newPost);
    this.commit(['feed', 'dashboard']);
    this._scheduleSync(newPost, 'post', () => {
      this.commit(['feed', 'dashboard']);
    });

    return newPost;
  },

  /**
   * Delete a post by ID. Only the author can delete.
   */
  deletePost(postId) {
    const idx = State.posts.findIndex(p => String(p.id) === String(postId));
    if (idx === -1) throw new Error('Post not found.');
    
    const post = State.posts[idx];
    if (post.author && post.author.name !== State.currentUser.name) {
      throw new Error('You can only delete your own posts.');
    }

    // Optimistic removal
    const removed = State.posts.splice(idx, 1)[0];
    this.commit(['feed', 'dashboard']);

    this._scheduleSync({ pendingSync: true }, 'delete_post', () => {
      // If supabase mode and fails, re-insert
    });

    return removed;
  },

  /**
   * Toggle like on a post.
   */
  toggleLike(postId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const result = typeof findPostOrItem === 'function' ? findPostOrItem(postId) : null;
    const target = result ? result.target : null;
    if (!target) throw new Error('Post not found.');

    // Optimistic toggle
    if (target.likedByUser) {
      target.likes = Math.max(0, (target.likes || 0) - 1);
      target.likedByUser = false;
    } else {
      target.likes = (target.likes || 0) + 1;
      target.likedByUser = true;
    }

    this.commit(['feed', 'dashboard', 'postDetail']);

    // Sync
    if (this._mode === 'local') {
      if (typeof simulateApiCall === 'function') {
        simulateApiCall(
          () => { this._persist(); },
          () => {
            // Rollback
            if (target.likedByUser) {
              target.likes = Math.max(0, (target.likes || 0) - 1);
              target.likedByUser = false;
            } else {
              target.likes = (target.likes || 0) + 1;
              target.likedByUser = true;
            }
            this.commit(['feed', 'dashboard', 'postDetail']);
            if (typeof showToast === 'function') showToast('Network sync failed. Like rolled back.', 'error');
          }
        );
      }
    }

    return target;
  },

  /**
   * Add a comment to a post/item.
   */
  addComment(postId, commentText) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!commentText || !commentText.trim()) throw new Error('Comment cannot be empty.');

    const result = typeof findPostOrItem === 'function' ? findPostOrItem(postId) : null;
    const target = result ? result.target : null;
    if (!target) throw new Error('Target not found.');
    if (!target.comments) target.comments = [];

    const newComment = {
      id: `cmt-${Date.now()}`,
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      text: commentText.trim(),
      time: 'Just now',
      pendingSync: true
    };

    target.comments.push(newComment);

    // Expand comments for this post
    if (!State._expandedPostComments) State._expandedPostComments = new Set();
    State._expandedPostComments.add(postId);

    // Create notification for author
    const targetAuthorName = target.author ? target.author.name 
      : (target.host ? target.host.name 
      : (target.seller ? (typeof target.seller === 'object' ? target.seller.name : target.seller) : null));
    
    if (targetAuthorName && targetAuthorName !== State.currentUser.name) {
      if (!State.notifications) State.notifications = [];
      State.notifications.unshift({
        id: `notif-${Date.now()}`,
        content: `💬 ${State.currentUser.name} commented on your post: "${commentText.substring(0, 30)}${commentText.length > 30 ? '...' : ''}"`,
        time: 'Just now',
        read: false
      });
    }

    this.commit(['feed', 'dashboard', 'postDetail']);
    this._scheduleSync(newComment, 'comment', () => {
      this.commit(['feed', 'dashboard', 'postDetail']);
    });

    return newComment;
  },

  /**
   * Toggle repost on a post.
   */
  toggleRepost(postId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const target = State.posts.find(p => String(p.id) === String(postId));
    if (!target) throw new Error('Post not found.');

    if (!State.currentUser.repostedPostIds) State.currentUser.repostedPostIds = [];

    const rawId = target.rawId || target.id;
    const idx = State.currentUser.repostedPostIds.indexOf(rawId);

    if (idx > -1) {
      State.currentUser.repostedPostIds.splice(idx, 1);
      target.reposts = Math.max(0, (target.reposts || 0) - 1);
    } else {
      State.currentUser.repostedPostIds.push(rawId);
      target.reposts = (target.reposts || 0) + 1;
    }

    this.commit(['feed', 'dashboard']);
    return target;
  },

  /**
   * Increment share count on a post.
   */
  sharePost(postId) {
    const target = State.posts.find(p => String(p.id) === String(postId));
    if (!target) return null;
    target.shares = (target.shares || 0) + 1;
    this._persist();
    return target;
  },

  /**
   * Toggle saving/bookmarking a post.
   */
  toggleSavePost(postId) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!State.currentUser.savedPostIds) State.currentUser.savedPostIds = [];

    const idx = State.currentUser.savedPostIds.indexOf(postId);
    if (idx > -1) {
      State.currentUser.savedPostIds.splice(idx, 1);
    } else {
      State.currentUser.savedPostIds.push(postId);
    }

    this._persist();
    return idx === -1; // returns true if now saved
  },


  // ═══════════════════════════════════════════════════════════════════
  //  FORUM
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a new forum thread.
   */
  createThread({ title, body, category = 'General', image = null }) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!title || !body) throw new Error('Title and body are required.');

    const newThread = {
      id: `thread-${Date.now()}`,
      title,
      category,
      body,
      image,
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      time: 'Just now',
      replies: [],
      repliesCount: 0,
      views: 0,
      status: 'approved',
      pendingSync: true
    };

    if (State.isOffline) {
      State.syncQueue.push({ type: 'CREATE_THREAD', payload: newThread });
    }

    State.forum.unshift(newThread);
    this.commit(['forum']);
    this._scheduleSync(newThread, 'forum_thread', () => {
      this.commit(['forum']);
    });

    return newThread;
  },

  /**
   * Submit a reply to a forum thread.
   */
  submitReply(threadId, body) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!body || !body.trim()) throw new Error('Reply body cannot be empty.');

    const thread = State.forum.find(t => t.id === threadId);
    if (!thread) throw new Error('Thread not found.');
    if (!thread.replies) thread.replies = [];

    const newReply = {
      id: `reply-${Date.now()}`,
      body: body.trim(),
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      time: 'Just now',
      pendingSync: true
    };

    if (State.isOffline) {
      State.syncQueue.push({ type: 'CREATE_REPLY', payload: { threadId, reply: newReply } });
    }

    thread.replies.push(newReply);
    thread.repliesCount = (thread.repliesCount || 0) + 1;
    this.commit(['thread']);
    this._scheduleSync(newReply, 'forum_reply', () => {
      this.commit(['thread']);
    });

    return newReply;
  },

  /**
   * Give reputation to a forum thread author.
   */
  giveReputation(threadId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const thread = State.forum.find(t => t.id === threadId);
    if (!thread) throw new Error('Thread not found.');
    if (!thread.author) throw new Error('Thread has no author.');

    const authorName = thread.author.name;
    if (authorName === State.currentUser.name) {
      throw new Error('You cannot vouch for your own post.');
    }

    if (!State.currentUser.givenRepTo) State.currentUser.givenRepTo = [];
    if (State.currentUser.givenRepTo.includes(authorName)) {
      throw new Error('already_given');
    }

    const authorUser = State.users.find(u => u.name === authorName);
    if (authorUser) {
      authorUser.reputation = (authorUser.reputation || 0) + 1;
      State.currentUser.givenRepTo.push(authorName);

      // Sync currentUser properties if same user
      if (authorUser.name === State.currentUser.name) {
        State.currentUser.givenRepTo = authorUser.givenRepTo;
      }
    }

    this.commit(['thread', 'forum']);
    return authorUser;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  SPOTS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a new map spot/pin.
   */
  createSpot(spotData) {
    if (!State.isSignedIn) throw new Error('auth_required');
    
    const newSpot = {
      id: spotData.id || `spot-${Date.now()}`,
      title: spotData.title,
      category: spotData.category,
      lat: spotData.lat,
      lng: spotData.lng,
      description: spotData.description || '',
      image: spotData.image || null,
      fee: spotData.fee || 0,
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      vouches: 1,
      vouchedBy: [State.currentUser.name],
      comments: [],
      status: spotData.requiresApproval ? 'pending' : 'approved',
      pendingSync: true
    };

    if (State.isOffline) {
      State.syncQueue.push({ type: 'CREATE_SPOT', payload: newSpot });
    }

    State.spots.push(newSpot);
    State.currentUser.spotsCount = (State.currentUser.spotsCount || 0) + 1;
    this.commit(['map', 'dashboard']);
    this._scheduleSync(newSpot, 'spot', () => {
      this.commit(['map']);
    });

    return newSpot;
  },

  /**
   * Vouch for a spot.
   */
  vouchSpot(spotId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const spot = State.spots.find(s => s.id === spotId);
    if (!spot) throw new Error('Spot not found.');

    if (!spot.vouchedBy) spot.vouchedBy = [];
    if (spot.vouchedBy.includes(State.currentUser.name)) {
      throw new Error('already_vouched');
    }

    // Optimistic
    spot.vouches = (spot.vouches || 0) + 1;
    spot.vouchedBy.push(State.currentUser.name);
    this.commit(['map']);

    return spot;
  },

  /**
   * Add a review/comment to a spot.
   */
  addSpotReview(spotId, { rating, text }) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const spot = State.spots.find(s => s.id === spotId);
    if (!spot) throw new Error('Spot not found.');
    if (!spot.comments) spot.comments = [];

    const review = {
      id: `review-${Date.now()}`,
      author: State.currentUser.name,
      avatar: State.currentUser.avatar,
      rating: rating || 5,
      text: text || '',
      time: 'Just now'
    };

    spot.comments.push(review);
    this._persist();
    return review;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  MARKETPLACE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a new marketplace listing.
   */
  createListing(listingData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    // Enforce limit of 3 active listings
    const userListings = State.marketplace.filter(
      l => l.seller && (typeof l.seller === 'object' ? l.seller.name : l.seller) === State.currentUser.name
    );
    if (userListings.length >= 3) {
      throw new Error('You can only have 3 active listings at a time.');
    }

    const listing = {
      id: `listing-${Date.now()}`,
      title: listingData.title,
      price: listingData.price,
      category: listingData.category,
      listingType: listingData.listingType || 'item',
      location: listingData.location,
      zip: listingData.zip,
      description: listingData.description || '',
      image: listingData.image || null,
      seller: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      status: 'approved',
      pendingSync: true
    };

    State.marketplace.unshift(listing);
    State.currentUser.listingsCount = (State.currentUser.listingsCount || 0) + 1;
    this.commit(['marketplace', 'dashboard']);
    this._scheduleSync(listing, 'listing', () => {
      this.commit(['marketplace']);
    });

    return listing;
  },

  /**
   * Delete a marketplace listing.
   */
  deleteListing(listingId) {
    const idx = State.marketplace.findIndex(l => l.id === listingId);
    if (idx === -1) throw new Error('Listing not found.');
    
    const removed = State.marketplace.splice(idx, 1)[0];
    State.currentUser.listingsCount = Math.max(0, (State.currentUser.listingsCount || 0) - 1);
    this.commit(['marketplace']);
    return removed;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  MEETUPS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a new meetup.
   */
  createMeetup(meetupData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    // Enforce limit of 1 hosted meetup
    const hostedCount = State.meetups.filter(
      m => m.host && m.host.name === State.currentUser.name
    ).length;
    if (hostedCount >= 1) {
      throw new Error('You can only host 1 active meetup at a time.');
    }

    const newMeetup = {
      id: meetupData.id || `meetup-${Date.now()}`,
      title: meetupData.title,
      date: meetupData.date,
      time: meetupData.time,
      location: meetupData.location,
      lat: meetupData.lat,
      lng: meetupData.lng,
      description: meetupData.description || '',
      image: meetupData.image || null,
      host: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      attendees: [State.currentUser.avatar],
      attendeeNames: [State.currentUser.name],
      comments: [],
      status: 'approved',
      pendingSync: true
    };

    State.meetups.unshift(newMeetup);
    this.commit(['meetups', 'map', 'dashboard']);
    this._scheduleSync(newMeetup, 'meetup', () => {
      this.commit(['meetups']);
    });

    return newMeetup;
  },

  /**
   * Toggle RSVP attendance for a meetup.
   */
  toggleAttendance(meetupId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const meetup = State.meetups.find(m => m.id === meetupId);
    if (!meetup) throw new Error('Meetup not found.');
    if (!meetup.attendeeNames) meetup.attendeeNames = [];
    if (!meetup.attendees) meetup.attendees = [];

    const nameIdx = meetup.attendeeNames.indexOf(State.currentUser.name);
    if (nameIdx > -1) {
      meetup.attendeeNames.splice(nameIdx, 1);
      meetup.attendees = meetup.attendees.filter(a => a !== State.currentUser.avatar);
    } else {
      meetup.attendeeNames.push(State.currentUser.name);
      meetup.attendees.push(State.currentUser.avatar);
    }

    this.commit(['meetups']);
    return nameIdx === -1; // true if now attending
  },

  /**
   * Add a comment to a meetup.
   */
  addMeetupComment(meetupId, text) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!text || !text.trim()) throw new Error('Comment cannot be empty.');

    const meetup = State.meetups.find(m => m.id === meetupId);
    if (!meetup) throw new Error('Meetup not found.');
    if (!meetup.comments) meetup.comments = [];

    const comment = {
      id: `meetup-cmt-${Date.now()}`,
      author: State.currentUser.name,
      avatar: State.currentUser.avatar,
      text: text.trim(),
      time: 'Just now'
    };

    meetup.comments.push(comment);
    this.commit(['meetups']);
    return comment;
  },

  /**
   * Delete a meetup (host only).
   */
  deleteMeetup(meetupId) {
    const idx = State.meetups.findIndex(m => m.id === meetupId);
    if (idx === -1) throw new Error('Meetup not found.');
    const removed = State.meetups.splice(idx, 1)[0];
    this.commit(['meetups', 'map']);
    return removed;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  MESSAGING
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Send a chat message to a user.
   */
  sendMessage(username, text, options = {}) {
    if (!State.isSignedIn) throw new Error('auth_required');

    if (!State.chats) State.chats = {};
    if (!State.chats[username]) State.chats[username] = [];

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: State.currentUser.name,
      text,
      isImage: options.isImage || false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reaction: null,
      status: 'sent'
    };

    State.chats[username].push(newMsg);
    this.commit(['chats', 'contacts']);

    // Simulate delivery/read status
    setTimeout(() => {
      newMsg.status = 'delivered';
      this.commit(['chats']);
    }, 1500);
    setTimeout(() => {
      newMsg.status = 'read';
      this.commit(['chats']);
    }, 3000);

    return newMsg;
  },

  /**
   * React to a chat message.
   */
  reactToMessage(username, msgId, emoji) {
    const messages = State.chats[username] || [];
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return null;

    msg.reaction = emoji || null;
    this.commit(['chats']);
    return msg;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  TRIBES
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Send a message in a tribe's live chat.
   */
  sendTribeChat(tribeId, text) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!text || !text.trim()) return null;

    if (!State.tribeChats) State.tribeChats = {};
    if (!State.tribeChats[tribeId]) State.tribeChats[tribeId] = [];

    const msg = {
      id: `tc-${Date.now()}`,
      author: State.currentUser.name,
      avatar: State.currentUser.avatar,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    State.tribeChats[tribeId].push(msg);
    this._persist();
    return msg;
  },

  /**
   * Join a tribe.
   */
  joinTribe(tribeId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const tribe = State.tribes.find(t => t.id === tribeId);
    if (!tribe) throw new Error('Tribe not found.');
    if (!tribe.members) tribe.members = [];

    if (!tribe.members.includes(State.currentUser.name)) {
      tribe.members.push(State.currentUser.name);
      tribe.memberCount = (tribe.memberCount || 0) + 1;
    }

    this.commit(['tribes']);
    return tribe;
  },

  /**
   * Leave a tribe.
   */
  leaveTribe(tribeId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const tribe = State.tribes.find(t => t.id === tribeId);
    if (!tribe) throw new Error('Tribe not found.');
    if (!tribe.members) tribe.members = [];

    tribe.members = tribe.members.filter(m => m !== State.currentUser.name);
    tribe.memberCount = Math.max(0, (tribe.memberCount || 0) - 1);

    this.commit(['tribes']);
    return tribe;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  PROFILES & SOCIAL
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Toggle follow/unfollow a user.
   */
  toggleFollow(username) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (username === State.currentUser.name) throw new Error('Cannot follow yourself.');

    if (!State.currentUser.friends) State.currentUser.friends = [];

    const idx = State.currentUser.friends.indexOf(username);
    if (idx > -1) {
      State.currentUser.friends.splice(idx, 1);
    } else {
      State.currentUser.friends.push(username);
    }

    this.commit(['feed', 'dashboard', 'profile']);
    return idx === -1; // true if now following
  },

  /**
   * Block a user.
   */
  blockUser(username) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (username === State.currentUser.name) throw new Error('You cannot block yourself.');

    if (!State.currentUser.blockedUsers) State.currentUser.blockedUsers = [];
    if (!State.currentUser.blockedUsers.includes(username)) {
      State.currentUser.blockedUsers.push(username);
    }

    this.commit(['feed', 'dashboard', 'currentTab']);
    return true;
  },

  /**
   * Flag/report content.
   */
  flagItem(type, id) {
    if (!State.isSignedIn) throw new Error('auth_required');

    let target = null;
    if (type === 'post') target = State.posts.find(p => String(p.id) === String(id));
    else if (type === 'spot') target = State.spots.find(s => s.id === id);
    else if (type === 'listing') target = State.marketplace.find(l => l.id === id);
    else if (type === 'meetup') target = State.meetups.find(m => m.id === id);
    else if (type === 'thread') target = State.forum.find(t => t.id === id);

    if (target) {
      target.flags_count = (target.flags_count || 0) + 1;
      if (target.flags_count >= 3) {
        target.status = 'hidden_flagged';
      }
    }

    this._persist();
    return target;
  },

  /**
   * Add a guestbook comment to a user's profile.
   */
  addGuestbookComment(targetUsername, text) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!text || !text.trim()) throw new Error('Comment cannot be empty.');

    const targetUser = State.users.find(u => u.name === targetUsername);
    if (!targetUser) throw new Error('User not found.');
    if (!targetUser.guestbookComments) targetUser.guestbookComments = [];

    const comment = {
      id: `gb-${Date.now()}`,
      author: State.currentUser.name,
      avatar: State.currentUser.avatar,
      text: text.trim(),
      time: 'Just now'
    };

    targetUser.guestbookComments.push(comment);
    this._persist();
    return comment;
  },

  /**
   * Update the current user's profile.
   */
  updateProfile(profileData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    // Update current user
    Object.assign(State.currentUser, profileData);

    // Also update in users array
    const userInList = State.users.find(u => u.name === State.currentUser.name);
    if (userInList) {
      Object.assign(userInList, profileData);
    }

    this.commit(['profile', 'feed', 'dashboard']);
    return State.currentUser;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Sign in a user by name/handle.
   */
  signIn(identifier, password) {
    const searchName = identifier.toLowerCase();
    const user = State.users.find(u =>
      u.name.toLowerCase() === searchName || 
      (u.handle && u.handle.toLowerCase() === searchName) ||
      (u.handle && u.handle.toLowerCase() === `@${searchName}`)
    );

    if (!user) throw new Error('No nomad found with that name. Sign up instead!');
    if (user.banned) throw new Error('This account has been deactivated.');
    if (user.password && password !== user.password) throw new Error('Incorrect password.');

    State.currentUser = { ...user };
    State.currentUser.savedPostIds = State.currentUser.savedPostIds || [];
    State.currentUser.savedMeetupIds = State.currentUser.savedMeetupIds || [];
    State.currentUser.blockedUsers = State.currentUser.blockedUsers || [];
    State.isSignedIn = true;

    this.commit(['profile', 'feed', 'dashboard']);
    return State.currentUser;
  },

  /**
   * Sign out.
   */
  signOut() {
    State.isSignedIn = false;
    State.currentUser = {
      name: 'Guest Nomad', handle: '@guest', avatar: 'avatar_guest',
      bio: 'Signed out guest', rig: '', solar: '', power: '', water: '',
      spotsCount: 0, listingsCount: 0, reputation: 0,
      givenRepTo: [], savedPostIds: [], savedMeetupIds: []
    };
    State.activeChats = [];
    State.minimizedChats = [];

    this.commit(['profile', 'feed', 'dashboard', 'chats', 'contacts']);
    return true;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  JOBS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a work & stay job listing.
   */
  createJob(jobData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const job = {
      id: `job-${Date.now()}`,
      title: jobData.title,
      location: jobData.location,
      duration: jobData.duration,
      labor: jobData.labor,
      compensation: jobData.compensation,
      description: jobData.description || '',
      host: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      status: 'approved',
      pendingSync: true
    };

    if (!State.jobs) State.jobs = [];
    State.jobs.unshift(job);
    this.commit(['jobs']);
    this._scheduleSync(job, 'job');

    return job;
  },

  /**
   * Delete a job listing.
   */
  deleteJob(jobId) {
    if (!State.jobs) return null;
    const idx = State.jobs.findIndex(j => j.id === jobId);
    if (idx === -1) throw new Error('Job not found.');
    const removed = State.jobs.splice(idx, 1)[0];
    this.commit(['jobs']);
    return removed;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  BOOKINGS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a driveway stay booking.
   */
  createBooking(bookingData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const booking = {
      id: `booking-${Date.now()}`,
      spotId: bookingData.spotId,
      spotTitle: bookingData.spotTitle,
      date: bookingData.date,
      nights: bookingData.nights,
      total: bookingData.total,
      host: bookingData.host,
      guest: State.currentUser.name,
      status: 'confirmed'
    };

    if (!State.bookings) State.bookings = [];
    State.bookings.push(booking);
    this._persist();

    return booking;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Push a notification.
   */
  notify(content) {
    if (!State.notifications) State.notifications = [];
    State.notifications.unshift({
      id: `notif-${Date.now()}`,
      content,
      time: 'Just now',
      read: false
    });
    this._persist();
  },

  /**
   * Mark all notifications as read.
   */
  markAllNotificationsRead() {
    if (State.notifications) {
      State.notifications.forEach(n => n.read = true);
      this._persist();
    }
  }
};

// Make globally accessible
window.Backend = Backend;
