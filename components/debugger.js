/* ==========================================================================
   VANLYFA COMPONENT: DEBUGGER.JS (Developer & Caching Inspector)
   ========================================================================== */

(function() {
  // Initialize debug logging history
  window._debugLogs = window._debugLogs || [];
  window._apiReads = window._apiReads || 0;
  window._apiWrites = window._apiWrites || 0;
  window._cacheHits = window._cacheHits || 0;
  window._cacheMisses = window._cacheMisses || 0;

  window.addDebugLog = function(msg) {
    const timestamp = new Date().toLocaleTimeString();
    window._debugLogs.unshift(`[${timestamp}] ${msg}`);
    if (window._debugLogs.length > 30) window._debugLogs.pop();
    if (window._updateDebugConsole) window._updateDebugConsole();
  };

  // Inject styles for the debug console
  const style = document.createElement('style');
  style.textContent = `
    .vanlyfa-debug-trigger {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #0f1117;
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(16, 185, 129, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .vanlyfa-debug-trigger:hover {
      transform: scale(1.1) rotate(45deg);
      box-shadow: 0 4px 25px rgba(16, 185, 129, 0.4);
      color: #34d399;
    }
    .vanlyfa-debug-panel {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      width: 380px;
      max-height: 520px;
      background: rgba(15, 17, 23, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      color: #e2e8f0;
      font-family: 'Courier New', Courier, monospace;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: bottom right;
      opacity: 0;
      transform: scale(0.85) translateY(20px);
      pointer-events: none;
    }
    .vanlyfa-debug-panel.active {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
    }
    .vanlyfa-debug-header {
      background: #090d16;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(16, 185, 129, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .vanlyfa-debug-title {
      font-weight: bold;
      color: #10b981;
      font-size: 13px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .vanlyfa-debug-close {
      cursor: pointer;
      color: #94a3b8;
      transition: color 0.2s;
    }
    .vanlyfa-debug-close:hover {
      color: #ef4444;
    }
    .vanlyfa-debug-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      font-size: 11px;
    }
    .vanlyfa-debug-section {
      margin-bottom: 16px;
    }
    .vanlyfa-debug-section-title {
      color: #f59e0b;
      font-weight: bold;
      margin-bottom: 8px;
      border-bottom: 1px dashed rgba(245, 158, 11, 0.3);
      padding-bottom: 2px;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    .vanlyfa-debug-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .vanlyfa-debug-key {
      color: #94a3b8;
    }
    .vanlyfa-debug-val {
      font-weight: bold;
      color: #38bdf8;
    }
    .vanlyfa-debug-val.success {
      color: #10b981;
    }
    .vanlyfa-debug-val.error {
      color: #f43f5e;
    }
    .vanlyfa-debug-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 12px;
    }
    .vanlyfa-debug-btn {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 10px;
      text-align: center;
      transition: all 0.2s;
    }
    .vanlyfa-debug-btn:hover {
      background: #10b981;
      color: #0f1117;
      border-color: #10b981;
    }
    .vanlyfa-debug-log-console {
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      height: 120px;
      overflow-y: auto;
      padding: 8px;
      font-size: 9px;
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .vanlyfa-debug-log-line {
      word-break: break-all;
      line-height: 1.3;
    }
  `;
  document.head.appendChild(style);

  // Create elements
  const trigger = document.createElement('div');
  trigger.className = 'vanlyfa-debug-trigger';
  trigger.innerHTML = '<i data-lucide="terminal" style="width: 18px; height: 18px;"></i>';
  trigger.title = 'Open Developer Console';
  document.body.appendChild(trigger);

  const panel = document.createElement('div');
  panel.className = 'vanlyfa-debug-panel';
  panel.innerHTML = `
    <div class="vanlyfa-debug-header">
      <div class="vanlyfa-debug-title">
        <i data-lucide="terminal" style="width: 14px; height: 14px; color: #10b981;"></i>
        <span>VANLYFA DEV-CONSOLE v1.0</span>
      </div>
      <div class="vanlyfa-debug-close">
        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
      </div>
    </div>
    <div class="vanlyfa-debug-body">
      <!-- Section 1: Auth & User Session -->
      <div class="vanlyfa-debug-section">
        <div class="vanlyfa-debug-section-title">Auth & Session Status</div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Backend Mode:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-mode">Loading...</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Nomad Status:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-status">Loading...</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Current User:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-user">Loading...</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">User UUID:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-uuid" style="font-size: 9px;">Loading...</span>
        </div>
      </div>

      <!-- Section 2: Database & Operations -->
      <div class="vanlyfa-debug-section">
        <div class="vanlyfa-debug-section-title">Supabase & Database Operations</div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Network Status:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-network">Loading...</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Sync Queue Count:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-queue">Loading...</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Cumulative Reads:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-reads">0</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Cumulative Writes:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-writes">0</span>
        </div>
      </div>

      <!-- Section 3: Clever Caching -->
      <div class="vanlyfa-debug-section">
        <div class="vanlyfa-debug-section-title">Clever Caching Statistics</div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Cached Feed Keys:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-cached-keys">0</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Cache Hits:</span>
          <span class="vanlyfa-debug-val success" id="dbg-val-cache-hits">0</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Cache Misses:</span>
          <span class="vanlyfa-debug-val error" id="dbg-val-cache-misses">0</span>
        </div>
        <div class="vanlyfa-debug-row">
          <span class="vanlyfa-debug-key">Cache Hit Rate:</span>
          <span class="vanlyfa-debug-val" id="dbg-val-cache-rate">0.0%</span>
        </div>
      </div>

      <!-- Section 4: Live Console Logs -->
      <div class="vanlyfa-debug-section" style="margin-bottom: 0;">
        <div class="vanlyfa-debug-section-title">Live Log Console</div>
        <div class="vanlyfa-debug-log-console" id="dbg-log-console">
          <!-- Live log lines injected here -->
        </div>
        <div class="vanlyfa-debug-actions">
          <button class="vanlyfa-debug-btn" id="dbg-btn-toggle-net">Toggle Offline</button>
          <button class="vanlyfa-debug-btn" id="dbg-btn-clear-cache">Clear Feed Cache</button>
          <button class="vanlyfa-debug-btn" id="dbg-btn-sync-queue" style="grid-column: span 2;">Force Sync Queue</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Toggle handlers
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('active');
    updateConsoleData();
  });

  panel.querySelector('.vanlyfa-debug-close').addEventListener('click', () => {
    panel.classList.remove('active');
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) {
      panel.classList.remove('active');
    }
  });

  // Action Button Handlers
  document.getElementById('dbg-btn-toggle-net').addEventListener('click', () => {
    if (typeof State !== 'undefined') {
      State.isOffline = !State.isOffline;
      window.addDebugLog(`Simulated network state set to: ${State.isOffline ? 'OFFLINE' : 'ONLINE'}`);
      if (typeof updateConnectionUI === 'function') updateConnectionUI();
      if (!State.isOffline && typeof processSyncQueue === 'function') {
        processSyncQueue();
      }
      updateConsoleData();
    }
  });

  document.getElementById('dbg-btn-clear-cache').addEventListener('click', () => {
    if (typeof State !== 'undefined') {
      State._cachedFeeds = {};
      window._cacheHits = 0;
      window._cacheMisses = 0;
      window.addDebugLog("Cleared feed markup cache & hit metrics.");
      updateConsoleData();
      if (typeof renderCurrentTab === 'function') renderCurrentTab();
    }
  });

  document.getElementById('dbg-btn-sync-queue').addEventListener('click', () => {
    if (typeof State !== 'undefined' && typeof processSyncQueue === 'function') {
      if (State.syncQueue && State.syncQueue.length > 0) {
        window.addDebugLog(`Forcing synchronization of ${State.syncQueue.length} queued items...`);
        processSyncQueue();
      } else {
        window.addDebugLog("Sync queue is empty, nothing to sync.");
      }
      updateConsoleData();
    }
  });

  // Data update function
  function updateConsoleData() {
    if (typeof State === 'undefined' || typeof Backend === 'undefined') return;

    // Backend mode & status
    const modeEl = document.getElementById('dbg-val-mode');
    if (modeEl) {
      modeEl.textContent = String(Backend._mode).toUpperCase();
      modeEl.className = `vanlyfa-debug-val ${Backend._mode === 'supabase' ? 'success' : ''}`;
    }

    const statusEl = document.getElementById('dbg-val-status');
    if (statusEl) {
      statusEl.textContent = State.isSignedIn ? 'SIGNED IN' : 'GUEST / GONE';
      statusEl.className = `vanlyfa-debug-val ${State.isSignedIn ? 'success' : 'error'}`;
    }

    const userEl = document.getElementById('dbg-val-user');
    if (userEl) {
      userEl.textContent = State.currentUser ? `${State.currentUser.name} (${State.currentUser.handle})` : 'Guest Nomad';
    }

    const uuidEl = document.getElementById('dbg-val-uuid');
    if (uuidEl) {
      uuidEl.textContent = State.currentUser && State.currentUser.id ? State.currentUser.id : 'N/A';
    }

    // Network & Queue
    const netEl = document.getElementById('dbg-val-network');
    if (netEl) {
      netEl.textContent = State.isOffline ? 'OFFLINE (SIM)' : 'ONLINE';
      netEl.className = `vanlyfa-debug-val ${State.isOffline ? 'error' : 'success'}`;
    }

    const queueEl = document.getElementById('dbg-val-queue');
    if (queueEl) {
      const qLen = State.syncQueue ? State.syncQueue.length : 0;
      queueEl.textContent = `${qLen} pending`;
      queueEl.className = `vanlyfa-debug-val ${qLen > 0 ? 'error' : 'success'}`;
    }

    // Cumulative stats
    const readsEl = document.getElementById('dbg-val-reads');
    if (readsEl) readsEl.textContent = window._apiReads;

    const writesEl = document.getElementById('dbg-val-writes');
    if (writesEl) writesEl.textContent = window._apiWrites;

    // Caching
    const cacheKeysEl = document.getElementById('dbg-val-cached-keys');
    if (cacheKeysEl) {
      const cachedCount = State._cachedFeeds ? Object.keys(State._cachedFeeds).length : 0;
      cacheKeysEl.textContent = cachedCount;
    }

    const hitsEl = document.getElementById('dbg-val-cache-hits');
    if (hitsEl) hitsEl.textContent = window._cacheHits;

    const missesEl = document.getElementById('dbg-val-cache-misses');
    if (missesEl) missesEl.textContent = window._cacheMisses;

    const rateEl = document.getElementById('dbg-val-cache-rate');
    if (rateEl) {
      const total = window._cacheHits + window._cacheMisses;
      const rate = total > 0 ? ((window._cacheHits / total) * 100).toFixed(1) : '0.0';
      rateEl.textContent = `${rate}%`;
      rateEl.className = `vanlyfa-debug-val ${parseFloat(rate) > 50 ? 'success' : ''}`;
    }

    // Log console rendering
    const consoleEl = document.getElementById('dbg-log-console');
    if (consoleEl) {
      consoleEl.innerHTML = window._debugLogs.map(log => 
        `<div class="vanlyfa-debug-log-line">> ${log}</div>`
      ).join('');
    }
  }

  window._updateDebugConsole = updateConsoleData;

  // Render icons inside trigger and panel
  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
    updateConsoleData();
  }, 1000);

  // Poll update every 2.5 seconds to refresh stats
  setInterval(updateConsoleData, 2500);

  // Log initial startup
  window.addDebugLog("Developer console initialized. Mode: " + String(Backend._mode).toUpperCase());
})();
