import React from 'react'

// Gallery Component
export const ImageGallery = ({ data }) => {
  const {
    images = [],
    layout = 'masonry',
    columns = 'three',
    gap = 'medium',
    lightbox = true,
    showCaptions = true
  } = data

  const [selectedImage, setSelectedImage] = React.useState(null)

  // Column classes based on selection
  const columnClasses = {
    two: 'grid-cols-1 md:grid-cols-2',
    three: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    four: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    five: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  }

  // Gap classes
  const gapClasses = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  }

  // Layout specific classes
  const getImageClasses = (image, index) => {
    if (layout === 'grid') {
      return 'aspect-square object-cover w-full h-full'
    }
    
    if (layout === 'masonry') {
      // Let images maintain their aspect ratio in masonry
      return 'w-full h-auto object-cover'
    }

    if (layout === 'mixed') {
      // Featured layout - first image is large
      if (index === 0 && images.length > 1) {
        return 'col-span-1 md:col-span-2 row-span-1 md:row-span-2 w-full h-full object-cover'
      }
      return 'w-full h-full object-cover aspect-square'
    }

    return 'w-full h-auto object-cover'
  }

  // Container classes based on layout
  const getContainerClasses = () => {
    const base = `grid ${columnClasses[columns]} ${gapClasses[gap]}`
    
    if (layout === 'mixed') {
      return `${base} auto-rows-fr`
    }
    
    return base
  }

  // Handle lightbox
  const openLightbox = (image) => {
    if (lightbox) {
      setSelectedImage(image)
    }
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  return (
    <>
      <div className={getContainerClasses()}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${
              layout === 'mixed' && index === 0 && images.length > 1 ? 'md:col-span-2 md:row-span-2' : ''
            }`}
            onClick={() => openLightbox(image)}
          >
            {/* Image */}
            <img
              src={image.url}
              alt={image.alt || `Gallery image ${index + 1}`}
              className={`${getImageClasses(image, index)} ${
                lightbox ? 'cursor-pointer transition-transform duration-300 hover:scale-105' : ''
              }`}
            />
            
            {/* Tags overlay */}
            {image.tags && image.tags.length > 0 && (
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {image.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 text-xs font-medium bg-white/90 dark:bg-black/90 text-gray-800 dark:text-gray-200 rounded-full backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Caption overlay */}
            {showCaptions && image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}

            {/* Aspect ratio indicator */}
            {image.aspectRatio && (
              <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-black/50 text-white rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {image.aspectRatio}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightbox && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative max-w-7xl max-h-[90vh] flex items-center justify-center">
            <img
              src={selectedImage.url}
              alt={selectedImage.alt || 'Lightbox image'}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {selectedImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-center">{selectedImage.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Gallery Schema Definition
export const ImageGallerySchema = {
  name: 'imageGallery',
  label: 'Image Gallery',
  ui: {
    defaultItem: {
      layout: 'masonry',
      columns: 'three',
      gap: 'medium',
      lightbox: true,
      showCaptions: true,
      images: []
    },
  },
  fields: [
    {
      type: 'string',
      label: 'Layout',
      name: 'layout',
      options: [
        { label: 'Masonry (Maintains aspect ratios)', value: 'masonry' },
        { label: 'Grid (Square crops)', value: 'grid' },
        { label: 'Mixed (First image featured)', value: 'mixed' },
      ],
      ui: {
        component: 'select',
      },
    },
    {
      type: 'string',
      label: 'Columns',
      name: 'columns',
      options: [
        { label: '2 Columns', value: 'two' },
        { label: '3 Columns', value: 'three' },
        { label: '4 Columns', value: 'four' },
        { label: '5 Columns', value: 'five' },
      ],
      ui: {
        component: 'select',
      },
    },
    {
      type: 'string',
      label: 'Gap Size',
      name: 'gap',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
      ui: {
        component: 'select',
      },
    },
    {
      type: 'boolean',
      label: 'Enable Lightbox',
      name: 'lightbox',
      description: 'Allow clicking images to view them in fullscreen',
    },
    {
      type: 'boolean',
      label: 'Show Captions',
      name: 'showCaptions',
      description: 'Display captions on hover',
    },
    {
      type: 'object',
      label: 'Images',
      name: 'images',
      list: true,
      ui: {
        itemProps: (item) => {
          return { 
            label: item?.caption || item?.alt || 'Image' 
          }
        },
      },
      fields: [
        {
          type: 'image',
          label: 'Image',
          name: 'url',
          required: true,
        },
        {
          type: 'string',
          label: 'Alt Text',
          name: 'alt',
          description: 'Describe the image for accessibility',
        },
        {
          type: 'string',
          label: 'Caption',
          name: 'caption',
          ui: {
            component: 'textarea',
          },
        },
        {
          type: 'string',
          label: 'Aspect Ratio',
          name: 'aspectRatio',
          description: 'Tag the image orientation',
          options: [
            { label: 'Landscape', value: 'landscape' },
            { label: 'Portrait', value: 'portrait' },
            { label: 'Square', value: 'square' },
            { label: 'Panoramic', value: 'panoramic' },
            { label: 'Tall', value: 'tall' },
          ],
          ui: {
            component: 'select',
          },
        },
        {
          type: 'string',
          label: 'Tags',
          name: 'tags',
          list: true,
          description: 'Add custom tags to categorize images',
          ui: {
            component: 'tags',
          },
        },
      ],
    },
  ],
}

// Add to your blocks/index.tsx:
/*
import { ImageGallery } from './imageGallery';

// In your switch statement:
case 'PageBlocksImageGallery':
case 'imageGallery':
  return <ImageGallery key={i} data={block} />
*/