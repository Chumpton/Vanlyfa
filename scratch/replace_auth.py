import os

filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\index.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "function handleAuthSignIn(event) {"
end_marker = "function saveUserProfileEdit() {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Error: markers not found")
    exit(1)

replacement = """function handleAuthSignIn(event) {
  event.preventDefault();
  const inputVal = document.getElementById('signin-email').value.trim();
  const passwordVal = document.getElementById('signin-password').value;
  
  if (!inputVal) return;
  
  // Normalizing input to match handle or name
  let searchName = inputVal.toLowerCase();
  if (searchName === 'bob') searchName = '@nomad_bob';
  if (searchName === 'clara') searchName = '@clara_outdoors';
  if (searchName === 'forest') searchName = '@forest_nomad';
  if (searchName === 'baja') searchName = '@baja_surfer';
  if (searchName === 'solar') searchName = '@solar_explorer';
  if (searchName === 'admin') searchName = '@admin';

  // Find user in database simulator
  let user = State.users.find(u => u.name.toLowerCase() === searchName || 
                                     u.handle.toLowerCase() === searchName ||
                                     u.handle.toLowerCase() === `@${searchName}`);
                                     
  // For testing convenience, if 'bob' or '@nomad_bob' doesn't exist in users yet, create him
  if (!user && (searchName === '@nomad_bob' || searchName === 'bob')) {
    user = {
      name: "Nomad Bob",
      handle: "@nomad_bob",
      avatar: "avatar_bob",
      bio: "Rig builder and highway traveler.",
      rig: "Camper Rig",
      solar: "200W Solar",
      power: "100Ah Lithium",
      water: "15 Gal Fresh",
      gallery: [],
      visitedSpots: [],
      friends: [],
      reputation: 5,
      givenRepTo: [],
      role: "user",
      instagram_handle: "nomad_bob",
      tiktok_handle: "nomad_bob",
      password: "NomadPass123!"
    };
    State.users.push(user);
    saveStateToStorage();
  }
  
  if (user) {
    // Password validation rules
    let expectedPassword = user.password;
    if (!expectedPassword) {
      if (user.handle === "@admin") expectedPassword = "AdminPass123!";
      else if (user.handle === "@clara_outdoors") expectedPassword = "ClaraPass123!";
      else if (user.handle === "@forest_nomad") expectedPassword = "ForestPass123!";
      else if (user.handle === "@baja_surfer") expectedPassword = "BajaPass123!";
      else if (user.handle === "@solar_explorer") expectedPassword = "SolarPass123!";
      else if (user.handle === "@nomad_bob") expectedPassword = "NomadPass123!";
      else expectedPassword = "password"; // Default fallback
    }
    
    if (passwordVal !== expectedPassword) {
      showToast("Incorrect password. Please try again.", "error");
      return;
    }
    
    State.currentUser = {
      name: user.name,
      handle: user.handle,
      avatar: user.avatar,
      bio: user.bio || "",
      rig: user.rig || "",
      solar: user.solar || "",
      power: user.power || "",
      water: user.water || "",
      reputation: user.reputation || 0,
      givenRepTo: user.givenRepTo || [],
      role: user.role || "user",
      instagram_handle: user.instagram_handle || "",
      tiktok_handle: user.tiktok_handle || "",
      avatar_crop: user.avatar_crop || { x: 0, y: 0, zoom: 1 }
    };
    State.isSignedIn = true;
    saveStateToStorage();
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast(`Welcome back, ${user.name}! (${user.role})`, "success");
    
    // Check if admin to refresh UI tabs
    if (user.role === 'admin') {
      const adminTab = document.getElementById('sidebar-admin-tab');
      if (adminTab) adminTab.style.display = 'flex';
    } else {
      const adminTab = document.getElementById('sidebar-admin-tab');
      if (adminTab) adminTab.style.display = 'none';
    }
    
    renderCurrentTab();
  } else {
    // Autocreate account for convenience in mockup
    const newUsername = inputVal;
    const newHandle = `@${inputVal.replace(/\s+/g, '_').toLowerCase()}`;
    const newUser = {
      name: newUsername,
      handle: newHandle,
      avatar: "avatar_bob",
      bio: "Living the dream on four wheels.",
      rig: "Camper Rig",
      solar: "200W Solar",
      power: "100Ah Lithium",
      water: "15 Gal Fresh",
      gallery: [],
      visitedSpots: [],
      friends: [],
      reputation: 3,
      givenRepTo: [],
      role: "user",
      instagram_handle: "",
      tiktok_handle: "",
      password: passwordVal || "password",
      avatar_crop: { x: 0, y: 0, zoom: 1 }
    };
    State.users.push(newUser);
    State.currentUser = { ...newUser };
    State.isSignedIn = true;
    saveStateToStorage();
    updateSidebarProfileWidget();
    closeModal('modal-auth-required');
    showToast(`Signed up and logged in as ${newUsername}!`, "success");
    renderCurrentTab();
  }
}

function handleAuthSignUp(event) {
  event.preventDefault();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const bio = document.getElementById('signup-bio').value.trim() || "New nomad on the road.";
  const badgeTag = "Nomad";
  
  if (!username) return;
  const handle = `@${username.replace(/\s+/g, '_').toLowerCase()}`;
  
  const existingUser = State.users.find(u => u.name.toLowerCase() === username.toLowerCase() || u.handle.toLowerCase() === handle.toLowerCase());
  if (existingUser) {
    showToast("Username already exists. Please choose another or Sign In.", "error");
    return;
  }
  
  const newUser = {
    name: username,
    handle: handle,
    avatar: "avatar_bob",
    bio: bio,
    badgeTag: badgeTag,
    rig: "Standard Camper",
    solar: "200W Solar",
    power: "100Ah AGM",
    water: "15 Gal Fresh",
    gallery: [],
    visitedSpots: [],
    friends: [],
    reputation: 5,
    givenRepTo: [],
    role: "user",
    instagram_handle: "",
    tiktok_handle: "",
    password: password,
    avatar_crop: { x: 0, y: 0, zoom: 1 }
  };
  
  State.users.push(newUser);
  State.currentUser = { ...newUser };
  State.isSignedIn = true;
  saveStateToStorage();
  updateSidebarProfileWidget();
  closeModal('modal-auth-required');
  showToast(`Welcome aboard, ${username}!`, "success");
  
  // Hide admin tab on fresh signup
  const adminTab = document.getElementById('sidebar-admin-tab');
  if (adminTab) adminTab.style.display = 'none';

  renderCurrentTab();
}

"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement successful!")
