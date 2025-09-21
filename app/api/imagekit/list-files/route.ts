// app/api/imagekit/list-files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import ImageKit from 'imagekit'

// Initialize ImageKit
let imagekit: ImageKit | null = null

function getImageKit() {
  if (!imagekit) {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error('ImageKit credentials not found in environment variables')
    }

    imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    })
  }
  return imagekit
}

export async function POST(request: NextRequest) {
  try {
    console.log('ImageKit list-files endpoint hit')
    
    // Parse request body and log everything
    const body = await request.json()
    console.log('Full request body:', JSON.stringify(body, null, 2))
    
    const { folderPath } = body  // Changed from 'folder' to 'folderPath'
    
    console.log('Requested folder path:', folderPath)

    // Get ImageKit instance
    const ik = getImageKit()
    
    // Format folder path for ImageKit
    // ImageKit expects folder paths to start with / and end with /
    let folderPath_formatted = folderPath || '/'
    
    // Ensure path starts with /
    if (!folderPath_formatted.startsWith('/')) {
      folderPath_formatted = '/' + folderPath_formatted
    }
    
    // Ensure path ends with / for folder searching
    if (!folderPath_formatted.endsWith('/')) {
      folderPath_formatted = folderPath_formatted + '/'
    }
    
    console.log('Formatted folder path for ImageKit:', folderPath_formatted)
    
    // List files from ImageKit using the path parameter
    const files = await ik.listFiles({
      path: folderPath_formatted,
      type: 'file',
      limit: 1000,
      sort: 'ASC_CREATED'
    })
    
    console.log(`Found ${files.length} files in folder: ${folderPath_formatted}`)
    
    // Remove the manual folder filtering since we're using path parameter
    const folderFiles = files
    
    console.log(`Found ${files.length} files in ImageKit`)
    
    // Filter for image files only
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff']
    const imageFiles = folderFiles.filter((file: any) => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      return imageExtensions.includes(extension)
    })
    
    console.log(`Filtered to ${imageFiles.length} image files`)
    
    // Transform files to match Gallery Manager expected format
    const transformedFiles = imageFiles.map((file: any) => {
      const baseUrl = file.url
      
      return {
        filename: file.name,
        path: baseUrl, // Full ImageKit URL
        fileId: file.fileId, // ImageKit unique identifier
        thumbnailUrl: `${baseUrl}?tr=w-96,h-96,c-maintain_ratio,f-webp,q-80`,
        blurDataURL: `${baseUrl}?tr=bl-10,w-20,h-20,q-30,f-webp`,
        previewUrl: `${baseUrl}?tr=w-120,h-120,c-maintain_ratio,f-webp,q-85`,
        width: file.width || 0,
        height: file.height || 0,
        size: file.size || 0,
        folder: file.filePath,
        caption: '', // Will be managed by TinaCMS
        alt: file.name.replace(/\.[^/.]+$/, ''), // Filename without extension as default alt
        tags: file.tags || []
      }
    })
    
    console.log('Transformed files:', transformedFiles.length)
    
    return NextResponse.json({
      success: true,
      images: transformedFiles,  // Changed from 'files' to 'images' to match frontend expectation
      count: transformedFiles.length
    })
    
  } catch (error: any) {
    console.error('ImageKit API Error:', error)
    
    // More detailed error response
    const errorMessage = error.message || 'Unknown error'
    const errorDetails = {
      message: errorMessage,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list ImageKit files',
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}