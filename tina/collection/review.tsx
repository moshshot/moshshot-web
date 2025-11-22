import type { Collection } from 'tinacms';
import { AutoDetectGallerySchema } from '@/components/blocks/autoGallery';

const Post: Collection = {
  label: 'Reviews',
  name: 'review',
  path: 'content/review',
  format: 'mdx',
  fields: [
    // TITLE SECTION
    {
      type: 'string',
      label: 'Title (Bold)',
      name: 'title',
      isTitle: true,
      required: true,
      description: 'Bold part of title',
    },
    {
      type: 'string',
      label: 'Title (Normal)',
      name: 'subtitle',
      description: 'Non bold part of title',
    },
    {
      type: 'string',
      label: 'Subtitle',
      name: 'subtext',
      description: 'Optional text displayed under the title',
    },
    // GALLERY SECTION
    {
      type: 'object',
      label: 'Photo Gallery',
      name: 'gallery',
      description: 'Optional photo gallery for the post',
      fields: [
        {
          type: 'boolean',
          label: 'Show Gallery',
          name: 'enabled',
          description: 'Toggle gallery on/off for this post',
          ui: {
            defaultValue: false,
          }
        },
        ...AutoDetectGallerySchema.fields, // Spreads all the gallery fields
      ],
      ui: {
        defaultItem: {
          enabled: false,
          folderPath: '',
          layout: 'masonry',
          columns: 'three',
          gap: 'medium',
          lightbox: true,
          images: []
        }
      }
    },
    
    // METADATA (optional - for SEO, dates, etc)
    {
      type: 'datetime',
      label: 'Published Date',
      name: 'date',
    },
    {
      type: 'reference',
      label: 'Author',
      name: 'author',
      collections: ['author'],
    },
    // {
    //   type: 'string',
    //   label: 'Tags',
    //   name: 'tags',
    //   list: true,
    //   ui: {
    //     component: 'tags',
    //   },
    // },
    // {
    //   type: 'string',
    //   label: 'Excerpt',
    //   name: 'excerpt',
    //   description: 'Short description of the post',
    //   ui: {
    //     component: 'textarea',
    //   }
    // },
    
    // POST CONTENT - This comes last and is the main MDX body
    {
      type: 'rich-text',
      label: 'Body',
      name: 'body',
      isBody: true,
      templates: [
        {
          name: 'BlockQuote',
          label: 'Block Quote',
          fields: [
            {
              name: 'quote',
              label: 'Quote',
              type: 'string',
              ui: {
                component: 'textarea'
              }
            },
            {
              name: 'author',
              label: 'Author',
              type: 'string'
            }
          ]
        }
        // Add more custom components as needed
      ]
    }
  ],
};

export default Post;