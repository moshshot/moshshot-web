import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder')
  
  if (!folder) {
    return NextResponse.json({ error: 'Folder parameter required' }, { status: 400 })
  }

  // Sanitize the folder path to prevent directory traversal
  const sanitizedFolder = folder.replace(/\.\./g, '')
  const publicPath = path.join(process.cwd(), 'public', sanitizedFolder)
  
  if (!fs.existsSync(publicPath)) {
    return NextResponse.json({ images: [] })
  }

  try {
    const files = fs.readdirSync(publicPath)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        return imageExtensions.includes(ext)
      })
      .map(file => ({
        filename: file,
        path: `/${sanitizedFolder}/${file}`,
        name: path.basename(file, path.extname(file)),
        size: fs.statSync(path.join(publicPath, file)).size,
        modified: fs.statSync(path.join(publicPath, file)).mtime
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename))
    
    return NextResponse.json({ images })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to scan folder' }, { status: 500 })
  }
}