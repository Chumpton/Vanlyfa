filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\index.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target_start = "function saveUserProfileEdit() {"
target_end = '  showToast("Profile details updated!", "success");\n}'

start_idx = content.find(target_start)
end_idx = content.find(target_end)

if start_idx == -1 or end_idx == -1:
    print("Error: saveUserProfileEdit boundaries not found in index.js")
    exit(1)

# Include target_end in replaced section
end_idx += len(target_end)

replacement = """function saveUserProfileEdit() {
  const oldName = State.currentUser.name;
  const newName = document.getElementById('edit-profile-name').value.trim() || oldName;
  
  let user = State.users.find(u => u.name === oldName);
  if (!user) {
    user = { name: oldName };
    State.users.push(user);
  }
  
  user.name = newName;
  user.bio = document.getElementById('edit-profile-bio').value.trim() || user.bio;
  user.rig = document.getElementById('edit-profile-rig').value.trim() || user.rig;
  user.solar = document.getElementById('edit-profile-solar').value.trim() || user.solar;
  user.power = document.getElementById('edit-profile-power').value.trim() || user.power;
  user.water = document.getElementById('edit-profile-water').value.trim() || user.water;
  
  // Crop avatar processing
  const cropWorkspace = document.getElementById('avatar-crop-workspace');
  if (cropWorkspace && (cropWorkspace.style.display === 'flex' || cropWorkspace.style.display === 'block')) {
    const canvas = document.getElementById('avatar-crop-canvas');
    if (canvas && typeof drawCropImage === 'function') {
      // Draw image WITHOUT the helper circle border before export
      drawCropImage(canvas, false);
      const croppedDataUrl = canvas.toDataURL("image/png");
      user.avatar = croppedDataUrl;
      State.currentUser.avatar = croppedDataUrl;
      
      // Store offsets
      if (typeof cropState !== 'undefined') {
        user.avatar_crop = { x: cropState.x, y: cropState.y, zoom: cropState.zoom };
        State.currentUser.avatar_crop = user.avatar_crop;
      }
      
      // Reset workspace
      cropWorkspace.style.display = 'none';
      document.getElementById('edit-profile-avatar-upload').value = '';
    }
  } else {
    user.avatar = State.currentUser.avatar;
  }
  
  // Social handles
  user.instagram_handle = document.getElementById('edit-profile-instagram').value.trim();
  user.tiktok_handle = document.getElementById('edit-profile-tiktok').value.trim();
  
  State.currentUser.name = newName;
  State.currentUser.bio = user.bio;
  State.currentUser.rig = user.rig;
  State.currentUser.solar = user.solar;
  State.currentUser.power = user.power;
  State.currentUser.water = user.water;
  State.currentUser.instagram_handle = user.instagram_handle;
  State.currentUser.tiktok_handle = user.tiktok_handle;
  
  if (oldName !== newName) {
    State.posts.forEach(p => {
      if (p.author.name === oldName) p.author.name = newName;
      if (p.comments) {
        p.comments.forEach(c => {
          if (c.user === oldName) c.user = newName;
        });
      }
    });
    State.spots.forEach(s => {
      if (s.author.name === oldName) s.author.name = newName;
    });
    State.meetups.forEach(m => {
      if (m.host.name === oldName) m.host.name = newName;
    });
    State.marketplace.forEach(m => {
      if (m.seller.name === oldName) m.seller.name = newName;
    });
    State.forum.forEach(t => {
      if (t.author.name === oldName) t.author.name = newName;
      if (t.replies) {
        t.replies.forEach(r => {
          if (r.author.name === oldName) r.author.name = newName;
        });
      }
    });
    State.users.forEach(u => {
      if (u.friends) {
        u.friends = u.friends.map(f => f === oldName ? newName : f);
      }
    });
  }
  
  saveStateToStorage();
  updateSidebarProfileWidget();
  renderUserProfile();
  closeModal('modal-edit-profile');
  
  const statusSpan = document.getElementById('profile-photo-upload-status');
  if (statusSpan) statusSpan.innerText = "";
  
  showToast("Profile details updated!", "success");
}"""

content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.js saveUserProfileEdit updated successfully!")
