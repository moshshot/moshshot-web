// scripts/generate-color-data.js
const { getPlaiceholder } = require('plaiceholder');
const fs = require('fs');
const path = require('path');

function getAllImageFiles(dir, baseDir) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  let imageFiles = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      imageFiles = imageFiles.concat(getAllImageFiles(fullPath, baseDir));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        const relativePath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
        imageFiles.push({
          absolutePath: fullPath,
          relativePath: relativePath
        });
      }
    }
  }
  
  return imageFiles;
}

async function generateColorData() {
  const publicDir = path.join(process.cwd(), 'public');
  const colorData = {};
  
  const foldersToScan = [
    'uploads/photography',
  ];
  
  let totalImages = 0;
  
  for (const folder of foldersToScan) {
    const folderPath = path.join(publicDir, folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`Skipping ${folder} - doesn't exist`);
      continue;
    }
    
    console.log(`\nScanning ${folder}...`);
    const imageFiles = getAllImageFiles(folderPath, publicDir);
    console.log(`Found ${imageFiles.length} images`);
    
    for (const { absolutePath, relativePath } of imageFiles) {
      try {
        const buffer = fs.readFileSync(absolutePath);
        const { color, metadata } = await getPlaiceholder(buffer);
        
        // Extract hex color from the color object
        let hexColor = '#6b7280'; // fallback gray
        
        if (color) {
          if (color.hex) {
            hexColor = color.hex;
          } else if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
            // Convert RGB to hex
            const toHex = (n) => {
              const hex = Math.round(n).toString(16).padStart(2, '0');
              return hex;
            };
            hexColor = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
          }
        }
        
        colorData[relativePath] = {
          color: hexColor,
          width: metadata.width,
          height: metadata.height
        };
        
        totalImages++;
        console.log(`✓ ${path.basename(relativePath)}: ${hexColor}`);
      } catch (error) {
        console.error(`✗ Failed for ${relativePath}:`, error.message);
      }
    }
  }
  
  // Save color data
  const outputPath = path.join(publicDir, 'color-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(colorData, null, 2));
  
  console.log(`\n✅ Saved to ${outputPath}`);
  console.log(`Generated colors for ${totalImages} images`);
  
  // Show sample of colors
  console.log('\nSample colors:');
  Object.entries(colorData).slice(0, 5).forEach(([path, data]) => {
    console.log(`  ${path.split('/').pop()}: ${data.color}`);
  });
}

generateColorData();