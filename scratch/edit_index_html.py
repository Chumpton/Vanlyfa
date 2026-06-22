filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = '<button type="submit" class="btn btn-primary m-t-sm w-full justify-center p-sm">Sign In</button>'
replacement = """<div style="font-size: 11px; color: var(--muted-text); margin-top: 4px; line-height: 1.4; padding: 8px 10px; background: rgba(59, 122, 87, 0.08); border-radius: var(--radius-sm); border: 1px dashed var(--accent-green-light); display: flex; flex-direction: column; gap: 2px; text-align: left;">
            <strong style="color: var(--accent-green); font-size: 12px; margin-bottom: 2px;">Sandbox Test Credentials:</strong>
            <div>• Admin: <code style="background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px;">admin</code> / <code style="background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px;">AdminPass123!</code></div>
            <div>• Bob (User): <code style="background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px;">bob</code> / <code style="background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px;">NomadPass123!</code></div>
            <div>• Clara (User): <code style="background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px;">clara</code> / <code style="background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px;">ClaraPass123!</code></div>
          </div>
          <button type="submit" class="btn btn-primary m-t-sm w-full justify-center p-sm">Sign In</button>"""

if target not in content:
    print("Error: Sign In button target not found in index.html")
    exit(1)

content = content.replace(target, replacement, 1) # replace first occurrence only

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html auth credentials card added successfully!")
