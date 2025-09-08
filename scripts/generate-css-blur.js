// scripts/generate-css-blur.js
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

async function generateCSSBlurData() {
  const publicDir = path.join(process.cwd(), 'public');
  const blurData = {};
  
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
        const { css, metadata } = await getPlaiceholder(buffer);
        
        // The css object contains backgroundImage, backgroundPosition, backgroundSize, and filter
        blurData[relativePath] = {
          css: css,
          width: metadata.width,
          height: metadata.height
        };
        
        totalImages++;
        console.log(`✓ ${path.basename(relativePath)}`);
        
        // Show first example
        if (totalImages === 1) {
          console.log('  Sample CSS:', css);
        }
      } catch (error) {
        console.error(`✗ Failed for ${relativePath}:`, error.message);
      }
    }
  }
  
  // Save blur data
  const outputPath = path.join(publicDir, 'css-blur-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(blurData, null, 2));
  
  console.log(`\n✅ Saved to ${outputPath}`);
  console.log(`Generated CSS blur for ${totalImages} images`);
}

generateCSSBlurData();