// app/api/generate-blur/route.ts
import { getPlaiceholder } from "plaiceholder";
import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imagePath } = await request.json();
    
    if (!imagePath) {
      return NextResponse.json({ error: 'Image path required' }, { status: 400 });
    }
    
    // Security: prevent directory traversal
    const sanitizedPath = imagePath.replace(/\.\./g, '');
    const fullPath = path.join(process.cwd(), 'public', sanitizedPath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    const file = await fs.readFile(fullPath);
    const { base64, img } = await getPlaiceholder(file);
    
    return NextResponse.json({ 
      blurDataURL: base64,
      width: img.width,
      height: img.height 
    });
  } catch (error) {
    console.error('Blur generation error:', error);
    return NextResponse.json({ error: 'Failed to generate blur' }, { status: 500 });
  }
}