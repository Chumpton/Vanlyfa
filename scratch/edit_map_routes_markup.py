filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """              <!-- Floating Zoom Out / Show All Button -->
              <button class="btn" id="map-show-all-btn" title="Show Entire US Map" style="position: absolute; top: 16px; left: 136px; z-index: 1000; box-shadow: var(--shadow-md); padding: 8px; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); cursor: pointer;">
                <i data-lucide="globe" style="width: 16px; height: 16px;"></i>
              </button>"""

replacement = """              <!-- Floating Zoom Out / Show All Button -->
              <button class="btn" id="map-show-all-btn" title="Show Entire US Map" style="position: absolute; top: 16px; left: 136px; z-index: 1000; box-shadow: var(--shadow-md); padding: 8px; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); cursor: pointer;">
                <i data-lucide="globe" style="width: 16px; height: 16px;"></i>
              </button>

              <!-- Floating Routes Button -->
              <button class="btn" id="map-routes-toggle-btn" title="Featured Routes" style="position: absolute; top: 16px; left: 176px; z-index: 1000; box-shadow: var(--shadow-md); padding: 8px; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); cursor: pointer;">
                <i data-lucide="map" style="width: 16px; height: 16px;"></i>
              </button>

              <!-- Floating Featured Routes Panel (Collapsible) -->
              <div id="map-routes-panel" style="position: absolute; top: 60px; left: 56px; z-index: 1000; background: rgba(30, 30, 30, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 12px; width: 240px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); color: white; display: none; flex-direction: column; transition: all 0.3s ease; gap: 8px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; color: var(--accent-green); display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="map" style="width: 14px; height: 14px;"></i>
                  <span>Featured Routes</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <button class="btn btn-sm" onclick="drawRouteOnMap('moab-loop')" style="background: rgba(255,255,255,0.06); color: white; border: 1px solid rgba(255,255,255,0.1); justify-content: flex-start; text-align: left; padding: 6px 10px; font-size: 11px; width: 100%; cursor: pointer;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; margin-right: 6px;"></span>
                    <span>Moab Overland Loop (150mi)</span>
                  </button>
                  <button class="btn btn-sm" onclick="drawRouteOnMap('baja-trek')" style="background: rgba(255,255,255,0.06); color: white; border: 1px solid rgba(255,255,255,0.1); justify-content: flex-start; text-align: left; padding: 6px 10px; font-size: 11px; width: 100%; cursor: pointer;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; margin-right: 6px;"></span>
                    <span>Baja Pacific Highway (1000mi)</span>
                  </button>
                  <button class="btn btn-sm" onclick="drawRouteOnMap('pch-route')" style="background: rgba(255,255,255,0.06); color: white; border: 1px solid rgba(255,255,255,0.1); justify-content: flex-start; text-align: left; padding: 6px 10px; font-size: 11px; width: 100%; cursor: pointer;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-right: 6px;"></span>
                    <span>Pacific Coast Highway (950mi)</span>
                  </button>
                </div>
                <button class="btn btn-xs btn-cancel" onclick="clearActiveRoute()" style="font-size: 10px; padding: 4px; justify-content: center; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); width: 100%; margin-top: 4px; cursor: pointer;">Clear Route</button>
              </div>"""

if target not in content:
    print("Error: target globe button not found in index.html")
    exit(1)

content = content.replace(target, replacement, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html routes button and panel markup added successfully!")
