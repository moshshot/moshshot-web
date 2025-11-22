import React from 'react';
import client from '@/tina/__generated__/client';
import Layout from '@/components/layout/layout';
import ReviewClientPage from './client-page';

export const revalidate = 300;

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ urlSegments: string[] }>;
}) {
  const resolvedParams = await params;
  const filepath = resolvedParams.urlSegments.join('/');
  const data = await client.queries.review({
    relativePath: `${filepath}.mdx`,
  });

  return (
    <Layout rawPageData={data}>
      <ReviewClientPage {...data} />
    </Layout>
  );
}

export async function generateStaticParams() {
  let reviews = await client.queries.reviewConnection();
  const allReviews = reviews;

  if (!allReviews.data.reviewConnection.edges) {
    return [];
  }

  while (reviews.data?.reviewConnection.pageInfo.hasNextPage) {
    reviews = await client.queries.reviewConnection({
      after: reviews.data.reviewConnection.pageInfo.endCursor,
    });

    if (!reviews.data.reviewConnection.edges) {
      break;
    }

    allReviews.data.reviewConnection.edges.push(...reviews.data.reviewConnection.edges);
  }

  const params =
    allReviews.data?.reviewConnection.edges.map((edge) => ({
      urlSegments: edge?.node?._sys.breadcrumbs,
    })) || [];

  return params;
}