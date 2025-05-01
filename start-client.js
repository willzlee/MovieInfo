const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check and update package.json with browser targets to avoid prompts
const packageJsonPath = path.join(__dirname, 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.browserslist) {
    packageJson.browserslist = {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json with browserslist');
  }
} catch (error) {
  console.warn('Could not update package.json:', error.message);
}

// Create .env file to set the port
fs.writeFileSync(path.join(__dirname, '.env'), 'PORT=5000\nBROWSER=none\n');
console.log('Created .env file with PORT=5000');

try {
  console.log('Starting React client on port 5000...');
  execSync('npx react-scripts start --no-cache', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: "5000",
      BROWSER: "none",
      FORCE_COLOR: "true",
      // This disables the browser targets prompt
      REACT_APP_SKIP_BROWSER_CHECK: "true"
    }
  });
} catch (error) {
  console.error('Error starting client:', error);
}