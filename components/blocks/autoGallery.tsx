import React, { useState, useEffect } from "react";
import Masonry from "react-masonry-css";
import GalleryManager from "@/tina/fields/galleryManager";
import Image from "next/image";

export const AutoGallery = ({ data }: any) => {
  const {
    images: savedImages = [],
    layout = "masonry",
    columns = "three",
    gap = "medium",
    lightbox = true,
  } = data;

  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [cssBlurData, setCssBlurData] = useState<Record<string, any>>({});

  // Load CSS blur data on mount
  useEffect(() => {
    loadCssBlurData();
  }, []);

  // Load gallery images when CSS data is ready
  useEffect(() => {
    if (Object.keys(cssBlurData).length > 0 || !loading) {
      loadGalleryImages();
    }
  }, [savedImages, cssBlurData]);

  const loadCssBlurData = async () => {
    try {
      const response = await fetch("/css-blur-data.json");
      if (response.ok) {
        const data = await response.json();
        setCssBlurData(data);
        console.log(
          "Loaded CSS blur data for",
          Object.keys(data).length,
          "images"
        );
      }
    } catch (error) {
      console.error("Failed to load CSS blur data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryImages = async () => {
    if (savedImages && savedImages.length > 0) {
      const validImages = savedImages.filter((img: any) => img.path || img.url);

      if (validImages.length > 0) {
        const enhancedImages = validImages.map((img: any) => {
          const imagePath = img.path || img.url;
          const blurData = cssBlurData[imagePath] || {};

          // Recreate ImageKit URLs if not present
          const getImageKitUrl = (
            baseUrl: string,
            transformations: string
          ): string => {
            if (!baseUrl) return "";
            let cleanPath = baseUrl.replace(/[?&]updatedAt=\d+/g, "");
            cleanPath = cleanPath.replace(/[?&]$/, "");
            if (cleanPath.includes("?tr=")) return cleanPath;
            return `${cleanPath}?tr=${transformations}`;
          };

          return {
            ...img,
            path: imagePath,
            cssBlur: blurData.css || null,
            width: blurData.width || img.width || 800,
            height: blurData.height || img.height || 600,
            blurDataURL:
              img.blurDataURL ||
              getImageKitUrl(imagePath, "bl-10,w-20,h-20,q-30,f-webp"),
            previewUrl:
              img.previewUrl ||
              getImageKitUrl(
                imagePath,
                "w-120,h-120,c-maintain_ratio,f-webp,q-85"
              ),
            thumbnailUrl:
              img.thumbnailUrl ||
              getImageKitUrl(
                imagePath,
                "w-96,h-96,c-maintain_ratio,f-webp,q-80"
              ),
          };
        });
        setGalleryImages(enhancedImages);
        setLoading(false);
        return;
      }
    }

    // If no saved images, we no longer try to fetch from a folder
    setGalleryImages([]);
    setLoading(false);
  };

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
  };

  const gridClasses = {
    two: "grid grid-cols-1 md:grid-cols-2",
    three: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    four: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  const gapClasses = {
    small: "gap-2",
    medium: "gap-4",
    large: "gap-6",
  };

  const masonryGutters = {
    small: 8,
    medium: 16,
    large: 24,
  };

  if (loading) {
    const loaderArray = ["350px", "280px", "370px", "240px", "420px", "180px"];
    const loaderLoop = loaderArray.map((image: any, index: number) => (
      <div
        key={index}
        className={`group relative overflow-hidden rounded-xs ${
          layout === "grid" ? "aspect-square" : ""
        }`}
      >
        <div
          className={`
            bg-neutral-800 transition-transform duration-300 group-hover:scale-105
            ${
              layout === "grid"
                ? "h-full object-cover"
                : "h-auto object-cover block"
            }
          `}
        >
          <div style={{ height: image }}></div>
        </div>
      </div>
    ));

    return (
      <>
        <style>{`
        .masonry-grid {
          display: flex;
          margin-top: ${masonryGutters[gap]}px;
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
        {layout === "masonry" ? (
          <Masonry
            breakpointCols={breakpointColumns[columns]}
            className="masonry-grid animate-pulse"
            columnClassName="masonry-grid-column"
          >
            {loaderLoop}
          </Masonry>
        ) : (
          <div className={`${gridClasses[columns]} ${gapClasses[gap]}`}>
            {loaderLoop}
          </div>
        )}
      </>
    );
  }

  if (!savedImages || savedImages.length === 0) {
    return null;
  }

  if (galleryImages.length === 0) {
    return null;
  }

  console.log(10101, { galleryImages });

  const imageElements = galleryImages.map((image: any, index: number) => (
    <div
      key={image.filename || index}
      className={`group relative overflow-hidden rounded-xs cursor-pointer ${
        layout === "grid" ? "aspect-square" : ""
      }`}
      onClick={() => lightbox && setSelectedImage(image)}
    >
      {/* Show CSS blur placeholder until image loads */}
      {image.cssBlur && !loadedImages.has(index) && (
        <div
          className="absolute inset-0 w-full h-full blur-2xl"
          style={{
            ...image.cssBlur,
            transform: `${image.cssBlur?.transform || ""} scale(1.5)`,
          }}
        />
      )}

      {/* Actual image */}
      <Image
        src={image.path}
        alt={image.alt || image.caption || `Gallery image ${index + 1}`}
        width={image.width}
        height={image.height}
        className={`transition-all duration-500 group-hover:scale-105 ${
          layout === "grid" ? "w-full h-full object-cover" : "w-full h-auto"
        } ${loadedImages.has(index) ? "opacity-100" : "opacity-0"}`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={85}
        loading="lazy"
        onLoad={() => {
          setLoadedImages((prev) => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
          });
        }}
      />

      {image.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-sm font-medium">{image.caption}</p>
          {image.tags && image.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {image.tags.map((tag: string) => (
                <span key={tag} className="text-xs text-white/70">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ));

  return (
    <>
      <style>{`
        .masonry-grid {
          display: flex;
          margin-top: ${masonryGutters[gap]}px;
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

      {layout === "masonry" ? (
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
            <svg
              className="w-8 h-8"
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

          <figure
            className="max-w-7xl"
            onClick={(e: any) => e.stopPropagation()}
          >
            <Image
              src={(selectedImage as any).path}
              alt={(selectedImage as any).alt || (selectedImage as any).caption}
              width={(selectedImage as any).width}
              height={(selectedImage as any).height}
              quality={100}
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
  );
};

export const AutoDetectGallerySchema = {
  name: "autoGallery",
  label: "Smart Gallery",
  ui: {
    defaultItem: {
      layout: "masonry",
      columns: "three",
      gap: "medium",
      lightbox: true,
      images: [],
    },
  },
  fields: [
    // Remove the folderPath field entirely
    {
      type: "string",
      label: "Layout Style",
      name: "layout",
      options: [
        { label: "Masonry (Pinterest-style)", value: "masonry" },
        { label: "Grid (Square crops)", value: "grid" },
        { label: "Slider", value: "slider" },
      ],
    },
    {
      type: "string",
      label: "Columns",
      name: "columns",
      options: [
        { label: "2 Columns", value: "two" },
        { label: "3 Columns", value: "three" },
        { label: "4 Columns", value: "four" },
      ],
    },
    {
      type: "string",
      label: "Spacing",
      name: "gap",
      options: [
        { label: "Small (8px)", value: "small" },
        { label: "Medium (16px)", value: "medium" },
        { label: "Large (24px)", value: "large" },
      ],
    },
    {
      type: "boolean",
      label: "Enable Lightbox",
      name: "lightbox",
      description: "Click images to view fullscreen",
    },
    {
      type: "object",
      label: "Image Captions",
      name: "images",
      list: true,
      fields: [
        {
          type: "string",
          name: "filename",
          label: "Filename",
        },
        {
          type: "string",
          name: "path",
          label: "Path",
        },
        {
          type: "string",
          name: "caption",
          label: "Caption",
        },
        {
          type: "string",
          name: "alt",
          label: "Alt Text",
        },
        {
          type: "string",
          name: "tags",
          label: "Tags",
          list: true,
        },
        // Add a hidden field to store the folder path
        {
          type: "string",
          name: "folderPath",
          label: "Folder Path",
          ui: {
            component: "hidden",
          },
        },
      ],
      ui: {
        component: GalleryManager,
      },
    },
  ],
};
