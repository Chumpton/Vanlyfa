filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """            <p id="profile-user-bio" style="font-size:13px; line-height:1.4;">Living full time in my build since 2024. Chasing weather patterns and solar power.</p>"""
replacement = """            <p id="profile-user-bio" style="font-size:13px; line-height:1.4;">Living full time in my build since 2024. Chasing weather patterns and solar power.</p>
            
            <!-- Social Handles Links -->
            <div id="profile-social-links" style="display: flex; gap: 12px; margin-top: 10px; margin-bottom: 12px; width: 100%; justify-content: center; font-size: 13px;">
              <a id="profile-link-instagram" href="#" target="_blank" style="display: none; align-items: center; gap: 4px; color: var(--accent-green); text-decoration: none;">
                <i data-lucide="instagram" style="width: 14px; height: 14px;"></i>
                <span id="profile-handle-instagram"></span>
              </a>
              <a id="profile-link-tiktok" href="#" target="_blank" style="display: none; align-items: center; gap: 4px; color: var(--accent-green); text-decoration: none;">
                <i data-lucide="music" style="width: 14px; height: 14px;"></i>
                <span id="profile-handle-tiktok"></span>
              </a>
            </div>"""

if target not in content:
    print("Error: target bio tag not found in index.html")
    exit(1)

content = content.replace(target, replacement, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html social links badges structure added successfully!")
