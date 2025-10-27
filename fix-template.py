import re

# Read the file
with open('c:/Users/Lenovo/excellencecoachinghub-main/job-portal/src/pages/AllJobsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific template literal
content = content.replace(
    'boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`',
    "boxShadow: '0 6px 16px ' + alpha(theme.palette.primary.main, 0.4)"
)

# Write the file back
with open('c:/Users/Lenovo/excellencecoachinghub-main/job-portal/src/pages/AllJobsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed template literal")