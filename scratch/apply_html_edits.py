path = 'index.html'
content = open(path, encoding='utf-8').read()

# 1. Sidebar Nav
orig_sidebar = """        <div class="nav-item" data-tab="profile">
          <i data-lucide="user"></i>
          <span>My Profile</span>
        </div>"""

new_sidebar = """        <div class="nav-item" data-tab="profile">
          <i data-lucide="user"></i>
          <span>My Profile</span>
        </div>
        <div class="nav-item" data-tab="admin" id="sidebar-admin-tab" style="display: none;">
          <i data-lucide="shield-alert"></i>
          <span>Admin Panel</span>
        </div>"""

# 2. Admin Pane placement
orig_pane = """          </div>
          
        </div>
      </section>"""

# Since there are multiple section closes, we want to target the one that ends the profile pane.
# Let's target with some profile-specific context:
orig_profile_end = """            <!-- Moochdocking Bookings (Owner only) -->
            <div class="profile-card-section" id="profile-bookings-section" style="display: none;">
              <h3>Moochdocking Bookings</h3>
              <div class="visited-spots-list" id="profile-bookings-list" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>
          
        </div>
      </section>"""

new_profile_end = """            <!-- Moochdocking Bookings (Owner only) -->
            <div class="profile-card-section" id="profile-bookings-section" style="display: none;">
              <h3>Moochdocking Bookings</h3>
              <div class="visited-spots-list" id="profile-bookings-list" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <!-- TAB: ADMIN PANEL -->
      <section class="tab-content-pane" id="pane-admin">
        <div style="padding: 24px; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--text-charcoal);">Admin Moderation Board</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--muted-text);">Review and approve pending posts, listings, spots, and meetups.</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <select id="admin-filter-type" style="padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); font-size: 12px;" onchange="renderAdminPanel()">
                <option value="all">All Content Types</option>
                <option value="post">Posts Only</option>
                <option value="marketplace">Marketplace Listings</option>
                <option value="spot">Vouched Spots</option>
                <option value="meetup">Caravan Meetups</option>
              </select>
            </div>
          </div>

          <div class="admin-table-container" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm); overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; min-width: 600px;">
              <thead>
                <tr style="background: var(--bg-sand); border-bottom: 1px solid var(--border-color); color: var(--text-charcoal); font-weight: 700;">
                  <th style="padding: 12px 16px;">Type</th>
                  <th style="padding: 12px 16px;">Author / Seller</th>
                  <th style="padding: 12px 16px;">Content Details</th>
                  <th style="padding: 12px 16px;">Submitted</th>
                  <th style="padding: 12px 16px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-pending-list">
                <!-- Dynamically populated rows -->
              </tbody>
            </table>
          </div>
        </div>
      </section>"""

# 3. Marketplace Safety Warning Modal
orig_safety_modal = """  <!-- Modal: Create Listing -->
  <div class="modal-overlay" id="modal-add-listing">"""

new_safety_modal = """  <!-- Modal: Marketplace Safety Warning -->
  <div class="modal-overlay" id="modal-market-safety">
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="flex items-center gap-sm m-0" style="color: var(--accent-green); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="shield-alert" style="width: 20px; height: 20px;"></i>
          <span>Marketplace Safety Agreement</span>
        </h3>
        <button class="modal-close-btn" onclick="closeModal('modal-market-safety')"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
        <p style="font-size: 13px; color: var(--muted-text); line-height: 1.4; margin: 0;">
          To ensure a safe trading environment for all campervans and nomads, please review and check the following safety rules before listing items or contacting sellers:
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
          <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 12px; cursor: pointer; user-select: none; color: var(--text-main);">
            <input type="checkbox" class="safety-check" style="margin-top: 2px; accent-color: var(--accent-green);">
            <span>I will not send funds via wire transfer, CashApp, or Venmo before inspecting the item or vehicle in person.</span>
          </label>
          <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 12px; cursor: pointer; user-select: none; color: var(--text-main);">
            <input type="checkbox" class="safety-check" style="margin-top: 2px; accent-color: var(--accent-green);">
            <span>I agree to meet in a public, well-lit place (e.g., supermarket or ranger station parking lot) for exchanges.</span>
          </label>
          <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 12px; cursor: pointer; user-select: none; color: var(--text-main);">
            <input type="checkbox" class="safety-check" style="margin-top: 2px; accent-color: var(--accent-green);">
            <span>I will verify vehicle titles, VIN numbers, and registration paperwork in person for all rig transactions.</span>
          </label>
          <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 12px; cursor: pointer; user-select: none; color: var(--text-main);">
            <input type="checkbox" class="safety-check" style="margin-top: 2px; accent-color: var(--accent-green);">
            <span>I understand that Vanlyfa does not process transactions and is not responsible for trade outcomes.</span>
          </label>
        </div>
      </div>
      <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
        <button class="btn btn-cancel" onclick="closeModal('modal-market-safety')">Cancel</button>
        <button class="btn btn-primary" id="btn-agree-safety" disabled style="opacity: 0.5;">I Agree &amp; Continue</button>
      </div>
    </div>
  </div>

  <!-- Modal: Create Listing -->
  <div class="modal-overlay" id="modal-add-listing">"""

# 4. Scripts section
orig_scripts = """  <script src="components/jobs.js"></script>
  <script src="view.js"></script>"""

new_scripts = """  <script src="components/jobs.js"></script>
  <script src="components/admin.js"></script>
  <script src="view.js"></script>"""

content = content.replace(orig_sidebar, new_sidebar)
content = content.replace(orig_profile_end, new_profile_end)
content = content.replace(orig_safety_modal, new_safety_modal)
content = content.replace(orig_scripts, new_scripts)

open(path, 'w', encoding='utf-8').write(content)
print("Updated index.html successfully!")
