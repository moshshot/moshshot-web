import Layout from '@/components/layout/layout';
import client from '@/tina/__generated__/client';
import ReviewsClientPage from './client-page';

export const revalidate = 300;

export default async function ReviewsPage() {
  let reviews = await client.queries.reviewConnection({
    sort: 'date',
    last: 1
  });
  const allReviews = reviews;

  if (!allReviews.data.reviewConnection.edges) {
    return [];
  }

  while (reviews.data?.reviewConnection.pageInfo.hasPreviousPage) {
    reviews = await client.queries.reviewConnection({
      sort: 'date',
      before: reviews.data.reviewConnection.pageInfo.endCursor,
    });

    if (!reviews.data.reviewConnection.edges) {
      break;
    }

    allReviews.data.reviewConnection.edges.push(...reviews.data.reviewConnection.edges.reverse());
  }

  return (
    <Layout rawPageData={allReviews.data}>
      <ReviewsClientPage {...allReviews} />
    </Layout>
  );
}