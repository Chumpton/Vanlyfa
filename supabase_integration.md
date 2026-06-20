# Supabase Integration Guide for Vanlyfa

This document outlines the steps to migrate the Vanlyfa application from a purely client-side data layer (`localStorage` + in-memory state) to a persistent backend using **Supabase**.

---

## 1. Prerequisites & Setup

1. **Create a Supabase Project**:
   - Go to [Supabase](https://supabase.com) and create a new project.
2. **Apply the SQL Schema**:
   - Open the **SQL Editor** in the Supabase Dashboard.
   - Copy the contents of [supabase_schema.sql](file:///c:/Users/campw/Desktop/VanLyfa/supabase_schema.sql) and run it to set up tables, foreign keys, triggers, and Row Level Security (RLS) policies.
3. **Include the Supabase JS Library**:
   - In [index.html](file:///c:/Users/campw/Desktop/VanLyfa/index.html), add the CDN script tag before `index.js`:
     ```html
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     ```

---

## 2. Initialize the Supabase Client

At the top of [index.js](file:///c:/Users/campw/Desktop/VanLyfa/index.js), initialize the Supabase client:

```javascript
// Replace with your actual project URL and public anon key from the Supabase dashboard API settings
const SUPABASE_URL = 'https://your-supabase-project.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## 3. Refactoring Data Access (Async Operations)

Since Supabase runs asynchronous network requests, the data loading logic in `index.js` needs to use `async/await`. 

### A. Authentication & Current User
Instead of mock current user setup:
```javascript
// Sign Up/Sign In user
async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showToast(error.message, 'error');
  
  // Set current user details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
    
  State.currentUser = profile;
  updateSidebarProfileWidget();
}
```

### B. Loading All Content (Dashboard, Marketplace, Forum)
Instead of relying on hardcoded arrays:
```javascript
async function loadAppData() {
  // Fetch Spots
  const { data: spots } = await supabase.from('spots').select('*, profiles(*)');
  State.spots = spots;

  // Fetch Feed Posts & Comments
  const { data: posts } = await supabase.from('posts').select('*, profiles(*)').order('created_at', { ascending: false });
  State.posts = posts;

  // Fetch Forum Threads
  const { data: threads } = await supabase.from('forum_threads').select('*, profiles(*)');
  State.forum = threads;

  // Render active tab UI
  renderActiveTab();
}
```

### C. Creating / Adding Content
Example: Vouching/Saving a spot:
```javascript
async function saveNewSpot() {
  const title = document.getElementById('spot-title').value.trim();
  const category = document.getElementById('spot-category').value;
  const lat = parseFloat(document.getElementById('spot-lat').value);
  const lng = parseFloat(document.getElementById('spot-lng').value);
  const desc = document.getElementById('spot-desc').value.trim();

  const { data, error } = await supabase.from('spots').insert({
    title,
    category,
    lat,
    lng,
    description: desc,
    author_id: State.currentUser.id
  }).select();

  if (error) {
    showToast("Error saving spot: " + error.message, 'error');
    return;
  }

  showToast("Spot published successfully!", "success");
  closeModal('modal-add-spot');
  loadAppData(); // Refresh map/feed items
}
```

---

## 4. Real-time Messaging (Direct Messages)

To make the Floating Chatboxes feel alive with real-time communications without polling, listen to Supabase’s **Realtime Channel**:

```javascript
// Subscribe to new messages
const messageSubscription = supabase
  .channel('public:messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    const newMessage = payload.new;
    
    // Check if message belongs to one of our open chat windows
    if (newMessage.receiver_id === State.currentUser.id || newMessage.sender_id === State.currentUser.id) {
      // Find corresponding local chat session and push
      const chatPartnerId = newMessage.sender_id === State.currentUser.id ? newMessage.receiver_id : newMessage.sender_id;
      const chatSession = State.chats.find(c => c.partnerId === chatPartnerId);
      
      if (chatSession) {
        chatSession.history.push({
          id: newMessage.id,
          sender: newMessage.sender_id === State.currentUser.id ? 'me' : 'them',
          text: newMessage.text,
          image: newMessage.image,
          heartReaction: newMessage.heart_reaction,
          timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        
        // Rerender chat windows UI
        renderActiveChats();
      }
    }
  })
  .subscribe();
```

To send a message via Supabase:
```javascript
async function sendSupabaseMessage(partnerId, text, image = null) {
  const { data, error } = await supabase.from('messages').insert({
    sender_id: State.currentUser.id,
    receiver_id: partnerId,
    text: text,
    image: image
  });

  if (error) {
    showToast("Failed to send message: " + error.message, 'error');
  }
}
```

---

## 5. Storage (Profile Pictures & Gallery Uploads)

Currently, uploads are processed as base64 data URLs. In the future, you should create a Supabase **Storage Bucket** named `vanlife-media`:

```javascript
async function uploadToStorage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${State.currentUser.id}/${fileName}`;

  let { error: uploadError } = await supabase.storage
    .from('vanlife-media')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  // Get public serving URL
  const { data } = supabase.storage.from('vanlife-media').getPublicUrl(filePath);
  return data.publicUrl;
}
```
Use this returned public URL to save to `profiles.avatar` or append to `profiles.gallery` array!
