/* ==========================================================================
   VANLYFA COMPONENT: JOBS.JS
   ========================================================================== */

function renderJobsList() {
  const grid = document.getElementById('jobs-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const durationFilter = document.getElementById('job-filter-duration').value;
  const locationFilter = document.getElementById('job-filter-location').value.trim().toLowerCase();
  const query = State.searchQuery;

  if (!State.jobs) State.jobs = [];

  const filtered = State.jobs.filter(job => {
    const matchesQuery = job.title.toLowerCase().includes(query) || 
                         job.description.toLowerCase().includes(query) ||
                         job.location.toLowerCase().includes(query);
    const matchesDuration = durationFilter === 'all' || job.duration.toLowerCase().includes(durationFilter.toLowerCase().replace('short term (', '').replace('medium term (', '').replace('long term (', '').replace(')', ''));
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter);

    return matchesQuery && matchesDuration && matchesLocation;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:64px; color:var(--muted-text);">No work & stay opportunities found.</div>`;
    return;
  }

  filtered.forEach(job => {
    const card = document.createElement('div');
    card.className = 'market-card job-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.style.height = '100%';
    card.innerHTML = `
      <div class="market-details" style="padding: 16px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="market-badge" style="position: static; background: rgba(34, 139, 34, 0.15); color: #228B22; border: 1px solid #228B22; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 700;">${job.duration}</span>
            <span style="font-size: 11px; font-weight: 600; color: var(--muted-text);">${job.location}</span>
          </div>
          <h3 class="market-title" style="margin-bottom: 6px; font-size: 14px; font-weight: 700;">${job.title}</h3>
          <p style="font-size: 12px; color: var(--text-main); line-height: 1.4; margin-bottom: 12px;">${job.description}</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted-text);">Labor Required:</span> <strong style="color: var(--text-main);">${job.labor}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted-text);">Compensation:</span> <strong style="color: var(--accent-green);">${job.comp}</strong></div>
        </div>
      </div>
      <div class="market-footer" style="padding: 12px; border-top: 1px solid var(--border-color); background: var(--bg-sand); display: flex; justify-content: space-between; align-items: center; border-bottom-left-radius: var(--radius-md); border-bottom-right-radius: var(--radius-md);">
        <div class="market-seller" onclick="viewUserProfile('${job.host.name}')" style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <img src="${getAvatarSrc(job.host.avatar)}" alt="${job.host.name}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;" />
          <span style="font-size: 10px; font-weight: 600; color: var(--text-main);">${getUserRoleMarkup(job.host.name)}</span>
        </div>
        ${job.host.name !== State.currentUser.name ? `
          <button class="btn btn-sm btn-primary" onclick="contactHost('${job.host.name}', 'Work & Stay: ${job.title}')" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="message-square" style="width: 12px; height: 12px;"></i>
            <span>Message</span>
          </button>
        ` : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  lucide.createIcons();
}

function saveNewJobListing(event) {
  event.preventDefault();
  if (!requireAuth()) return;

  const title = document.getElementById('job-title').value.trim();
  const location = document.getElementById('job-location').value.trim();
  const duration = document.getElementById('job-duration').value.trim();
  const labor = document.getElementById('job-labor').value.trim();
  const comp = document.getElementById('job-comp').value.trim();
  const description = document.getElementById('job-desc').value.trim();

  if (!title || !location || !duration || !labor || !comp || !description) {
    showToast("Please fill all fields.", "error");
    return;
  }

  const newJob = {
    id: `job-${Date.now()}`,
    title: title,
    location: location,
    duration: duration,
    labor: labor,
    comp: comp,
    description: description,
    host: {
      name: State.currentUser.name,
      avatar: State.currentUser.avatar || 'avatar_bob'
    },
    date: new Date().toISOString().split('T')[0]
  };

  State.jobs.push(newJob);
  saveStateToStorage();
  closeModal('modal-add-job');
  
  // reset form
  document.getElementById('add-job-form').reset();
  
  if (State.activeTab === 'jobs') {
    renderJobsList();
  }
  showToast("Work & Stay opportunity posted successfully!", "success");
}
