/* ==========================================================================
   VANLYFA BACKEND ABSTRACTION LAYER — backend.js
   
   Centralizes ALL data mutations behind a clean async API.
   Supports both 'local' (localStorage) and 'supabase' modes.
   Uses database UUID alignment and provides robust Optimistic UI with rollback.
   ========================================================================== */

function mockUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const Backend = {

  // ─── Configuration ─────────────────────────────────────────────────
  _mode: 'supabase',        // 'local' | 'supabase'
  _supabase: null,       // Supabase client instance (set during init)

  // ─── Internal Helpers ──────────────────────────────────────────────

  /** Persist entire State to localStorage */
  _persist() {
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
  },

  /** Clear cached feed renders so next render rebuilds */
  _invalidateFeeds() {
    if (State) State._cachedFeeds = {};
  },

  /** Commit: persist state + selectively re-render affected UI areas. */
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

  /** Create a new feed post. */
  async createPost({ content, image = null, lat = null, lng = null }) {
    if (!content) throw new Error('Post content cannot be empty.');
    if (!State.isSignedIn) throw new Error('auth_required');
    if (typeof checkRateLimit === 'function' && !checkRateLimit('post')) {
      throw new Error('Rate limit exceeded. You can only create 5 posts per hour.');
    }

    const tempId = mockUuid();
    const tempPost = {
      id: tempId,
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      time: 'Posting...',
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

    // Optimistic Update
    State.posts.unshift(tempPost);
    this.commit(['feed', 'dashboard']);

    try {
      if (this._mode === 'supabase') {
        const { data, error } = await this._supabase
          .from('posts')
          .insert({
            text: content,
            image: image,
            author_id: State.currentUser.id,
            status: 'approved'
          })
          .select('*, author:profiles(*)')
          .single();

        if (error) throw error;

        // Replace temp with database values
        const idx = State.posts.findIndex(p => p.id === tempId);
        if (idx !== -1) {
          State.posts[idx] = {
            id: data.id,
            author: { name: data.author.name, avatar: data.author.avatar },
            time: 'Just now',
            content: data.text,
            image: data.image,
            likes: 0,
            likedByUser: false,
            comments: [],
            reposts: 0,
            shares: 0,
            status: data.status,
            lat: lat, lng: lng
          };
        }
      } else {
        // Local mode fallback
        await new Promise(resolve => setTimeout(resolve, 800));
        tempPost.id = mockUuid();
        tempPost.time = 'Just now';
        tempPost.pendingSync = false;
      }
      this.commit(['feed', 'dashboard']);
      return State.posts.find(p => p.id !== tempId) || tempPost;
    } catch (err) {
      // Rollback
      State.posts = State.posts.filter(p => p.id !== tempId);
      this.commit(['feed', 'dashboard']);
      throw err;
    }
  },

  /** Delete a post. */
  async deletePost(postId) {
    const idx = State.posts.findIndex(p => String(p.id) === String(postId));
    if (idx === -1) throw new Error('Post not found.');
    
    const post = State.posts[idx];
    if (post.author && post.author.name !== State.currentUser.name) {
      throw new Error('You can only delete your own posts.');
    }

    const originalPosts = [...State.posts];

    // Optimistic delete
    State.posts.splice(idx, 1);
    this.commit(['feed', 'dashboard']);

    try {
      if (this._mode === 'supabase') {
        const { error } = await this._supabase
          .from('posts')
          .delete()
          .eq('id', postId);
        if (error) throw error;
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      this.commit(['feed', 'dashboard']);
    } catch (err) {
      // Rollback
      State.posts = originalPosts;
      this.commit(['feed', 'dashboard']);
      throw err;
    }
  },

  /** Toggle like on a post with precise rollback */
  async toggleLike(postId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const result = typeof findPostOrItem === 'function' ? findPostOrItem(postId) : null;
    const target = result ? result.target : null;
    if (!target) throw new Error('Post not found.');

    // Snapshot previous values
    const wasLiked = target.likedByUser;
    const prevLikes = target.likes;

    // Optimistic Update
    target.likedByUser = !wasLiked;
    target.likes = wasLiked ? Math.max(0, (target.likes || 0) - 1) : (target.likes || 0) + 1;
    this.commit(['feed', 'dashboard', 'postDetail']);

    try {
      if (this._mode === 'supabase') {
        if (wasLiked) {
          const { error } = await this._supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('profile_id', State.currentUser.id);
          if (error) throw error;
        } else {
          const { error } = await this._supabase
            .from('post_likes')
            .insert({ post_id: postId, profile_id: State.currentUser.id });
          if (error) throw error;
        }
      } else {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (State.isOffline) reject(new Error('Offline mode active.'));
            else resolve();
          }, 400);
        });
      }
      this._persist();
      return target;
    } catch (err) {
      // Rollback
      target.likedByUser = wasLiked;
      target.likes = prevLikes;
      this.commit(['feed', 'dashboard', 'postDetail']);
      throw err;
    }
  },

  /** Add a comment with rollback. */
  async addComment(postId, commentText) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!commentText || !commentText.trim()) throw new Error('Comment cannot be empty.');

    const result = typeof findPostOrItem === 'function' ? findPostOrItem(postId) : null;
    const target = result ? result.target : null;
    if (!target) throw new Error('Target not found.');
    if (!target.comments) target.comments = [];

    const tempId = mockUuid();
    const newComment = {
      id: tempId,
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      text: commentText.trim(),
      time: 'Just now',
      pendingSync: true
    };

    // Snapshot previous comments
    const originalComments = [...target.comments];

    // Optimistic Update
    target.comments.push(newComment);
    if (!State._expandedPostComments) State._expandedPostComments = new Set();
    State._expandedPostComments.add(postId);
    this.commit(['feed', 'dashboard', 'postDetail']);

    try {
      if (this._mode === 'supabase') {
        const { data, error } = await this._supabase
          .from('comments')
          .insert({
            post_id: postId,
            text: commentText.trim(),
            author_id: State.currentUser.id
          })
          .select('*, author:profiles(*)')
          .single();

        if (error) throw error;

        // Sync local object ID
        const idx = target.comments.findIndex(c => c.id === tempId);
        if (idx !== -1) {
          target.comments[idx] = {
            id: data.id,
            author: { name: data.author.name, avatar: data.author.avatar },
            text: data.text,
            time: 'Just now'
          };
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        newComment.id = mockUuid();
        newComment.pendingSync = false;
      }
      this.commit(['feed', 'dashboard', 'postDetail']);
      return newComment;
    } catch (err) {
      // Rollback
      target.comments = originalComments;
      this.commit(['feed', 'dashboard', 'postDetail']);
      throw err;
    }
  },

  /** Toggle repost. */
  async toggleRepost(postId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const target = State.posts.find(p => String(p.id) === String(postId));
    if (!target) throw new Error('Post not found.');

    if (!State.currentUser.repostedPostIds) State.currentUser.repostedPostIds = [];

    const rawId = target.rawId || target.id;
    const idx = State.currentUser.repostedPostIds.indexOf(rawId);

    // Optimistic Update
    if (idx > -1) {
      State.currentUser.repostedPostIds.splice(idx, 1);
      target.reposts = Math.max(0, (target.reposts || 0) - 1);
    } else {
      State.currentUser.repostedPostIds.push(rawId);
      target.reposts = (target.reposts || 0) + 1;
    }
    this.commit(['feed', 'dashboard']);

    try {
      if (this._mode === 'supabase') {
        // Implement database join interaction here in future
      }
      this._persist();
      return target;
    } catch (err) {
      // Rollback
      if (idx > -1) {
        State.currentUser.repostedPostIds.push(rawId);
        target.reposts = (target.reposts || 0) + 1;
      } else {
        const rollbackIdx = State.currentUser.repostedPostIds.indexOf(rawId);
        if (rollbackIdx > -1) State.currentUser.repostedPostIds.splice(rollbackIdx, 1);
        target.reposts = Math.max(0, (target.reposts || 0) - 1);
      }
      this.commit(['feed', 'dashboard']);
      throw err;
    }
  },

  /** Share post. */
  async sharePost(postId) {
    const target = State.posts.find(p => String(p.id) === String(postId));
    if (!target) return null;
    target.shares = (target.shares || 0) + 1;
    this._persist();
    return target;
  },

  /** Toggle bookmark post. */
  async toggleSavePost(postId) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!State.currentUser.savedPostIds) State.currentUser.savedPostIds = [];

    const idx = State.currentUser.savedPostIds.indexOf(postId);
    const originalSaved = [...State.currentUser.savedPostIds];

    // Optimistic update
    if (idx > -1) {
      State.currentUser.savedPostIds.splice(idx, 1);
    } else {
      State.currentUser.savedPostIds.push(postId);
    }
    this.commit(['feed', 'dashboard']);

    try {
      if (this._mode === 'supabase') {
        // Supabase bookmark sync logic (visited_spots-like table mapping)
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      this._persist();
      return idx === -1;
    } catch (err) {
      // Rollback
      State.currentUser.savedPostIds = originalSaved;
      this.commit(['feed', 'dashboard']);
      throw err;
    }
  },


  // ═══════════════════════════════════════════════════════════════════
  //  FORUM
  // ═══════════════════════════════════════════════════════════════════

  /** Create new forum thread. */
  async createThread({ title, body, category = 'General', image = null }) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!title || !body) throw new Error('Title and body are required.');

    const tempId = mockUuid();
    const newThread = {
      id: tempId,
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

    State.forum.unshift(newThread);
    this.commit(['forum']);

    try {
      if (this._mode === 'supabase') {
        const { data, error } = await this._supabase
          .from('forum_threads')
          .insert({
            title,
            body,
            category,
            image,
            author_id: State.currentUser.id,
            status: 'approved'
          })
          .select('*, author:profiles(*)')
          .single();

        if (error) throw error;

        const idx = State.forum.findIndex(t => t.id === tempId);
        if (idx !== -1) {
          State.forum[idx] = {
            id: data.id,
            title: data.title,
            category: data.category,
            body: data.body,
            image: data.image,
            author: { name: data.author.name, avatar: data.author.avatar },
            time: 'Just now',
            replies: [],
            repliesCount: 0,
            views: 0,
            status: data.status
          };
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        newThread.id = mockUuid();
        newThread.pendingSync = false;
      }
      this.commit(['forum']);
      return newThread;
    } catch (err) {
      State.forum = State.forum.filter(t => t.id !== tempId);
      this.commit(['forum']);
      throw err;
    }
  },

  /** Submit reply to forum thread. */
  async submitReply(threadId, body) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!body || !body.trim()) throw new Error('Reply body cannot be empty.');

    const thread = State.forum.find(t => t.id === threadId);
    if (!thread) throw new Error('Thread not found.');
    if (!thread.replies) thread.replies = [];

    const tempId = mockUuid();
    const newReply = {
      id: tempId,
      body: body.trim(),
      author: { name: State.currentUser.name, avatar: State.currentUser.avatar },
      time: 'Just now',
      pendingSync: true
    };

    const originalReplies = [...thread.replies];
    const originalCount = thread.repliesCount;

    // Optimistic Update
    thread.replies.push(newReply);
    thread.repliesCount = (thread.repliesCount || 0) + 1;
    this.commit(['thread']);

    try {
      if (this._mode === 'supabase') {
        const { data, error } = await this._supabase
          .from('forum_replies')
          .insert({
            thread_id: threadId,
            body: body.trim(),
            author_id: State.currentUser.id
          })
          .select('*, author:profiles(*)')
          .single();

        if (error) throw error;

        const idx = thread.replies.findIndex(r => r.id === tempId);
        if (idx !== -1) {
          thread.replies[idx] = {
            id: data.id,
            body: data.body,
            author: { name: data.author.name, avatar: data.author.avatar },
            time: 'Just now'
          };
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        newReply.id = mockUuid();
        newReply.pendingSync = false;
      }
      this.commit(['thread']);
      return newReply;
    } catch (err) {
      thread.replies = originalReplies;
      thread.repliesCount = originalCount;
      this.commit(['thread']);
      throw err;
    }
  },

  /** Give reputation point. */
  async giveReputation(threadId) {
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
    const originalRep = authorUser ? authorUser.reputation : 0;

    // Optimistic Update
    if (authorUser) {
      authorUser.reputation = (authorUser.reputation || 0) + 1;
      State.currentUser.givenRepTo.push(authorName);
    }
    this.commit(['thread', 'forum']);

    try {
      if (this._mode === 'supabase') {
        // Sync custom relations if in supabase
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      this._persist();
      return authorUser;
    } catch (err) {
      // Rollback
      if (authorUser) {
        authorUser.reputation = originalRep;
        const repIdx = State.currentUser.givenRepTo.indexOf(authorName);
        if (repIdx > -1) State.currentUser.givenRepTo.splice(repIdx, 1);
      }
      this.commit(['thread', 'forum']);
      throw err;
    }
  },


  // ═══════════════════════════════════════════════════════════════════
  //  SPOTS
  // ═══════════════════════════════════════════════════════════════════

  /** Create map pin. */
  async createSpot(spotData) {
    if (!State.isSignedIn) throw new Error('auth_required');
    
    const tempId = mockUuid();
    const newSpot = {
      id: tempId,
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

    State.spots.push(newSpot);
    State.currentUser.spotsCount = (State.currentUser.spotsCount || 0) + 1;
    this.commit(['map', 'dashboard']);

    try {
      if (this._mode === 'supabase') {
        const { data, error } = await this._supabase
          .from('spots')
          .insert({
            title: spotData.title,
            category: spotData.category,
            lat: spotData.lat,
            lng: spotData.lng,
            description: spotData.description || '',
            image: spotData.image || null,
            fee: spotData.fee || 0,
            author_id: State.currentUser.id,
            status: spotData.requiresApproval ? 'pending' : 'approved'
          })
          .select('*, author:profiles(*)')
          .single();

        if (error) throw error;

        const idx = State.spots.findIndex(s => s.id === tempId);
        if (idx !== -1) {
          State.spots[idx] = {
            id: data.id,
            title: data.title,
            category: data.category,
            lat: data.lat,
            lng: data.lng,
            description: data.description,
            image: data.image,
            fee: data.fee,
            author: { name: data.author.name, avatar: data.author.avatar },
            vouches: 1,
            vouchedBy: [State.currentUser.name],
            comments: [],
            status: data.status
          };
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        newSpot.id = mockUuid();
        newSpot.pendingSync = false;
      }
      this.commit(['map']);
      return newSpot;
    } catch (err) {
      State.spots = State.spots.filter(s => s.id !== tempId);
      State.currentUser.spotsCount = Math.max(0, (State.currentUser.spotsCount || 0) - 1);
      this.commit(['map', 'dashboard']);
      throw err;
    }
  },

  /** Vouch spot. */
  async vouchSpot(spotId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const spot = State.spots.find(s => s.id === spotId);
    if (!spot) throw new Error('Spot not found.');

    if (!spot.vouchedBy) spot.vouchedBy = [];
    if (spot.vouchedBy.includes(State.currentUser.name)) {
      throw new Error('already_vouched');
    }

    const prevVouches = spot.vouches;
    const originalVouchedBy = [...spot.vouchedBy];

    // Optimistic Update
    spot.vouches = (spot.vouches || 0) + 1;
    spot.vouchedBy.push(State.currentUser.name);
    this.commit(['map']);

    try {
      if (this._mode === 'supabase') {
        const { error } = await this._supabase
          .from('visited_spots')
          .insert({ spot_id: spotId, profile_id: State.currentUser.id });
        if (error) throw error;
      } else {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      this._persist();
      return spot;
    } catch (err) {
      spot.vouches = prevVouches;
      spot.vouchedBy = originalVouchedBy;
      this.commit(['map']);
      throw err;
    }
  },

  /** Add review to spot. */
  async addSpotReview(spotId, { rating, text }) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const spot = State.spots.find(s => s.id === spotId);
    if (!spot) throw new Error('Spot not found.');
    if (!spot.comments) spot.comments = [];

    const review = {
      id: mockUuid(),
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

  /** Create marketplace listing. */
  async createListing(listingData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const userListings = State.marketplace.filter(
      l => l.seller && (typeof l.seller === 'object' ? l.seller.name : l.seller) === State.currentUser.name
    );
    if (userListings.length >= 3) {
      throw new Error('You can only have 3 active listings at a time.');
    }

    const tempId = mockUuid();
    const listing = {
      id: tempId,
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

    try {
      if (this._mode === 'supabase') {
        const { data, error } = await this._supabase
          .from('marketplace')
          .insert({
            title: listingData.title,
            price: listingData.price,
            category: listingData.category,
            listing_type: listingData.listingType || 'item',
            location: listingData.location,
            zip: listingData.zip,
            description: listingData.description || '',
            image: listingData.image || null,
            seller_id: State.currentUser.id,
            status: 'approved'
          })
          .select('*, seller:profiles(*)')
          .single();

        if (error) throw error;

        const idx = State.marketplace.findIndex(l => l.id === tempId);
        if (idx !== -1) {
          State.marketplace[idx] = {
            id: data.id,
            title: data.title,
            price: data.price,
            category: data.category,
            listingType: data.listing_type,
            location: data.location,
            zip: data.zip,
            description: data.description,
            image: data.image,
            seller: { name: data.seller.name, avatar: data.seller.avatar },
            status: data.status
          };
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        listing.id = mockUuid();
        listing.pendingSync = false;
      }
      this.commit(['marketplace']);
      return listing;
    } catch (err) {
      State.marketplace = State.marketplace.filter(l => l.id !== tempId);
      State.currentUser.listingsCount = Math.max(0, (State.currentUser.listingsCount || 0) - 1);
      this.commit(['marketplace', 'dashboard']);
      throw err;
    }
  },

  /** Delete marketplace listing. */
  async deleteListing(listingId) {
    const idx = State.marketplace.findIndex(l => l.id === listingId);
    if (idx === -1) throw new Error('Listing not found.');
    
    const originalListing = [...State.marketplace];

    // Optimistic Delete
    State.marketplace.splice(idx, 1);
    State.currentUser.listingsCount = Math.max(0, (State.currentUser.listingsCount || 0) - 1);
    this.commit(['marketplace']);

    try {
      if (this._mode === 'supabase') {
        const { error } = await this._supabase
          .from('marketplace')
          .delete()
          .eq('id', listingId);
        if (error) throw error;
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      State.marketplace = originalListing;
      State.currentUser.listingsCount = State.currentUser.listingsCount + 1;
      this.commit(['marketplace']);
      throw err;
    }
  },


  // ═══════════════════════════════════════════════════════════════════
  //  MEETUPS
  // ═══════════════════════════════════════════════════════════════════

  /** Create meetup. */
  async createMeetup(meetupData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const hostedCount = State.meetups.filter(
      m => m.host && m.host.name === State.currentUser.name
    ).length;
    if (hostedCount >= 1) {
      throw new Error('You can only host 1 active meetup at a time.');
    }

    const tempId = mockUuid();
    const newMeetup = {
      id: tempId,
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

    try {
      if (this._mode === 'supabase') {
        const { data, error } = await this._supabase
          .from('meetups')
          .insert({
            title: meetupData.title,
            date: meetupData.date,
            time: meetupData.time,
            location: meetupData.location,
            lat: meetupData.lat,
            lng: meetupData.lng,
            description: meetupData.description || '',
            image: meetupData.image || null,
            host_id: State.currentUser.id,
            status: 'approved'
          })
          .select('*, host:profiles(*)')
          .single();

        if (error) throw error;

        const idx = State.meetups.findIndex(m => m.id === tempId);
        if (idx !== -1) {
          State.meetups[idx] = {
            id: data.id,
            title: data.title,
            date: data.date,
            time: data.time,
            location: data.location,
            lat: data.lat,
            lng: data.lng,
            description: data.description,
            image: data.image,
            host: { name: data.host.name, avatar: data.host.avatar },
            attendees: [data.host.avatar],
            attendeeNames: [data.host.name],
            comments: [],
            status: data.status
          };
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        newMeetup.id = mockUuid();
        newMeetup.pendingSync = false;
      }
      this.commit(['meetups']);
      return newMeetup;
    } catch (err) {
      State.meetups = State.meetups.filter(m => m.id !== tempId);
      this.commit(['meetups', 'map', 'dashboard']);
      throw err;
    }
  },

  /** Toggle attendance (RSVP) with rollback. */
  async toggleAttendance(meetupId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const meetup = State.meetups.find(m => m.id === meetupId);
    if (!meetup) throw new Error('Meetup not found.');
    if (!meetup.attendeeNames) meetup.attendeeNames = [];
    if (!meetup.attendees) meetup.attendees = [];

    const nameIdx = meetup.attendeeNames.indexOf(State.currentUser.name);
    const originalNames = [...meetup.attendeeNames];
    const originalAvatars = [...meetup.attendees];

    // Optimistic Update
    if (nameIdx > -1) {
      meetup.attendeeNames.splice(nameIdx, 1);
      meetup.attendees = meetup.attendees.filter(a => a !== State.currentUser.avatar);
    } else {
      meetup.attendeeNames.push(State.currentUser.name);
      meetup.attendees.push(State.currentUser.avatar);
    }
    this.commit(['meetups']);

    try {
      if (this._mode === 'supabase') {
        if (nameIdx > -1) {
          const { error } = await this._supabase
            .from('meetup_attendees')
            .delete()
            .eq('meetup_id', meetupId)
            .eq('profile_id', State.currentUser.id);
          if (error) throw error;
        } else {
          const { error } = await this._supabase
            .from('meetup_attendees')
            .insert({ meetup_id: meetupId, profile_id: State.currentUser.id });
          if (error) throw error;
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      this._persist();
      return nameIdx === -1;
    } catch (err) {
      // Rollback
      meetup.attendeeNames = originalNames;
      meetup.attendees = originalAvatars;
      this.commit(['meetups']);
      throw err;
    }
  },

  /** Comment on meetup. */
  async addMeetupComment(meetupId, text) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!text || !text.trim()) throw new Error('Comment cannot be empty.');

    const meetup = State.meetups.find(m => m.id === meetupId);
    if (!meetup) throw new Error('Meetup not found.');
    if (!meetup.comments) meetup.comments = [];

    const comment = {
      id: mockUuid(),
      author: State.currentUser.name,
      avatar: State.currentUser.avatar,
      text: text.trim(),
      time: 'Just now'
    };

    meetup.comments.push(comment);
    this.commit(['meetups']);
    return comment;
  },

  /** Delete meetup. */
  async deleteMeetup(meetupId) {
    const idx = State.meetups.findIndex(m => m.id === meetupId);
    if (idx === -1) throw new Error('Meetup not found.');
    const removed = State.meetups.splice(idx, 1)[0];
    this.commit(['meetups', 'map']);
    return removed;
  },


  // ═══════════════════════════════════════════════════════════════════
  //  MESSAGING
  // ═══════════════════════════════════════════════════════════════════

  /** Send chat message. */
  async sendMessage(username, text, options = {}) {
    if (!State.isSignedIn) throw new Error('auth_required');

    if (!State.chats) State.chats = {};
    if (!State.chats[username]) State.chats[username] = [];

    const tempId = mockUuid();
    const newMsg = {
      id: tempId,
      sender: State.currentUser.name,
      text,
      isImage: options.isImage || false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reaction: null,
      status: 'sent'
    };

    State.chats[username].push(newMsg);
    this.commit(['chats', 'contacts']);

    try {
      if (this._mode === 'supabase') {
        const { data: recipient, error: userError } = await this._supabase
          .from('profiles')
          .select('id')
          .eq('name', username)
          .single();

        if (userError) throw userError;

        const { data, error } = await this._supabase
          .from('messages')
          .insert({
            sender_id: State.currentUser.id,
            receiver_id: recipient.id,
            text: options.isImage ? null : text,
            image: options.isImage ? text : null,
            status: 'sent'
          })
          .select()
          .single();

        if (error) throw error;

        const idx = State.chats[username].findIndex(m => m.id === tempId);
        if (idx !== -1) {
          State.chats[username][idx].id = data.id;
          State.chats[username][idx].status = data.status;
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        newMsg.id = mockUuid();
      }

      // Simulate delivery/read status locally
      setTimeout(() => {
        const msg = State.chats[username].find(m => m.id === newMsg.id);
        if (msg) {
          msg.status = 'delivered';
          this.commit(['chats']);
        }
      }, 1500);

      setTimeout(() => {
        const msg = State.chats[username].find(m => m.id === newMsg.id);
        if (msg) {
          msg.status = 'read';
          this.commit(['chats']);
        }
      }, 3000);

      return newMsg;
    } catch (err) {
      State.chats[username] = State.chats[username].filter(m => m.id !== tempId);
      this.commit(['chats', 'contacts']);
      throw err;
    }
  },

  /** React to message. */
  async reactToMessage(username, msgId, emoji) {
    const messages = State.chats[username] || [];
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return null;

    const originalReaction = msg.reaction;

    // Optimistic Update
    msg.reaction = emoji || null;
    this.commit(['chats']);

    try {
      if (this._mode === 'supabase') {
        const { error } = await this._supabase
          .from('messages')
          .update({ heart_reaction: emoji === '❤️' })
          .eq('id', msgId);
        if (error) throw error;
      }
      return msg;
    } catch (err) {
      msg.reaction = originalReaction;
      this.commit(['chats']);
      throw err;
    }
  },


  // ═══════════════════════════════════════════════════════════════════
  //  TRIBES
  // ═══════════════════════════════════════════════════════════════════

  /** Send message in tribe live chat. */
  async sendTribeChat(tribeId, text) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!text || !text.trim()) return null;

    if (!State.tribeChats) State.tribeChats = {};
    if (!State.tribeChats[tribeId]) State.tribeChats[tribeId] = [];

    const msg = {
      id: mockUuid(),
      author: State.currentUser.name,
      avatar: State.currentUser.avatar,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    State.tribeChats[tribeId].push(msg);
    this._persist();
    return msg;
  },

  /** Join tribe. */
  async joinTribe(tribeId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const tribe = State.tribes.find(t => t.id === tribeId);
    if (!tribe) throw new Error('Tribe not found.');
    if (!tribe.members) tribe.members = [];

    const wasMember = tribe.members.includes(State.currentUser.name);

    if (!wasMember) {
      tribe.members.push(State.currentUser.name);
      tribe.memberCount = (tribe.memberCount || 0) + 1;
    }
    this.commit(['tribes']);

    try {
      if (this._mode === 'supabase') {
        // Connect database join mapping
      }
      return tribe;
    } catch (err) {
      if (!wasMember) {
        tribe.members = tribe.members.filter(m => m !== State.currentUser.name);
        tribe.memberCount = Math.max(0, (tribe.memberCount || 0) - 1);
      }
      this.commit(['tribes']);
      throw err;
    }
  },

  /** Leave tribe. */
  async leaveTribe(tribeId) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const tribe = State.tribes.find(t => t.id === tribeId);
    if (!tribe) throw new Error('Tribe not found.');
    if (!tribe.members) tribe.members = [];

    const wasMember = tribe.members.includes(State.currentUser.name);

    tribe.members = tribe.members.filter(m => m !== State.currentUser.name);
    tribe.memberCount = Math.max(0, (tribe.memberCount || 0) - 1);
    this.commit(['tribes']);

    try {
      if (this._mode === 'supabase') {
        // Connect database leave mapping
      }
      return tribe;
    } catch (err) {
      if (wasMember) {
        tribe.members.push(State.currentUser.name);
        tribe.memberCount = tribe.memberCount + 1;
      }
      this.commit(['tribes']);
      throw err;
    }
  },


  // ═══════════════════════════════════════════════════════════════════
  //  PROFILES & SOCIAL
  // ═══════════════════════════════════════════════════════════════════

  /** Toggle follow. */
  async toggleFollow(username) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (username === State.currentUser.name) throw new Error('Cannot follow yourself.');

    if (!State.currentUser.friends) State.currentUser.friends = [];

    const idx = State.currentUser.friends.indexOf(username);
    const originalFriends = [...State.currentUser.friends];

    if (idx > -1) {
      State.currentUser.friends.splice(idx, 1);
    } else {
      State.currentUser.friends.push(username);
    }
    this.commit(['feed', 'dashboard', 'profile']);

    try {
      if (this._mode === 'supabase') {
        // Sync social link mapping
      }
      return idx === -1;
    } catch (err) {
      State.currentUser.friends = originalFriends;
      this.commit(['feed', 'dashboard', 'profile']);
      throw err;
    }
  },

  /** Block user. */
  async blockUser(username) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (username === State.currentUser.name) throw new Error('You cannot block yourself.');

    if (!State.currentUser.blockedUsers) State.currentUser.blockedUsers = [];
    
    const wasBlocked = State.currentUser.blockedUsers.includes(username);
    if (!wasBlocked) {
      State.currentUser.blockedUsers.push(username);
    }
    this.commit(['feed', 'dashboard', 'currentTab']);

    try {
      if (this._mode === 'supabase') {
        // block user sync mapping
      }
      return true;
    } catch (err) {
      if (!wasBlocked) {
        State.currentUser.blockedUsers = State.currentUser.blockedUsers.filter(u => u !== username);
      }
      this.commit(['feed', 'dashboard', 'currentTab']);
      throw err;
    }
  },

  /** Flag item. */
  async flagItem(type, id) {
    if (!State.isSignedIn) throw new Error('auth_required');

    let target = null;
    if (type === 'post') target = State.posts.find(p => String(p.id) === String(id));
    else if (type === 'spot') target = State.spots.find(s => s.id === id);
    else if (type === 'listing') target = State.marketplace.find(l => l.id === id);
    else if (type === 'meetup') target = State.meetups.find(m => m.id === id);
    else if (type === 'thread') target = State.forum.find(t => t.id === id);

    if (target) {
      const prevFlags = target.flags_count;
      const prevStatus = target.status;

      target.flags_count = (target.flags_count || 0) + 1;
      if (target.flags_count >= 3) {
        target.status = 'hidden_flagged';
      }

      try {
        if (this._mode === 'supabase') {
          const { error } = await this._supabase
            .from('reports')
            .insert({
              reporter_id: State.currentUser.id,
              content_type: type,
              content_id: id
            });
          if (error) throw error;
        }
        this._persist();
      } catch (err) {
        target.flags_count = prevFlags;
        target.status = prevStatus;
        throw err;
      }
    }
    return target;
  },

  /** Add guestbook comment. */
  async addGuestbookComment(targetUsername, text) {
    if (!State.isSignedIn) throw new Error('auth_required');
    if (!text || !text.trim()) throw new Error('Comment cannot be empty.');

    const targetUser = State.users.find(u => u.name === targetUsername);
    if (!targetUser) throw new Error('User not found.');
    if (!targetUser.profileComments) targetUser.profileComments = [];

    const comment = {
      id: mockUuid(),
      user: State.currentUser.name,
      avatar: State.currentUser.avatar || 'avatar_bob',
      text: text.trim(),
      time: 'Just now'
    };

    targetUser.profileComments.unshift(comment);

    if (targetUsername !== State.currentUser.name) {
      if (!targetUser.notifications) targetUser.notifications = [];
      targetUser.notifications.unshift({
        id: `notif-${Date.now()}`,
        content: `💬 ${State.currentUser.name} left a comment on your profile guestbook: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        time: "Just now",
        read: false
      });
    }

    this._persist();
    return comment;
  },

  /** Update profile. */
  async updateProfile(profileData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const prevProfile = { ...State.currentUser };

    Object.assign(State.currentUser, profileData);

    const userInList = State.users.find(u => u.name === State.currentUser.name);
    if (userInList) {
      Object.assign(userInList, profileData);
    }
    this.commit(['profile', 'feed', 'dashboard']);

    try {
      if (this._mode === 'supabase') {
        const { error } = await this._supabase
          .from('profiles')
          .update({
            name: profileData.name,
            avatar: profileData.avatar,
            bio: profileData.bio,
            rig: profileData.rig,
            solar: profileData.solar,
            power: profileData.power,
            water: profileData.water
          })
          .eq('id', State.currentUser.id);
        if (error) throw error;
      }
      return State.currentUser;
    } catch (err) {
      // Rollback
      Object.assign(State.currentUser, prevProfile);
      if (userInList) Object.assign(userInList, prevProfile);
      this.commit(['profile', 'feed', 'dashboard']);
      throw err;
    }
  },


  // ═══════════════════════════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════════════════════════

  /** Sign up a new user. */
  async signUp(userData) {
    if (this._mode === 'supabase') {
      const { data, error } = await this._supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            handle: userData.handle
          }
        }
      });
      if (error) throw error;
      return data;
    } else {
      State.users.push(userData);
      State.currentUser = { ...userData };
      State.isSignedIn = true;
      this.commit(['profile', 'feed', 'dashboard']);
      return userData;
    }
  },

  /** Sign in with Google OAuth */
  async signInWithGoogle() {
    if (this._mode === 'supabase') {
      const { data, error } = await this._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return data;
    } else {
      // Mock Google Sign In
      let user = State.users.find(u => u.handle === "@google_traveler");
      if (!user) {
        user = {
          name: "Google Traveler",
          handle: "@google_traveler",
          email: "google.traveler@gmail.com",
          avatar: "avatar_surf",
          bio: "Signed in via Google Auth.",
          role: "admin",
          showRigProfile: true,
          rig: "Adventure Van",
          solar: "300W Solar",
          power: "200Ah Lithium",
          water: "20 Gal Fresh",
          gallery: [],
          visitedSpots: [],
          friends: [],
          reputation: 5,
          givenRepTo: []
        };
        State.users.push(user);
      }
      
      State.currentUser = { ...user };
      State.isSignedIn = true;
      this._persist();
      return State.currentUser;
    }
  },

  /** Sign in. */
  async signIn(identifier, password) {
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

  /** Sign out. */
  async signOut() {
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

  /** Create work & stay job listing. */
  async createJob(jobData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const tempId = mockUuid();
    const job = {
      id: tempId,
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

    try {
      if (this._mode === 'supabase') {
        // Supabase jobs mapping insertion
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        job.id = mockUuid();
        job.pendingSync = false;
      }
      this.commit(['jobs']);
      return job;
    } catch (err) {
      State.jobs = State.jobs.filter(j => j.id !== tempId);
      this.commit(['jobs']);
      throw err;
    }
  },

  /** Delete job. */
  async deleteJob(jobId) {
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

  /** Create booking. */
  async createBooking(bookingData) {
    if (!State.isSignedIn) throw new Error('auth_required');

    const booking = {
      id: mockUuid(),
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

  /** Push notification. */
  async notify(content) {
    if (!State.notifications) State.notifications = [];
    State.notifications.unshift({
      id: mockUuid(),
      content,
      time: 'Just now',
      read: false
    });
    this._persist();
  },

  /** Mark all read. */
  async markAllNotificationsRead() {
    if (State.notifications) {
      State.notifications.forEach(n => n.read = true);
      this._persist();
    }
  }
};

// Make globally accessible
window.Backend = Backend;
