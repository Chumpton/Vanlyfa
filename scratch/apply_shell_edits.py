path = 'components/app-shell.js'
content = open(path, encoding='utf-8').read()

# 1. switchTab intercept
orig_switch_intercept = """function switchTab(tabName, isPopState = false) {
  if (tabName === 'messages') {
    if (!requireAuth()) return;
  }"""

new_switch_intercept = """function switchTab(tabName, isPopState = false) {
  if (tabName === 'messages') {
    if (!requireAuth()) return;
  }
  if (tabName === 'admin') {
    if (!requireAuth()) return;
    if (State.currentUser.role !== 'admin') {
      showToast("Access Denied. Admins only.", "error");
      switchTab('dashboard');
      return;
    }
  }"""

# 2. titles and placeholders
orig_titles = """  // Update Page Title
  const titles = {
    dashboard: "Dashboard",
    feed: "Community Feed",
    marketplace: "Marketplace",
    tribes: "Tribes",
    meetups: "Meetups",
    forum: "Forum Board",
    messages: "Direct Messages",
    profile: "Rig Profile",
    jobs: "Work & Stay"
  };
  document.getElementById('page-display-title').innerText = titles[tabName] || "Vanlyfa";
  
  // Update search bar context / placeholder
  const placeholders = {
    dashboard: "Search vouched spots or posts...",
    feed: "Search feed posts...",
    marketplace: "Search rigs, items, services...",
    tribes: "Search caravaneer groups...",
    meetups: "Search fireside gatherings...",
    forum: "Search discussion topics...",
    messages: "Search direct messages...",
    profile: "Search profile specs...",
    jobs: "Search farm help, camp hosts, carpentry..."
  };"""

new_titles = """  // Update Page Title
  const titles = {
    dashboard: "Dashboard",
    feed: "Community Feed",
    marketplace: "Marketplace",
    tribes: "Tribes",
    meetups: "Meetups",
    forum: "Forum Board",
    messages: "Direct Messages",
    profile: "Rig Profile",
    jobs: "Work & Stay",
    admin: "Admin Moderation Panel"
  };
  document.getElementById('page-display-title').innerText = titles[tabName] || "Vanlyfa";
  
  // Update search bar context / placeholder
  const placeholders = {
    dashboard: "Search vouched spots or posts...",
    feed: "Search feed posts...",
    marketplace: "Search rigs, items, services...",
    tribes: "Search caravaneer groups...",
    meetups: "Search fireside gatherings...",
    forum: "Search discussion topics...",
    messages: "Search direct messages...",
    profile: "Search profile specs...",
    jobs: "Search farm help, camp hosts, carpentry...",
    admin: "Filter pending moderation..."
  };"""

# 3. updateHeaderActionButton profile hide check
orig_header_action_hide = """  if (State.activeTab === 'profile') {
    btn.style.display = 'none';
    searchBar.style.visibility = 'hidden';
    return;
  }"""

new_header_action_hide = """  if (State.activeTab === 'profile' || State.activeTab === 'admin') {
    btn.style.display = 'none';
    searchBar.style.visibility = 'hidden';
    return;
  }"""

# 4. renderCurrentTab cases
orig_render_tab = """    case "profile":
      renderUserProfile();
      break;
    case "jobs":
      renderJobsList();
      break;
  }"""

new_render_tab = """    case "profile":
      renderUserProfile();
      break;
    case "jobs":
      renderJobsList();
      break;
    case "admin":
      renderAdminPanel();
      break;
  }"""

# 5. triggerMainActionButtonModal intercept
orig_trigger_modal = """function triggerMainActionButtonModal() {
  if (!requireAuth()) return;
  const modals = {
    dashboard: 'modal-add-spot',
    feed: 'modal-add-post',
    marketplace: 'modal-add-listing',
    tribes: 'modal-add-tribe',
    meetups: 'modal-add-meetup',
    forum: 'modal-add-thread',
    jobs: 'modal-add-job'
  };
  const modalId = modals[State.activeTab];
  if (modalId) openModal(modalId);
}"""

new_trigger_modal = """function triggerMainActionButtonModal() {
  if (!requireAuth()) return;
  const modals = {
    dashboard: 'modal-add-spot',
    feed: 'modal-add-post',
    marketplace: 'modal-add-listing',
    tribes: 'modal-add-tribe',
    meetups: 'modal-add-meetup',
    forum: 'modal-add-thread',
    jobs: 'modal-add-job'
  };
  const modalId = modals[State.activeTab];
  if (modalId) {
    if (State.activeTab === 'marketplace') {
      if (localStorage.getItem('vanlyfa_marketplace_agreed') !== 'true') {
        State._onMarketplaceSafetyAgreed = () => {
          openModal('modal-add-listing');
        };
        openModal('modal-market-safety');
        return;
      }
    }
    openModal(modalId);
  }
}"""

content = content.replace(orig_switch_intercept, new_switch_intercept)
content = content.replace(orig_titles, new_titles)
content = content.replace(orig_header_action_hide, new_header_action_hide)
content = content.replace(orig_render_tab, new_render_tab)
content = content.replace(orig_trigger_modal, new_trigger_modal)

open(path, 'w', encoding='utf-8').write(content)
print("Updated app-shell.js successfully!")
