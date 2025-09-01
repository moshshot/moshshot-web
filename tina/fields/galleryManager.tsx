// tina/fields/galleryManager.tsx
import React, { useEffect, useState } from 'react'

const GalleryManager = ({ field, input, form }: any) => {
  const [availableImages, setAvailableImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastScannedFolder, setLastScannedFolder] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  const getFolderPath = () => {
    if (field?.name) {
      const parentPath = field.name.replace('.images', '')
      const folderFieldName = `${parentPath}.folderPath`
      
      if (form?.getFieldState) {
        const folderFieldState = form.getFieldState(folderFieldName)
        if (folderFieldState?.value) {
          return folderFieldState.value
        }
      }
      
      if (form?.getState) {
        const state = form.getState()
        const blocks = state?.values?.blocks
        if (blocks && blocks[0]) {
          return blocks[0].folderPath
        }
      }
    }
    return ''
  }

  const scanFolder = async (folder: string) => {
    if (!folder || folder === lastScannedFolder) return
    
    setLoading(true)
    setLastScannedFolder(folder)
    
    try {
      const response = await fetch(`/api/scan-folder?folder=${encodeURIComponent(folder)}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('API Error:', data.error)
        setAvailableImages([])
        return
      }
      
      const images = data.images || []
      setAvailableImages(images)
      
      const currentCaptions = input.value || []
      const newImages = images.filter(
        (img: any) => !currentCaptions.find((cap: any) => cap.filename === img.filename)
      )
      
      if (newImages.length > 0) {
        const updatedCaptions = [
          ...currentCaptions,
          ...newImages.map((img: any) => ({
            filename: img.filename,
            path: img.path,
            caption: '',
            alt: '',
            tags: []
          }))
        ]
        input.onChange(updatedCaptions)
      }
    } catch (error) {
      console.error('Failed to scan folder:', error)
      setAvailableImages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkForFolder = () => {
      const folderPath = getFolderPath()
      if (folderPath && folderPath !== lastScannedFolder) {
        scanFolder(folderPath)
      }
    }
    
    checkForFolder()
    const interval = setInterval(checkForFolder, 1000)
    return () => clearInterval(interval)
  }, [form, lastScannedFolder])

  const [tagInputs, setTagInputs] = useState<{[key: string]: string}>({})

  const updateCaption = (index: number, fieldName: string, value: any) => {
    const updated = [...(input.value || [])]
    updated[index] = { ...updated[index], [fieldName]: value }
    input.onChange(updated)
  }

  const handleTagChange = (index: number, value: string) => {
    setTagInputs(prev => ({ ...prev, [index]: value }))
  }

  const handleTagBlur = (index: number) => {
    const value = tagInputs[index] || (input.value[index]?.tags || []).join(', ')
    const tags = value.split(',').map((t: string) => t.trim()).filter(Boolean)
    updateCaption(index, 'tags', tags)
  }

  const removeImage = (index: number) => {
    const updated = (input.value || []).filter((_: any, i: number) => i !== index)
    input.onChange(updated)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    // Create completely new array to ensure React detects the change
    const items = input.value || []
    const newOrder = Array.from(items)
    
    // Remove and reinsert
    const [removed] = newOrder.splice(draggedIndex, 1)
    const insertAt = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newOrder.splice(insertAt, 0, removed)
    
    // Update with new array reference
    input.onChange(newOrder)
    
    // Force form to mark as dirty
    if (form?.change) {
      form.change(field.name, newOrder)
    }
    
    // Reset drag state
    setTimeout(() => {
      setDraggedIndex(null)
      setDragOverIndex(null)
    }, 0)
    
    console.log('Reordered:', newOrder.map((i: any) => i.filename))
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Manual reordering with buttons
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const items = [...(input.value || [])]
    
    if (newIndex < 0 || newIndex >= items.length) return
    
    [items[index], items[newIndex]] = [items[newIndex], items[index]]
    input.onChange(items)
  }

  const images = input.value || []
  const [manualPath, setManualPath] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Gallery Images</h3>
        <button
          type="button"
          onClick={() => {
            const path = getFolderPath()
            if (path) {
              setLastScannedFolder('')
              scanFolder(path)
            }
          }}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Scanning...' : 'Rescan Folder'}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter folder path manually (e.g., uploads/placeholder)"
          value={manualPath}
          onChange={(e) => setManualPath(e.target.value)}
          className="flex-1 px-2 py-1 border rounded text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (manualPath) {
              setLastScannedFolder('')
              scanFolder(manualPath)
            }
          }}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          disabled={loading || !manualPath}
        >
          Scan Manual Path
        </button>
      </div>

      {lastScannedFolder && (
        <p className="text-sm text-gray-600">
          Last scanned: {lastScannedFolder} · Drag images to reorder
        </p>
      )}

      {images.length === 0 && !loading && (
        <p className="text-gray-500 italic">
          No images loaded. Enter a folder path above or use the manual input.
        </p>
      )}

      <div className="space-y-2">
        {images.map((image: any, index: number) => (
          <React.Fragment key={`${image.filename}-${index}`}>
            {/* Drop zone indicator above each item */}
            <div
              className={`
                h-1 -my-0.5 rounded transition-all
                ${dragOverIndex === index && draggedIndex !== null
                  ? 'bg-blue-500 h-2' 
                  : 'bg-transparent'
                }
              `}
            />
            
            <div
              className={`
                border rounded-lg p-4 bg-white transition-all select-none
                ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={handleDragLeave}
            >
              <div className="flex gap-4">
                {/* Drag Handle & Order Controls */}
                <div 
                  className="flex flex-col items-center justify-center gap-1 cursor-move hover:bg-gray-100 rounded p-1"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <svg className="w-5 h-5 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 6a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM15 2a2 2 0 11-4 0 2 2 0 014 0zM15 6a2 2 0 11-4 0 2 2 0 014 0zM15 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(index, 'up')
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(index, 'down')
                      }}
                      disabled={index === images.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <img
                    src={image.path}
                    alt={image.alt || image.filename}
                    className="w-24 h-24 object-cover rounded border"
                    onError={(e: any) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>

                {/* Caption Fields */}
                <div className="flex-grow space-y-2">
                  <div className="font-medium text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-gray-400">#{index + 1}</span>
                    {image.filename}
                  </div>

                  <div className="flex flex-col">
                  <input
                    type="text"
                    placeholder="Caption"
                    value={image.caption || ''}
                    onChange={(e) => updateCaption(index, 'caption', e.target.value)}
                    className="w-full px-2 py-1 border border-solid border-gray-300 rounded text-sm"
                  />
                  
                  {/* <input
                    type="text"
                    placeholder="Alt text (for accessibility)"
                    value={image.alt || ''}
                    onChange={(e) => updateCaption(index, 'alt', e.target.value)}
                    className="w-full px-2 py-1 border border-solid border-gray-300 rounded text-sm"
                  /> */}
                  
                  {/* <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={tagInputs[index] !== undefined ? tagInputs[index] : (image.tags || []).join(', ')}
                    onChange={(e) => handleTagChange(index, e.target.value)}
                    onBlur={() => handleTagBlur(index)}
                    className="w-full px-2 py-1 border border-solid border-gray-300 rounded text-sm"
                  /> */}

                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700"
                  title="Remove from gallery"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </React.Fragment>
        ))}
        
        {/* Final drop zone at the bottom */}
        {draggedIndex !== null && (
          <div
            className={`
              h-1 rounded transition-all
              ${dragOverIndex === images.length 
                ? 'bg-blue-500 h-2' 
                : 'bg-transparent'
              }
            `}
            onDragOver={(e) => handleDragOver(e, images.length)}
            onDrop={(e) => handleDrop(e, images.length)}
          />
        )}
      </div>
    </div>
  )
}

export default GalleryManager