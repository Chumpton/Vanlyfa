/* ==========================================================================
   VANLYFA COMPONENT: LAYOUT-MODALS.JS
   ========================================================================== */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

function openMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (drawer) {
    drawer.style.display = 'flex';
    setTimeout(() => {
      drawer.classList.add('open');
    }, 50);
  }
  if (backdrop) {
    backdrop.style.display = 'block';
    setTimeout(() => {
      backdrop.classList.add('active');
    }, 50);
  }
  // Sync profile details inside drawer
  const drawerAvatar = document.getElementById('mobile-drawer-user-avatar');
  const drawerName = document.getElementById('mobile-drawer-user-name');
  const drawerHandle = document.getElementById('mobile-drawer-user-handle');
  if (State.isSignedIn) {
    if (drawerAvatar) drawerAvatar.src = getAvatarSrc(State.currentUser.avatar);
    if (drawerName) drawerName.innerText = State.currentUser.name;
    if (drawerHandle) drawerHandle.innerText = State.currentUser.handle;
  } else {
    if (drawerAvatar) drawerAvatar.src = getAvatarSrc('avatar_guest');
    if (drawerName) drawerName.innerText = "Guest Nomad";
    if (drawerHandle) drawerHandle.innerText = "Sign in to post";
  }
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (drawer) {
    drawer.classList.remove('open');
    setTimeout(() => {
      if (!drawer.classList.contains('open')) {
        drawer.style.display = 'none';
      }
    }, 300);
  }
  if (backdrop) {
    backdrop.classList.remove('active');
    setTimeout(() => {
      if (!backdrop.classList.contains('active')) {
        backdrop.style.display = 'none';
      }
    }, 300);
  }
}

function openMobileActionMenu() {
  const menu = document.getElementById('mobile-action-menu');
  if (menu) {
    menu.style.display = 'flex';
    setTimeout(() => {
      menu.classList.add('open');
    }, 50);
  }
}

function closeMobileActionMenu() {
  const menu = document.getElementById('mobile-action-menu');
  if (menu) {
    menu.classList.remove('open');
    setTimeout(() => {
      if (!menu.classList.contains('open')) {
        menu.style.display = 'none';
      }
    }, 300);
  }
}

function updateDesktopChatContainerLayout() {
  const isDashboard = State.activeTab === 'dashboard';
  const layout = document.querySelector('.dashboard-layout');
  const isFeedShelved = layout && layout.classList.contains('feed-shelved');
  
  if (isDashboard && !isFeedShelved) {
    document.body.classList.add('dashboard-feed-active');
  } else {
    document.body.classList.remove('dashboard-feed-active');
  }
}

function openAboutModal() {
  openModal('modal-about');
  history.pushState({ modal: 'about' }, '');
}
