"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "../../icon";
import { useLayout } from "../layout-context";

export const Footer = () => {
  const { globalSettings } = useLayout();
  const { header, footer } = globalSettings!;

  return (
    <footer className="border-b bg-transparent pt-20">
      <div className=" border-t px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-6 py-6 flex-col md:flex-row md:justify-between">

          <div className="order-last flex justify-center md:order-first md:justify-start">
            <Link href="/" aria-label="go home">
              {header?.logo ? (
                <img 
                  src={header.logo}
                  alt={header.name || "Logo"}
                  className="h-6 w-auto object-contain"
                />
              ) : (
                <span className="font-semibold">{header?.name}</span>
              )}
            </Link>
            <span className="self-center text-muted-foreground text-sm ml-2">© {new Date().getFullYear()} {header?.name}, All rights reserved</span>
          </div>

          <div className="order-first flex justify-center gap-6 text-sm md:order-last md:justify-end">
            {footer?.social?.map((link, index) => (
              <Link key={`${link!.icon?.name}${index}`} href={link!.url!} target="_blank" rel="noopener noreferrer" >
                <Icon data={{ ...link!.icon, size: 'small' }} className="text-muted-foreground hover:text-primary block" />
              </Link>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}