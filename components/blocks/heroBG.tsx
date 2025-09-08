import React from 'react'
import Image from 'next/image'

export const HeroBG = ({ data }) => {
  const {
    heading,
    subheading,
    backgroundImage,
    overlayOpacity = 50,
    textColor = 'white',
    minHeight = '500px',
    showScrollIndicator = false,
    scrollIndicatorText = 'Scroll Down',
    logoImage,
    logoWidth = '200px',
    logoPosition = 'above'
  } = data

  const textColorClass = textColor === 'white' ? 'text-white' : 'text-black'
  
  return (
    <div 
      className={`relative w-full flex items-center justify-center overflow-hidden`}
      style={{ minHeight }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="w-full h-full object-cover"
          />
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 px-4 py-12 text-center max-w-4xl mx-auto">
        {/* Logo Above Heading */}
        {logoImage && logoPosition === 'above' && (
          <div className="mb-6 flex justify-center">
            <Image
              src={logoImage}
              alt="MOSHSHOT Logo"
              width={0}
              height={0}
              style={{ width: logoWidth, height: 'auto' }}
              className="object-contain"
            />
          </div>
        )}
        {heading && (
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${textColorClass}`}>
            {heading}
          </h1>
        )}
        {/* Logo Between Heading and Subheading */}
        {logoImage && logoPosition === 'between' && (
          <div className="mb-4 flex justify-center">
            <Image
              src={logoImage}
              alt="MOSHSHOT Logo"
              width={0}
              height={0}
              style={{ width: logoWidth, height: 'auto' }}
              className="object-contain"
            />
          </div>
        )}
        {subheading && (
          <p className={`text-lg md:text-xl lg:text-2xl ${textColorClass} opacity-90`}>
            {subheading}
          </p>
        )}
        {/* Logo Below Subheading */}
        {logoImage && logoPosition === 'below' && (
          <div className="mt-6 flex justify-center">
            <Image
              src={logoImage}
              alt="MOSHSHOT Logo"
              width={0}
              height={0}
              style={{ width: logoWidth, height: 'auto' }}
              className="object-contain"
            />
          </div>
        )}
      </div>

      {/* Scroll Down Indicator */}
      {showScrollIndicator && (
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 ${textColorClass} animate-bounce`}>
          <div className="flex flex-col items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            {scrollIndicatorText && (
              <span className="text-sm uppercase tracking-wider">{scrollIndicatorText}</span>
            )}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
            >
              <path 
                d="M7 13L12 18L17 13M7 6L12 11L17 6" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

// Hero Block Schema Definition
export const HeroBGSchema = {
  name: 'HeroBG',
  label: 'Hero BG',
  ui: {
    previewSrc: '/blocks/hero.png',
    defaultItem: {
      heading: 'Welcome to Our Site',
      subheading: 'Discover amazing content and experiences',
      backgroundImage: '',
      overlayOpacity: 50,
      textColor: 'white',
      minHeight: '500px',
      showScrollIndicator: false,
      scrollIndicatorText: 'Scroll Down',
      logoImage: '',
      logoWidth: '200px',
      logoPosition: 'above'
    },
  },
  fields: [
    {
      type: 'string',
      label: 'Heading',
      name: 'heading',
    },
    {
      type: 'string',
      label: 'Subheading',
      name: 'subheading',
      ui: {
        component: 'textarea',
      },
    },
    {
      type: 'image',
      label: 'Background Image',
      name: 'backgroundImage',
      required: true,
    },
    {
      type: 'number',
      label: 'Overlay Opacity',
      name: 'overlayOpacity',
      description: 'Darkness of overlay (0-100)',
      ui: {
        component: 'number',
        validate: (value) => {
          if (value < 0 || value > 100) {
            return 'Opacity must be between 0 and 100'
          }
        },
      },
    },
    {
      type: 'string',
      label: 'Text Color',
      name: 'textColor',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Black', value: 'black' },
      ],
      ui: {
        component: 'select',
      },
    },
    {
      type: 'string',
      label: 'Minimum Height',
      name: 'minHeight',
      options: [
        { label: 'Small (400px)', value: '400px' },
        { label: 'Medium (500px)', value: '500px' },
        { label: 'Large (600px)', value: '600px' },
        { label: 'Extra Large (700px)', value: '700px' },
        { label: 'Full Screen', value: '100vh' },
      ],
      ui: {
        component: 'select',
      },
    },
    {
      type: 'boolean',
      label: 'Show Scroll Indicator',
      name: 'showScrollIndicator',
      description: 'Display an animated arrow at the bottom',
    },
    {
      type: 'string',
      label: 'Scroll Indicator Text',
      name: 'scrollIndicatorText',
      description: 'Optional text above the arrow (leave empty for arrow only)',
      ui: {
        component: 'text',
      },
    },
    {
      type: 'image',
      label: 'Logo Image',
      name: 'logoImage',
      description: 'Optional logo to display with the hero text',
    },
    {
      type: 'string',
      label: 'Logo Width',
      name: 'logoWidth',
      description: 'Width of the logo (e.g., 200px, 150px)',
      options: [
        { label: 'Small (100px)', value: '100px' },
        { label: 'Medium (150px)', value: '150px' },
        { label: 'Large (200px)', value: '200px' },
        { label: 'Extra Large (250px)', value: '250px' },
        { label: 'XXL (300px)', value: '300px' },
      ],
      ui: {
        component: 'select',
      },
    },
    {
      type: 'string',
      label: 'Logo Position',
      name: 'logoPosition',
      description: 'Where to place the logo relative to the text',
      options: [
        { label: 'Above Heading', value: 'above' },
        { label: 'Between Heading & Subheading', value: 'between' },
        { label: 'Below Subheading', value: 'below' },
      ],
      ui: {
        component: 'select',
      },
    },
  ],
}