import { AutoGallery } from '@/components/blocks/autoGallery';

export default function BlogPost({ post }: any) {
  return (
    <article>
      {/* TITLE SECTION */}
      <header className="text-center py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
              {post.subtitle}
            </p>
          )}
          {post.date && (
            <time className="text-sm text-gray-500 mt-4 block">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          )}
        </div>
      </header>

      {/* GALLERY SECTION */}
      {post.gallery?.enabled && post.gallery?.folderPath && (
        <section className="mb-12">
          <AutoGallery data={post.gallery} />
        </section>
      )}

      {/* POST CONTENT */}
      <div className="prose prose-lg dark:prose-invert mx-auto px-4 max-w-4xl">
        {/* This is where your MDX content gets rendered */}
        {/* The exact implementation depends on your setup */}
        {/* For TinaCMS, it might be: */}
        <TinaMarkdown content={post._body} />
        {/* Or for plain MDX: */}
        {children}
      </div>
    </article>
  );
}