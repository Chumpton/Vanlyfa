import re

content = open('index.js', encoding='utf-8').read()
methods = ['saveNewFeedTabPost', 'saveNewListing', 'saveNewSpot', 'saveNewMeetup']

for m in methods:
    match = re.search(r'function\s+' + m, content)
    if match:
        start_idx = match.start()
        # Find closing brace of function
        brace_count = 0
        end_idx = -1
        for i in range(start_idx, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        start_line = content[:start_idx].count('\n') + 1
        end_line = content[:end_idx].count('\n') + 1
        print(f"{m}: lines {start_line} to {end_line}")
