const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting GraphQL server...');
  execSync('node server/index.js', { 
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Error starting server:', error);
}