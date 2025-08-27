// tina/fields/galleryManager.tsx
import React, { useEffect, useState } from 'react'

const GalleryManager = ({ field, input, form }) => {
  const [availableImages, setAvailableImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastScannedFolder, setLastScannedFolder] = useState('')
  
  // The form object in custom components doesn't always have direct access to other fields
  // We need to look at the entire form state
  const getFolderPath = () => {
    // The field name tells us where we are in the form structure
    // field.name is "blocks.0.images", so folderPath is at "blocks.0.folderPath"
    
    if (field?.name) {
      // Extract the parent path from the field name
      const parentPath = field.name.replace('.images', '')
      const folderFieldName = `${parentPath}.folderPath`
      
      // Get the folder path value using getFieldState
      if (form?.getFieldState) {
        const folderFieldState = form.getFieldState(folderFieldName)
        
        if (folderFieldState?.value) {
          return folderFieldState.value
        }
      }
      
      // Alternative: Get from form state values
      if (form?.getState) {
        const state = form.getState()
        const blocks = state?.values?.blocks
        
        if (blocks && blocks[0]) {
          console.log('Found via blocks:', blocks[0].folderPath)
          return blocks[0].folderPath
        }
      }
    }
    
    console.log('No folder path found')
    return ''
  }

  const scanFolder = async (folder) => {
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
      
      // Auto-populate new images
      const currentCaptions = input.value || []
      const newImages = images.filter(
        img => !currentCaptions.find(cap => cap.filename === img.filename)
      )
      
      if (newImages.length > 0) {
        const updatedCaptions = [
          ...currentCaptions,
          ...newImages.map(img => ({
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

  // Watch for changes - check every second since form updates might be delayed
  useEffect(() => {
    const checkForFolder = () => {
      const folderPath = getFolderPath()
      if (folderPath && folderPath !== lastScannedFolder) {
        scanFolder(folderPath)
      }
    }
    
    // Check immediately
    checkForFolder()
    
    // Then check periodically
    const interval = setInterval(checkForFolder, 1000)
    
    return () => clearInterval(interval)
  }, [form, lastScannedFolder])

  const updateCaption = (index, fieldName, value) => {
    const updated = [...(input.value || [])]
    updated[index] = { ...updated[index], [fieldName]: value }
    input.onChange(updated)
  }

  const removeImage = (index) => {
    const updated = (input.value || []).filter((_, i) => i !== index)
    input.onChange(updated)
  }

  const images = input.value || []

  // Manual scan button with input
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
              setLastScannedFolder('') // Force rescan
              scanFolder(path)
            }
          }}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Scanning...' : 'Rescan Folder'}
        </button>
      </div>

      {/* Manual path input as fallback */}
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
              setLastScannedFolder('') // Force rescan
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
          Last scanned: {lastScannedFolder}
        </p>
      )}

      {images.length === 0 && !loading && (
        <p className="text-gray-500 italic">
          No images loaded. Enter a folder path above or use the manual input.
        </p>
      )}

      <div className="space-y-4 flex flex-col">
        {images.map((image, index) => (
          <div key={`${image.filename}-${index}`} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-4">
              {/* Image Preview */}
              <div className="flex-shrink-0">
                <img
                  src={image.path}
                  alt={image.alt || image.filename}
                  className="w-24 h-24 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>

              {/* Caption Fields */}
              <div className="flex-grow space-y-2 flex flex-col flex-wrap">
                <div className="font-medium text-sm text-gray-700">
                  {image.filename}
                </div>
                
                <input
                  type="text"
                  placeholder="Caption"
                  value={image.caption || ''}
                  onChange={(e) => updateCaption(index, 'caption', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
                
                <input
                  type="text"
                  placeholder="Alt text (for accessibility)"
                  value={image.alt || ''}
                  onChange={(e) => updateCaption(index, 'alt', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
                
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={(image.tags || []).join(', ')}
                  onChange={(e) => updateCaption(index, 'tags', 
                    e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  )}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
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
        ))}
      </div>
    </div>
  )
}

export default GalleryManager