import React, { useState, useEffect } from 'react'
import Masonry from 'react-masonry-css'
import GalleryManager from '@/tina/fields/galleryManager'

// Add CSS for masonry (put this in your global CSS or component)
const masonryStyles = `
  .masonry-grid {
    display: flex;
    margin-left: -16px; /* gutter size offset */
    width: auto;
  }
  .masonry-grid-column {
    padding-left: 16px; /* gutter size */
    background-clip: padding-box;
  }
  .masonry-grid-column > div {
    margin-bottom: 16px;
  }
`

export const AutoGallery = ({ data }: any) => {
  const {
    folderPath,
    images: savedImages = [],
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
    if (savedImages && savedImages.length > 0) {
      const validImages = savedImages.filter((img: any) => img.path || img.url)
      
      if (validImages.length > 0) {
        setGalleryImages(validImages)
        setLoading(false)
        return
      }
    }

    if (folderPath) {
      setLoading(true)
      try {
        const response = await fetch(`/api/scan-folder?folder=${encodeURIComponent(folderPath)}`)
        const data = await response.json()
        
        if (data.images && data.images.length > 0) {
          setGalleryImages(data.images)
        } else {
          setGalleryImages([])
        }
      } catch (error) {
        console.error('Failed to load images:', error)
        setGalleryImages([])
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const breakpointColumns = {
    two: {
      default: 2,
      768: 1,
    },
    three: {
      default: 3,
      1024: 2,
      768: 1,
    },
    four: {
      default: 4,
      1024: 3,
      768: 2,
      640: 1,
    },
  }

  const gridClasses = {
    two: 'grid grid-cols-1 md:grid-cols-2',
    three: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    four: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }

  const gapClasses = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  }

  const masonryGutters = {
    small: 8,
    medium: 16,
    large: 24,
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

  const imageElements = galleryImages.map((image: any, index: number) => (
    <div
      key={image.filename || index}
      className={`group relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer ${
        layout === 'grid' ? 'aspect-square' : ''
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
        onError={(e: any) => {
          console.error(`Failed to load image: ${image.path}`)
        }}
      />
      
      {image.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-sm font-medium">{image.caption}</p>
          {image.tags && image.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {image.tags.map((tag: string) => (
                <span key={tag} className="text-xs text-white/70">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ))

  return (
    <>
      <style>{`
        .masonry-grid {
          display: flex;
          margin-left: -${masonryGutters[gap]}px;
          width: auto;
        }
        .masonry-grid-column {
          padding-left: ${masonryGutters[gap]}px;
          background-clip: padding-box;
        }
        .masonry-grid-column > div {
          margin-bottom: ${masonryGutters[gap]}px;
        }
      `}</style>

      {layout === 'masonry' ? (
        <Masonry
          breakpointCols={breakpointColumns[columns]}
          className="masonry-grid"
          columnClassName="masonry-grid-column"
        >
          {imageElements}
        </Masonry>
      ) : (
        <div className={`${gridClasses[columns]} ${gapClasses[gap]}`}>
          {imageElements}
        </div>
      )}

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
          
          <figure className="max-w-7xl" onClick={(e: any) => e.stopPropagation()}>
            <img
              src={(selectedImage as any).path}
              alt={(selectedImage as any).alt || (selectedImage as any).caption}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {(selectedImage as any).caption && (
              <figcaption className="text-white text-center mt-4">
                {(selectedImage as any).caption}
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
      folderPath: '',
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
