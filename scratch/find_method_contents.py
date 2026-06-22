import re

content = open('index.js', encoding='utf-8').read()
methods = ['saveNewFeedTabPost', 'saveNewListing', 'saveNewSpot', 'saveNewMeetup']

for m in methods:
    match = re.search(r'function\s+' + m + r'\s*\(.*?\)\s*\{', content)
    if match:
        start_idx = match.start()
        # Find closing brace of the function
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
        if end_idx != -1:
            print(f"--- FUNCTION: {m} ---")
            print(content[start_idx:end_idx+1])
            print("\n")
