const fs = require('fs');

const filePath = 'c:/Users/Lenovo/excellencecoachinghub-main/job-portal/src/pages/AllJobsPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix ALL template literal issues with alpha function
content = content.replace(
  /boxShadow: `([^`]+)\$\{alpha\(theme\.palette\.primary\.main, ([0-9.]+)\)\}`/g,
  "boxShadow: '$1' + alpha(theme.palette.primary.main, $2)"
);

fs.writeFileSync(filePath, content);
console.log('Fixed all template literal syntax errors in AllJobsPage.tsx');