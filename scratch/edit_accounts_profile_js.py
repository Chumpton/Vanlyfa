filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\components\accounts-profile.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Target for renderUserProfile social links
render_target = """  document.getElementById('profile-user-avatar').src = getAvatarSrc(user.avatar);
  document.getElementById('profile-user-name').innerText = user.name;
  document.getElementById('profile-user-handle').innerText = user.handle || `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
  document.getElementById('profile-reputation-score').innerText = `Reputation: ${user.reputation || 0}`;
  document.getElementById('profile-user-bio').innerText = user.bio;"""

render_replacement = """  document.getElementById('profile-user-avatar').src = getAvatarSrc(user.avatar);
  document.getElementById('profile-user-name').innerText = user.name;
  document.getElementById('profile-user-handle').innerText = user.handle || `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
  document.getElementById('profile-reputation-score').innerText = `Reputation: ${user.reputation || 0}`;
  document.getElementById('profile-user-bio').innerText = user.bio;
  
  // Render social links
  const igLink = document.getElementById('profile-link-instagram');
  const igHandle = document.getElementById('profile-handle-instagram');
  const ttLink = document.getElementById('profile-link-tiktok');
  const ttHandle = document.getElementById('profile-handle-tiktok');
  
  if (user.instagram_handle) {
    if (igLink && igHandle) {
      igLink.style.display = 'inline-flex';
      igLink.href = `https://instagram.com/${user.instagram_handle}`;
      igHandle.innerText = `@${user.instagram_handle}`;
    }
  } else {
    if (igLink) igLink.style.display = 'none';
  }
  
  if (user.tiktok_handle) {
    if (ttLink && ttHandle) {
      ttLink.style.display = 'inline-flex';
      ttLink.href = `https://tiktok.com/@${user.tiktok_handle}`;
      ttHandle.innerText = `@${user.tiktok_handle}`;
    }
  } else {
    if (ttLink) ttLink.style.display = 'none';
  }"""

# 2. Target for openProfileEditModal prefill
modal_target = """function openProfileEditModal() {
  document.getElementById('edit-profile-name').value = State.currentUser.name;
  document.getElementById('edit-profile-bio').value = State.currentUser.bio;
  document.getElementById('edit-profile-rig').value = State.currentUser.rig;
  document.getElementById('edit-profile-solar').value = State.currentUser.solar;
  document.getElementById('edit-profile-power').value = State.currentUser.power;
  document.getElementById('edit-profile-water').value = State.currentUser.water;
  openModal('modal-edit-profile');
}"""

modal_replacement = """function openProfileEditModal() {
  document.getElementById('edit-profile-name').value = State.currentUser.name;
  document.getElementById('edit-profile-bio').value = State.currentUser.bio;
  document.getElementById('edit-profile-rig').value = State.currentUser.rig;
  document.getElementById('edit-profile-solar').value = State.currentUser.solar;
  document.getElementById('edit-profile-power').value = State.currentUser.power;
  document.getElementById('edit-profile-water').value = State.currentUser.water;
  
  // Populate social handles
  document.getElementById('edit-profile-instagram').value = State.currentUser.instagram_handle || "";
  document.getElementById('edit-profile-tiktok').value = State.currentUser.tiktok_handle || "";
  
  // Reset crop workspace
  const workspace = document.getElementById('avatar-crop-workspace');
  if (workspace) workspace.style.display = 'none';
  const fileInput = document.getElementById('edit-profile-avatar-upload');
  if (fileInput) fileInput.value = '';
  
  openModal('modal-edit-profile');
}"""

if render_target not in content:
    print("Error: render_target not found in accounts-profile.js")
    exit(1)

if modal_target not in content:
    print("Error: modal_target not found in accounts-profile.js")
    exit(1)

content = content.replace(render_target, render_replacement, 1)
content = content.replace(modal_target, modal_replacement, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("components/accounts-profile.js updated successfully!")
