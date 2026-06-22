filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Target for crop workspace
crop_target = """          <span id="profile-photo-upload-status" style="font-size: 11px; color: var(--muted-text); text-align: center;"></span>"""
crop_replacement = """          <span id="profile-photo-upload-status" style="font-size: 11px; color: var(--muted-text); text-align: center;"></span>
          
          <!-- Crop Workspace -->
          <div id="avatar-crop-workspace" style="display: none; flex-direction: column; align-items: center; gap: 8px; margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.15); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
            <canvas id="avatar-crop-canvas" width="200" height="200" style="border-radius: 50%; border: 2px solid var(--accent-green); cursor: move; background: #333;"></canvas>
            <div style="display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 4px;">
              <i data-lucide="zoom-out" style="width: 14px; height: 14px; color: var(--muted-text);"></i>
              <input type="range" id="avatar-crop-zoom" min="0.1" max="3.0" step="0.05" value="1.0" style="flex-grow: 1; accent-color: var(--accent-green);">
              <i data-lucide="zoom-in" style="width: 14px; height: 14px; color: var(--muted-text);"></i>
            </div>
            <span style="font-size: 10px; color: var(--muted-text); text-align: center;">Drag photo inside circle to position</span>
          </div>"""

# 2. Target for handles
handles_target = """        <div class="form-row">
          <div class="form-group">
            <label for="edit-profile-power">Battery Power</label>
            <input type="text" id="edit-profile-power" placeholder="e.g. 200Ah Lithium">
          </div>
          <div class="form-group">
            <label for="edit-profile-water">Water Capacity</label>
            <input type="text" id="edit-profile-water" placeholder="e.g. 20 Gallons">
          </div>
        </div>"""

handles_replacement = """        <div class="form-row">
          <div class="form-group">
            <label for="edit-profile-power">Battery Power</label>
            <input type="text" id="edit-profile-power" placeholder="e.g. 200Ah Lithium">
          </div>
          <div class="form-group">
            <label for="edit-profile-water">Water Capacity</label>
            <input type="text" id="edit-profile-water" placeholder="e.g. 20 Gallons">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="edit-profile-instagram"><i data-lucide="instagram" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i>Instagram Handle</label>
            <input type="text" id="edit-profile-instagram" placeholder="e.g. wanderlust_bob">
          </div>
          <div class="form-group">
            <label for="edit-profile-tiktok"><i data-lucide="music" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i>TikTok Handle</label>
            <input type="text" id="edit-profile-tiktok" placeholder="e.g. bob_on_the_road">
          </div>
        </div>"""

if crop_target not in content:
    print("Error: crop_target not found in index.html")
    exit(1)

if handles_target not in content:
    print("Error: handles_target not found in index.html")
    exit(1)

content = content.replace(crop_target, crop_replacement, 1)
content = content.replace(handles_target, handles_replacement, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html profile cropper and handles markup added successfully!")
