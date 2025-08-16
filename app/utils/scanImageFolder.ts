import fs from 'fs'
import path from 'path'

export function scanImageFolder(folderPath: string) {
  const publicPath = path.join(process.cwd(), 'public', folderPath)
  
  if (!fs.existsSync(publicPath)) {
    return []
  }

  const files = fs.readdirSync(publicPath)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  
  const images = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase()
      return imageExtensions.includes(ext)
    })
    .map(file => ({
      url: `/${folderPath}/${file}`,
      filename: file,
      name: path.basename(file, path.extname(file))
    }))
  
  return images
}