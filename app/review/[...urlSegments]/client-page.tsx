"use client";
import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { tinaField, useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { ReviewQuery } from "@/tina/__generated__/types";
import { useLayout } from "@/components/layout/layout-context";
import { Section } from "@/components/layout/section";
import { components } from "@/components/mdx-components";
import ErrorBoundary from "@/components/error-boundary";
import { AutoGallery } from "@/components/blocks/autoGallery";

const titleColorClasses = {
  blue: "from-blue-400 to-blue-600 dark:from-blue-300 dark:to-blue-500",
  teal: "from-teal-400 to-teal-600 dark:from-teal-300 dark:to-teal-500",
  green: "from-green-400 to-green-600",
  red: "from-red-400 to-red-600",
  pink: "from-pink-300 to-pink-500",
  purple: "from-purple-400 to-purple-600 dark:from-purple-300 dark:to-purple-500",
  orange: "from-orange-300 to-orange-600 dark:from-orange-200 dark:to-orange-500",
  yellow: "from-yellow-400 to-yellow-500 dark:from-yellow-300 dark:to-yellow-500",
};

interface ClientReviewProps {
  data: ReviewQuery;
  variables: {
    relativePath: string;
  };
  query: string;
}

export default function ReviewClientPage(props: ClientReviewProps) {
  const { theme } = useLayout();
  const { data } = useTina({ ...props });
  const review = data.review;

  const date = new Date(review.date!);
  let formattedDate = "";
  if (!isNaN(date.getTime())) {
    formattedDate = format(date, "MMM dd, yyyy");
  }

  const titleColour =
    titleColorClasses[theme!.color! as keyof typeof titleColorClasses];

  return (
    <ErrorBoundary>
      <Section>
        <div className="my-20">
          <h1
            data-tina-field={tinaField(review, "title")}
            className="w-full relative mb-4 md:mb-8 text-xl md:text-3xl lg:text-4xl font-semibold text-center capitalize"
          >
            {review.title}{" "}
            <span
              data-tina-field={tinaField(review, "subtitle")}
              className="font-light"
            >
              {review?.subtitle || ""}
            </span>
          </h1>
          {review.subtext && (
            <p
              data-tina-field={tinaField(review, "subtext")}
              className="text-lg md:text-2xl lg:text-3xl text-center text-neutral-200 mb-4 md:mb-8"
            >
              {review.subtext}
            </p>
          )}
          <div
            data-tina-field={tinaField(review, "body")}
            className="prose prose-gray w-full max-w-none text-center"
          >
            <TinaMarkdown
              content={review.body}
              components={{
                ...components,
              }}
            />
          </div>
        </div>

        {review.gallery?.enabled && review.gallery?.images?.length && (
          <div className="mb-12">
            <AutoGallery data={review.gallery} />
          </div>
        )}
      </Section>
    </ErrorBoundary>
  );
}