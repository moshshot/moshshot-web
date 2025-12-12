"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import {
  ReviewConnectionQuery,
  ReviewConnectionQueryVariables,
} from "@/tina/__generated__/types";
import ErrorBoundary from "@/components/error-boundary";
import { ArrowRight, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/layout/section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClientReviewProps {
  data: ReviewConnectionQuery;
  variables: ReviewConnectionQueryVariables;
  query: string;
}

export default function ReviewsClientPage(props: ClientReviewProps) {
  const reviews = props.data?.reviewConnection.edges!.map((reviewData) => {
    const review = reviewData!.node!;
    const date = new Date(review.date!);
    let formattedDate = "";
    if (!isNaN(date.getTime())) {
      formattedDate = format(date, "MMM dd, yyyy");
    }

    return {
      id: review.id,
      published: formattedDate,
      title: review.title,
      subtitle: review.subtitle,
      tags: review.tags?.map((tag) => tag?.tag?.name) || [],
      url: `/review/${review._sys.breadcrumbs.join("/")}`,
      excerpt: review.excerpt,
      heroImg: review.heroImg,
      author: {
        name: review.author?.name || "Anonymous",
        avatar: review.author?.avatar,
      },
      gallery: review.gallery,
      subtext: review.subtext,
    };
  });

  const handleClick = (url) => {
    window.location = url
  }

  return (
    <ErrorBoundary>
      <Section>
        <div className="container py-20 flex flex-col items-center m-auto">
          <div className="grid gap-y-2 sm:grid-cols-12 md:gap-y-4">
            {reviews.map((review) => {
              let useImage;
              if (review.gallery?.images?.length) {
                if (review.gallery?.images[0]) {
                  useImage = review.gallery.images[0].path || "";
                }
              }

              return (
                <Card
                  key={review.id}
                  className="order-last border-1 rounded-md p-4 bg-transparent shadow-none sm:order-first col-span-12 cursor-pointer hover:bg-white/2 transition-all w-full md:max-w-250"
                  onClick={() => handleClick(review.url)}
                >
                  <div className="flex flex-row gap-4">
                    <div className="flex-4">
                      <Link href={review.url} className="block">
                        <div className="aspect-[16/9] overflow-clip rounded-lg border border-border bg-white/1">
                          {useImage ? (
                            <Image
                              width={533}
                              height={300}
                              src={useImage}
                              alt={review.title}
                              className="h-full w-full object-cover transition-opacity duration-200 fade-in hover:opacity-70"
                            />
                          ) : (
                            <Image
                              width={533}
                              height={300}
                              src="/uploads/moshshot-logo-b.svg"
                              alt={review.title}
                              className="h-full w-full object-contain transition-opacity duration-200 fade-in hover:opacity-70"
                            />
                          )}
                        </div>
                      </Link>
                    </div>

                    <div className="flex-8 flex flex-col justify-center">
                      <h3 className="text-md font-semibold md:text-3xl lg:text-3xl capitalize">
                        <Link href={review.url} className="hover:underline">
                          {review.title}{" "}
                          <span className="font-light">
                            {review?.subtitle || ""}
                          </span>
                        </Link>
                      </h3>
                      <p className="text-sm md:text-md capitalize">
                        {review?.subtext || ""}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Section>
    </ErrorBoundary>
  );
}
