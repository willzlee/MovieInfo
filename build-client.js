const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting React app build process...');

// Create a temporary .env file for the build process
const envContent = `
SKIP_PREFLIGHT_CHECK=true
PUBLIC_URL=/
REACT_APP_API_URL=${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'}
`;

fs.writeFileSync('.env', envContent);
console.log('Created temporary .env file');

try {
  console.log('Building React application...');
  // Execute the build command using react-scripts
  execSync('npx react-scripts build', { stdio: 'inherit' });
  console.log('React build completed successfully!');

  // Check if build directory exists
  if (fs.existsSync(path.join(__dirname, 'build'))) {
    console.log('Build directory created and contains:');
    const files = fs.readdirSync(path.join(__dirname, 'build'));
    console.log(files);
  } else {
    console.error('Error: Build directory was not created');
  }
} catch (error) {
  console.error('Build process failed:', error.message);
  process.exit(1);
} finally {
  // Clean up the temporary .env file
  if (fs.existsSync('.env')) {
    fs.unlinkSync('.env');
    console.log('Removed temporary .env file');
  }
}

console.log('Build process completed.');