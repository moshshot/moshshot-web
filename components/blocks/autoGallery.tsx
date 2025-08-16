import React, { useState, useEffect } from 'react'

import GalleryManager from '@/tina/fields/galleryManager'

export const AutoGallery = ({ data }) => {
  // Debug: Log the incoming data
  console.log('AutoGallery received data:', data)
  console.log('Images array:', data?.images)
  
  const {
    folderPath,
    images: savedImages = [], // Images with captions from CMS
    layout = 'masonry',
    columns = 'three',
    gap = 'medium',
    lightbox = true,
  } = data

  const [galleryImages, setGalleryImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGalleryImages()
  }, [folderPath, savedImages])

  const loadGalleryImages = async () => {
    console.log('loadGalleryImages called')
    console.log('savedImages:', savedImages)
    console.log('folderPath:', folderPath)
    
    // If we have saved images with paths, use those directly
    if (savedImages && savedImages.length > 0) {
      console.log('Using saved images from CMS:', savedImages)
      // Make sure each image has a path
      const validImages = savedImages.filter(img => img.path || img.url)
      console.log('Valid images with paths:', validImages)
      
      if (validImages.length > 0) {
        setGalleryImages(validImages)
        setLoading(false)
        return
      }
    }

    // Otherwise, fetch from folder
    if (folderPath) {
      console.log('No saved images, loading from folder:', folderPath)
      setLoading(true)
      try {
        const response = await fetch(`/api/scan-folder?folder=${encodeURIComponent(folderPath)}`)
        const data = await response.json()
        console.log('API response:', data)
        
        if (data.images && data.images.length > 0) {
          setGalleryImages(data.images)
        } else {
          console.log('No images found in API response')
          setGalleryImages([])
        }
      } catch (error) {
        console.error('Failed to load images:', error)
        setGalleryImages([])
      } finally {
        setLoading(false)
      }
    } else {
      console.log('No folder path provided')
      setLoading(false)
    }
  }


  const columnClasses = {
    two: layout === 'masonry' ? 'columns-1 md:columns-2' : 'grid grid-cols-1 md:grid-cols-2',
    three: layout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    four: layout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-4' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }

  const gapClasses = {
    small: layout === 'masonry' ? 'gap-2' : 'gap-2',
    medium: layout === 'masonry' ? 'gap-4' : 'gap-4',
    large: layout === 'masonry' ? 'gap-6' : 'gap-6',
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading gallery...</div>
      </div>
    )
  }

  if (!folderPath) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No folder path specified</p>
      </div>
    )
  }

  if (galleryImages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No images found in folder: {folderPath}</p>
        <p className="text-sm mt-2">Make sure images are in /public/{folderPath}</p>
      </div>
    )
  }

  console.log('Rendering', galleryImages.length, 'images')

  return (
    <>
      <div className={`${columnClasses[columns]} ${gapClasses[gap]}`}>
        {galleryImages.map((image, index) => (
          <div
            key={image.filename || index}
            className={`group relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer ${
              layout === 'grid' 
                ? 'aspect-square' 
                : layout === 'masonry'
                ? 'mb-4 break-inside-avoid'
                : ''
            }`}
            onClick={() => lightbox && setSelectedImage(image)}
          >
            <img
              src={image.path}
              alt={image.alt || image.caption || `Gallery image ${index + 1}`}
              className={`
                w-full transition-transform duration-300 group-hover:scale-105
                ${layout === 'grid' 
                  ? 'h-full object-cover' 
                  : 'h-auto object-cover block'
                }
              `}
              onError={(e) => {
                console.error(`Failed to load image: ${image.path}`)
              }}
            />
            
            {/* Caption Overlay */}
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-sm font-medium">{image.caption}</p>
                {image.tags && image.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {image.tags.map(tag => (
                      <span key={tag} className="text-xs text-white/70">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <figure className="max-w-7xl" onClick={e => e.stopPropagation()}>
            <img
              src={selectedImage.path}
              alt={selectedImage.alt || selectedImage.caption}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {selectedImage.caption && (
              <figcaption className="text-white text-center mt-4">
                {selectedImage.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  )
}
export const AutoDetectGallerySchema = {
  name: 'autoGallery',
  label: 'Smart Gallery',
  ui: {
    defaultItem: {
      folderPath: '',  // Add default
      layout: 'masonry',
      columns: 'three',
      gap: 'medium',
      lightbox: true,
      images: []
    }
  },
  fields: [
    {
      type: 'string',
      label: 'Gallery Folder',
      name: 'folderPath',
      description: 'Path relative to /public (e.g., "gallery/portfolio")',
      // REMOVED: required: true - this was causing the GraphQL error
    },
    {
      type: 'string',
      label: 'Layout Style',
      name: 'layout',
      options: [
        { label: 'Masonry (Pinterest-style)', value: 'masonry' },
        { label: 'Grid (Square crops)', value: 'grid' },
        { label: 'Slider', value: 'slider' },
      ],
    },
    {
      type: 'string',
      label: 'Columns',
      name: 'columns',
      options: [
        { label: '2 Columns', value: 'two' },
        { label: '3 Columns', value: 'three' },
        { label: '4 Columns', value: 'four' },
      ],
    },
    {
      type: 'string',
      label: 'Spacing',
      name: 'gap',
      options: [
        { label: 'Small (8px)', value: 'small' },
        { label: 'Medium (16px)', value: 'medium' },
        { label: 'Large (24px)', value: 'large' },
      ],
    },
    {
      type: 'boolean',
      label: 'Enable Lightbox',
      name: 'lightbox',
      description: 'Click images to view fullscreen',
    },
    {
      type: 'object',
      label: 'Image Captions',
      name: 'images',
      list: true,
      fields: [
        {
          type: 'string',
          name: 'filename',
          label: 'Filename',
        },
        {
          type: 'string',
          name: 'path',
          label: 'Path',
        },
        {
          type: 'string',
          name: 'caption',
          label: 'Caption',
        },
        {
          type: 'string',
          name: 'alt',
          label: 'Alt Text',
        },
        {
          type: 'string',
          name: 'tags',
          label: 'Tags',
          list: true,
        },
      ],
      ui: {
        component: GalleryManager,
      },
    },
  ],
}
