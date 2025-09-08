// scripts/generate-blur-data.js
const { getPlaiceholder } = require('plaiceholder');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // You may need to install this: npm install sharp

/**
 * Recursively get all image files from a directory and its subdirectories
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative path calculation
 * @returns {Array} Array of {absolutePath, relativePath} objects
 */
function getAllImageFiles(dir, baseDir) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  let imageFiles = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      imageFiles = imageFiles.concat(getAllImageFiles(fullPath, baseDir));
    } else {
      // Check if it's an image file
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        // Calculate relative path from public directory
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

async function generateBlurDataWithSharp(imagePath) {
  try {
    // Use sharp to create a small blurred version
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Create a very small version (10px wide) and blur it
    const buffer = await image
      .resize(10, Math.round(10 * metadata.height / metadata.width))
      .blur()
      .toBuffer();
    
    // Convert to base64
    const base64 = `data:image/${metadata.format};base64,${buffer.toString('base64')}`;
    
    return {
      blurDataURL: base64,
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    console.error(`Sharp failed for ${imagePath}:`, error.message);
    return null;
  }
}

async function generateBlurData() {
  const publicDir = path.join(process.cwd(), 'public');
  const blurData = {};
  
  // Define folders to scan
  const foldersToScan = [
    'uploads/photography',
    // Add any other image folders here
  ];
  
  let totalImages = 0;
  const useSharp = false; // Set to true if you have sharp installed
  
  for (const folder of foldersToScan) {
    const folderPath = path.join(publicDir, folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`Skipping ${folder} - doesn't exist`);
      continue;
    }
    
    console.log(`\nScanning ${folder} and its subdirectories...`);
    const imageFiles = getAllImageFiles(folderPath, publicDir);
    console.log(`Found ${imageFiles.length} images in ${folder}`);
    
    for (const { absolutePath, relativePath } of imageFiles) {
      try {
        console.log(`Generating blur for ${relativePath}...`);
        
        let result;
        if (useSharp) {
          // Use sharp for potentially better compatibility
          result = await generateBlurDataWithSharp(absolutePath);
          if (!result) {
            // Fallback to plaiceholder if sharp fails
            const buffer = fs.readFileSync(absolutePath);
            const plaicResult = await getPlaiceholder(buffer, {
              size: 8, // Even smaller for better performance
            });
            result = {
              blurDataURL: plaicResult.base64,
              width: plaicResult.metadata.width,
              height: plaicResult.metadata.height
            };
          }
        } else {
          // Use plaiceholder
          const buffer = fs.readFileSync(absolutePath);
          const plaicResult = await getPlaiceholder(buffer, {
            size: 8, // Smaller size for blur placeholder
          });
          
          // Ensure the base64 string has the correct format
          let base64 = plaicResult.base64;
          if (!base64.startsWith('data:image')) {
            // If it's just the base64 string without the data URI prefix
            base64 = `data:image/jpeg;base64,${base64}`;
          }
          
          result = {
            blurDataURL: base64,
            width: plaicResult.metadata.width,
            height: plaicResult.metadata.height
          };
        }
        
        blurData[relativePath] = result;
        totalImages++;
        
        // Log first one to check format
        if (totalImages === 1) {
          console.log('Sample blur data format:', result.blurDataURL.substring(0, 50) + '...');
        }
      } catch (error) {
        console.error(`Failed to generate blur for ${relativePath}:`, error.message);
      }
    }
  }
  
  // Save to public directory
  const outputPath = path.join(publicDir, 'blur-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(blurData, null, 2));
  
  console.log(`\n✅ Blur data saved to ${outputPath}`);
  console.log(`Generated blur data for ${totalImages} images total`);
  
  // Optional: Show breakdown by directory
  const breakdown = {};
  for (const imagePath of Object.keys(blurData)) {
    const dir = path.dirname(imagePath);
    breakdown[dir] = (breakdown[dir] || 0) + 1;
  }
  
  console.log('\nBreakdown by directory:');
  for (const [dir, count] of Object.entries(breakdown)) {
    console.log(`  ${dir}: ${count} images`);
  }
}

generateBlurData();