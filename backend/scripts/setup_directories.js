const fs = require('fs');
const path = require('path');

// Create necessary directories for file uploads
const directories = [
  'uploads',
  'uploads/proposals',
  'uploads/profiles',
];

console.log('Creating upload directories...\n');

directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', '..', dir);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } else {
    console.log(`✓ Already exists: ${dir}`);
  }
});

console.log('\n✅ All directories ready!');
