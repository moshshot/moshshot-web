import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder')
  
  if (!folder) {
    return NextResponse.json({ error: 'Folder parameter required' }, { status: 400 })
  }

  const publicPath = path.join(process.cwd(), 'public', folder)
  
  if (!fs.existsSync(publicPath)) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
  }

  const files = fs.readdirSync(publicPath)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  
  const images = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase()
      return imageExtensions.includes(ext)
    })
    .map(file => ({
      url: `/${folder}/${file}`,
      filename: file,
      name: path.basename(file, path.extname(file))
    }))
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
  
  return NextResponse.json(images)
}