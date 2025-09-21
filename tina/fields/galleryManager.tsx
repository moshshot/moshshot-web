import React, { useEffect, useState } from "react";

const GalleryManager = ({ field, input, form }: any) => {
  const [availableImages, setAvailableImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastScannedFolder, setLastScannedFolder] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [orderInputs, setOrderInputs] = useState<{ [key: number]: string }>({});
  const [manualPath, setManualPath] = useState("");

  // Utility functions
  const getImageKitUrl = (baseUrl: string, transformations: string): string => {
    if (!baseUrl) return "";

      // Remove updatedAt query parameter specifically while preserving others
  let cleanPath = baseUrl.replace(/[?&]updatedAt=\d+/g, '');
  
  // Clean up any trailing ? or & that might be left
  cleanPath = cleanPath.replace(/[?&]$/, '');
    if (cleanPath.includes("?tr=")) return cleanPath;
    return `${cleanPath}?tr=${transformations}`;
  };

  const isValidImageData = (image: any): boolean => {
    return (
      image &&
      typeof image.fileId === "string" &&
      typeof image.filename === "string" &&
      typeof image.path === "string"
    );
  };

  const cleanImageKitPath = (path: string): string => {
    if (!path) return "";
    return path
      .replace(/^\/+|\/+$/g, "")
      .replace(/\/+/g, "/")
      .trim();
  };

  // Get the stored folder path from the first image (if any)
  const getCurrentFolderPath = () => {
    const images = input.value || [];
    if (images.length > 0 && images[0].folderPath) {
      return cleanImageKitPath(images[0].folderPath);
    }
    return "";
  };

  // Store folder path in all images when scanning
  const storeFolderPathInImages = (images: any[], folderPath: string) => {
    return images.map((img) => ({
      ...img,
      folderPath: cleanImageKitPath(folderPath),
    }));
  };

  const scanFolder = async (folder: string) => {
    if (!folder) return;

    const cleanFolder = cleanImageKitPath(folder);
    if (cleanFolder === lastScannedFolder) return;

    setLoading(true);
    setLastScannedFolder(cleanFolder);

    try {
      console.log("Scanning ImageKit folder:", cleanFolder);

      const response = await fetch("/api/imagekit/list-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderPath: cleanFolder,
          fileType: "image",
          limit: 100,
        }),
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Response not OK:", response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      if (data.error) {
        console.error("ImageKit API Error:", data.error, data.details);
        setAvailableImages([]);
        alert(
          `ImageKit Error: ${data.error}\nDetails: ${
            data.details || "Unknown error"
          }`
        );
        return;
      }

      const images = data.images || [];

      const processedImages = images
        .filter((img: any) => img.fileId && img.filename && img.path)
        .map((img: any) => ({
          filename: img.filename,
          path: img?.path.split('?')[0] || '',
          fileId: img.fileId,
          width: img.width || 0,
          height: img.height || 0,
          size: img.size || 0,
          folder: img.folder || cleanFolder,
          folderPath: cleanFolder, // Store the folder path
          createdAt: img.createdAt,
          thumbnailUrl: getImageKitUrl(
            img.path,
            "w-96,h-96,c-maintain_ratio,f-webp,q-80"
          ),
          blurDataURL: getImageKitUrl(img.path, "bl-10,w-20,h-20,q-30,f-webp"),
          previewUrl: getImageKitUrl(
            img.path,
            "w-120,h-120,c-maintain_ratio,f-webp,q-85"
          ),
        }));

      setAvailableImages(processedImages);

      const currentCaptions = input.value || [];
      const currentFileIds = new Set(
        currentCaptions.map((cap: any) => cap.fileId).filter(Boolean)
      );

      const newImages = processedImages.filter(
        (img: any) => !currentFileIds.has(img.fileId)
      );

      if (newImages.length > 0) {
        const updatedCaptions = [
          // Update existing images with folder path
          ...storeFolderPathInImages(currentCaptions, cleanFolder),
          // Add new images with folder path
          ...newImages.map((img: any) => ({
            filename: img.filename,
            path: img.path,
            fileId: img.fileId,
            folderPath: cleanFolder,
            thumbnailUrl: img.thumbnailUrl,
            blurDataURL: img.blurDataURL,
            previewUrl: img.previewUrl,
            width: img.width,
            height: img.height,
            size: img.size,
            folder: img.folder,
            caption: "",
            alt: img.filename.replace(/\.[^/.]+$/, ""),
            tags: [],
          })),
        ];

        input.onChange(updatedCaptions);

        if (form?.change) {
          form.change(field.name, updatedCaptions);
        }

        console.log(`Added ${newImages.length} new ImageKit images to gallery`);
      } else {
        // Still update existing images with folder path
        const updatedCaptions = storeFolderPathInImages(
          currentCaptions,
          cleanFolder
        );
        input.onChange(updatedCaptions);

        if (form?.change) {
          form.change(field.name, updatedCaptions);
        }
      }
    } catch (error) {
      console.error("Failed to scan ImageKit folder:", error);
      setAvailableImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize manual path from stored data on component mount
  useEffect(() => {
    const storedPath = getCurrentFolderPath();
    if (storedPath && !manualPath) {
      setManualPath(storedPath);
      setLastScannedFolder(storedPath);
    }
  }, []);

  const updateCaption = (index: number, fieldName: string, value: any) => {
    const updated = [...(input.value || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [fieldName]: value };
      input.onChange(updated);

      if (form?.change) {
        form.change(field.name, updated);
      }
    }
  };

  const removeImage = (index: number) => {
    const currentImages = input.value || [];
    if (index < 0 || index >= currentImages.length) return;

    const updated = currentImages.filter((_: any, i: number) => i !== index);
    input.onChange(updated);

    if (form?.change) {
      form.change(field.name, updated);
    }

    setOrderInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[index];

      const shifted: { [key: number]: string } = {};
      Object.entries(newInputs).forEach(([key, val]) => {
        const keyNum = parseInt(key, 10);
        if (keyNum > index) {
          shifted[keyNum - 1] = val;
        } else {
          shifted[keyNum] = val;
        }
      });

      return shifted;
    });
  };

  const handleOrderInputChange = (index: number, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setOrderInputs((prev) => ({ ...prev, [index]: value }));
    }
  };

  const handleOrderInputBlur = (index: number) => {
    const value = orderInputs[index];
    if (value === undefined || value === "") {
      setOrderInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[index];
        return newInputs;
      });
      return;
    }

    const newPosition = parseInt(value, 10) - 1;
    const items = input.value || [];

    if (
      newPosition < 0 ||
      newPosition >= items.length ||
      newPosition === index ||
      !items[index]
    ) {
      setOrderInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[index];
        return newInputs;
      });
      return;
    }

    const newOrder = [...items];
    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(newPosition, 0, removed);

    input.onChange(newOrder);

    if (form?.change) {
      form.change(field.name, newOrder);
    }

    setOrderInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[index];
      return newInputs;
    });

    console.log(
      `Moved ImageKit image "${removed.filename}" from position ${
        index + 1
      } to ${newPosition + 1}`
    );
  };

  const handleOrderInputKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      handleOrderInputBlur(index);
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setOrderInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[index];
        return newInputs;
      });
      e.currentTarget.blur();
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = input.value || [];
    if (items.length === 0) return;

    const newOrder = Array.from(items);

    if (
      draggedIndex < 0 ||
      draggedIndex >= newOrder.length ||
      dropIndex < 0 ||
      dropIndex > newOrder.length
    ) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const [removed] = newOrder.splice(draggedIndex, 1);
    const insertAt = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newOrder.splice(insertAt, 0, removed);

    input.onChange(newOrder);

    if (form?.change) {
      form.change(field.name, newOrder);
    }

    setTimeout(() => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }, 0);

    console.log(
      "Reordered ImageKit images:",
      newOrder.map((i: any) => `${i.filename} (${i.fileId})`)
    );
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const items = [...(input.value || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= items.length ||
      !items[index] ||
      !items[newIndex]
    ) {
      return;
    }

    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    input.onChange(items);

    if (form?.change) {
      form.change(field.name, items);
    }
  };

  const ImagePreview = ({ image, index }: { image: any; index: number }) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Generate thumbnail URL if it doesn't exist
    const getThumbnailUrl = (image: any) => {
      if (image.thumbnailUrl) {
        return image.thumbnailUrl;
      }
      if (image.previewUrl) {
        return image.previewUrl;
      }
      if (image.path) {
        return getImageKitUrl(
          image.path,
          "w-96,h-96,c-maintain_ratio,f-webp,q-80"
        );
      }
      return image.path;
    };

    //   thumbnailUrl: getImageKitUrl(
    //   img.path,
    //   "w-96,h-96,c-maintain_ratio,f-webp,q-80"
    // ),
    // blurDataURL: getImageKitUrl(img.path, "bl-10,w-20,h-20,q-30,f-webp"),
    // previewUrl: getImageKitUrl(
    //   img.path,
    //   "w-120,h-120,c-maintain_ratio,f-webp,q-85"
    // ),

    const thumbnailUrl = getThumbnailUrl(image);

    return (
      <div className="flex-shrink-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded border w-24 h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
        {!imageError ? (
          <img
            src={thumbnailUrl}
            alt={image.alt || image.filename}
            className={`w-24 h-24 object-cover rounded border transition-opacity ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImageError(true);
              setIsLoading(false);
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded border flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const images = input.value || [];
  const currentFolderPath = getCurrentFolderPath();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Gallery Images</h3>
        <button
          type="button"
          onClick={() => {
            if (manualPath) {
              setLastScannedFolder("");
              scanFolder(manualPath);
            }
          }}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading || !manualPath}
        >
          {loading ? "Loading from ImageKit..." : "Rescan ImageKit Folder"}
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ImageKit Folder Path
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., gallery/2024, products/featured"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => {
              if (manualPath) {
                setLastScannedFolder("");
                scanFolder(manualPath);
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            disabled={loading || !manualPath}
          >
            Scan Folder
          </button>
        </div>
        {currentFolderPath && (
          <p className="text-sm text-gray-600">
            Currently loaded:{" "}
            <span className="font-mono">/{currentFolderPath}</span>
          </p>
        )}
      </div>

      {lastScannedFolder && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
          📁 <strong>Active folder:</strong> /{lastScannedFolder}
          <br />
          💡 <em>Drag images to reorder or type position number</em>
          {availableImages.length > 0 && (
            <span className="ml-2 text-green-600">
              • Found {availableImages.length} images
            </span>
          )}
        </div>
      )}

      {images.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
            />
          </svg>
          <p className="font-medium">No images loaded from ImageKit</p>
          <p className="text-sm">
            Enter a folder path above to browse your ImageKit media library
          </p>
        </div>
      )}

      <div className="space-y-2">
        {images.map((image: any, index: number) => (
          <React.Fragment key={`${image.fileId}-${index}`}>
            <div
              className={`
                h-1 -my-0.5 rounded transition-all
                ${
                  dragOverIndex === index && draggedIndex !== null
                    ? "bg-blue-500 h-2"
                    : "bg-transparent"
                }
              `}
            />

            <div
              className={`
                border rounded-lg p-4 bg-white transition-all select-none
                ${draggedIndex === index ? "opacity-50 scale-95" : ""}
                hover:shadow-sm
              `}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={handleDragLeave}
            >
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="flex flex-col items-center justify-center gap-1 cursor-move hover:bg-gray-100 rounded p-1"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 pointer-events-none"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 6a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM15 2a2 2 0 11-4 0 2 2 0 014 0zM15 6a2 2 0 11-4 0 2 2 0 014 0zM15 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(index, "up");
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(index, "down");
                        }}
                        disabled={index === images.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      value={
                        orderInputs[index] !== undefined
                          ? orderInputs[index]
                          : index + 1
                      }
                      onChange={(e) =>
                        handleOrderInputChange(index, e.target.value)
                      }
                      onBlur={() => handleOrderInputBlur(index)}
                      onKeyDown={(e) => handleOrderInputKeyDown(e, index)}
                      onFocus={(e) => e.target.select()}
                      className="w-12 px-1 py-0.5 text-center border border-gray-300 rounded text-sm font-medium"
                      title="Type position number and press Enter"
                      placeholder={(index + 1).toString()}
                    />
                    <span className="text-xs text-gray-400 mt-0.5">
                      #{index + 1}
                    </span>
                  </div>
                </div>

                <ImagePreview image={image} index={index} />

                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm text-gray-700 flex-1">
                      {image.filename}
                    </div>
                  </div>

                  {/* <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Caption"
                      value={image.caption || ""}
                      onChange={(e) =>
                        updateCaption(index, "caption", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-solid border-gray-300 rounded text-sm"
                    />

                  </div> */}
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700"
                  title="Remove from gallery"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </React.Fragment>
        ))}

        {draggedIndex !== null && (
          <div
            className={`
              h-1 rounded transition-all
              ${
                dragOverIndex === images.length
                  ? "bg-blue-500 h-2"
                  : "bg-transparent"
              }
            `}
            onDragOver={(e) => handleDragOver(e, images.length)}
            onDrop={(e) => handleDrop(e, images.length)}
          />
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">
            Loading images from ImageKit...
          </span>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
