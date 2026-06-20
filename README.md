# Vanlyfa - Minimalist Van Life Community Hub

Vanlyfa is a lightweight, responsive, and minimalist community hub for van lifers. It features a live 2D map of camp spots, community updates, a marketplace, a skill trade directory, forum discussions, user profiles with image galleries, and real-time styled direct messaging.

---

## How to Run (Without a Local Server)

You do **not** need a local web server (like Node.js, Python, or Live Server) to run this application! Because the app relies entirely on browser APIs (`localStorage` + CDN dependencies), you can run it directly from your file system.

### Steps:
1. Locate the [index.html](file:///c:/Users/campw/Desktop/VanLyfa/index.html) file in your workspace.
2. Double-click [index.html](file:///c:/Users/campw/Desktop/VanLyfa/index.html) or right-click and choose **Open with** your preferred web browser (Chrome, Edge, Firefox, or Safari).
3. The page will load and function fully, including persistence of profiles, chat histories, map pins, and marketplace posts.

---

## Future Backend Integration (Supabase)

To prepare this application for production launching with a shared, persistent backend database, we have prepared complete integration blueprints:

1. **Database Schema** ([supabase_schema.sql](file:///c:/Users/campw/Desktop/VanLyfa/supabase_schema.sql)):
   - Defines tables for profiles, map spots, meetups, posts, comments, marketplace listings, skill trades, forum threads/replies, friendship relationships, and direct messages.
   - Includes Row Level Security (RLS) policies for secure client-to-database requests.
   - Features automated signup triggers to synchronize Supabase Auth users with community profiles.
   
2. **Integration Guide** ([supabase_integration.md](file:///c:/Users/campw/Desktop/VanLyfa/supabase_integration.md)):
   - Details how to link the Supabase JS library.
   - Provides code snippets to replace `localStorage` with async/await query operations.
   - Explains how to set up real-time direct messaging subscriptions and image storage buckets.

---

## Project Structure

* [index.html](file:///c:/Users/campw/Desktop/VanLyfa/index.html) - Structural templates for all tabs, modals, and drawers.
* [index.css](file:///c:/Users/campw/Desktop/VanLyfa/index.css) - Custom CSS design system, dark/light theme tokens, responsive layouts, and chat styles.
* [index.js](file:///c:/Users/campw/Desktop/VanLyfa/index.js) - App state controller, UI renderers, local storage layer, and interactive chat bot simulations.
* [VLLOGO.png](file:///c:/Users/campw/Desktop/VanLyfa/VLLOGO.png) - Official Vanlyfa community brand logo.
* [supabase_schema.sql](file:///c:/Users/campw/Desktop/VanLyfa/supabase_schema.sql) - Database table structures and access policies.
* [supabase_integration.md](file:///c:/Users/campw/Desktop/VanLyfa/supabase_integration.md) - Migration code guide.
