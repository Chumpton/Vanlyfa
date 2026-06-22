import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or '.agents' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.css', '.md')):
            path = os.path.join(root, file)
            try:
                content = open(path, encoding='utf-8').read()
                if 'Backend' in content:
                    # Find line numbers
                    lines = content.split('\n')
                    for i, l in enumerate(lines):
                        if 'Backend' in l:
                            print(f"{path}: {i+1}: {l.strip()}")
            except Exception as e:
                pass
