// app/api/scan-folder/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Import the blur data
let blurData: Record<string, any> = {};
try {
  const blurDataPath = path.join(process.cwd(), 'public', 'blur-data.json');
  if (fs.existsSync(blurDataPath)) {
    blurData = JSON.parse(fs.readFileSync(blurDataPath, 'utf-8'));
  }
} catch (error) {
  console.error('Failed to load blur data:', error);
}

/**
 * Recursively scan a directory for images
 */
function scanDirectoryRecursive(
  dirPath: string, 
  basePublicPath: string,
  relativePath: string = ''
): any[] {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  let images: any[] = []
  
  try {
    const items = fs.readdirSync(dirPath)
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectory
        const subRelativePath = relativePath ? `${relativePath}/${item}` : item
        images = images.concat(
          scanDirectoryRecursive(itemPath, basePublicPath, subRelativePath)
        )
      } else if (stat.isFile()) {
        // Check if it's an image
        const ext = path.extname(item).toLowerCase()
        if (imageExtensions.includes(ext)) {
          const imagePath = relativePath ? `/${relativePath}/${item}` : `/${item}`
          const fullImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
          
          // Get blur data for this specific image
          const blur = blurData[fullImagePath] || {}
          
          images.push({
            filename: item,
            path: fullImagePath,
            name: path.basename(item, ext),
            size: stat.size,
            modified: stat.mtime,
            blurDataURL: blur.blurDataURL || null,
            width: blur.width || null,
            height: blur.height || null
          })
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error)
  }
  
  return images
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder')
  
  if (!folder) {
    return NextResponse.json({ error: 'Folder parameter required' }, { status: 400 })
  }

  const sanitizedFolder = folder.replace(/\.\./g, '')
  const publicPath = path.join(process.cwd(), 'public', sanitizedFolder)
  
  if (!fs.existsSync(publicPath)) {
    return NextResponse.json({ images: [] })
  }

  try {
    // Recursively scan the directory and all subdirectories
    const images = scanDirectoryRecursive(publicPath, publicPath, sanitizedFolder)
      .sort((a, b) => a.path.localeCompare(b.path))
    
    return NextResponse.json({ images })
  } catch (error) {
    console.error('Failed to scan folder:', error)
    return NextResponse.json({ error: 'Failed to scan folder' }, { status: 500 })
  }
}