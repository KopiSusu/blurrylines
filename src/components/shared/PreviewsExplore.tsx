// /app/(protected)/previews/page.tsx
import {
  getExplorePreviews,
  getPreviews,
} from "@/app/(protected)/previews/action";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { GenericAvatar } from "./GenericAvatar";
import { getTimeFromNow } from "@/utils";

// Server component to display previews
export default async function PreviewsExplore() {
  const { previews } = await getExplorePreviews();

  return (
    <div className="columns-1xs sm:columns-2xs lg:columns-3xs gap-6 p-6 space-y-6">
      {previews?.map((preview: any) => (
        <PreviewCard key={preview.id} preview={preview} />
      ))}
    </div>
  );
}

// Card component for each preview
function PreviewCard({ preview }: { preview: any }) {
  return (
    <div className="group perspective w-full break-inside-avoid mb-6">
      <Link
        href={`/explore/${preview.profile?.id}`}
        className="w-full h-full relative group perspective break-inside-avoid mb-6"
      >
        <div className="relative w-full transform-style-3d transition-transform duration-500 border shadow-lg rounded-lg overflow-hidden">
          {/* Back side showing the original image */}
          <div className="relative backface-hidden transform rotate-y-180 transition-all">
            <Image
              src={preview.original_url}
              alt="Original Image"
              // fill
              height={preview.height}
              width={preview.width}
              className="object-cover"
            />
          </div>
          {/* Front side showing the preview image */}
          <div className="absolute top-0 left-0 right-0 backface-hidden transition-all group-hover:opacity-0">
            {preview?.preview_url !== null && (
              <Image
                src={preview.preview_url}
                alt="Preview Image"
                // fill
                height={preview.height}
                width={preview.width}
                className="object-cover"
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between relative space-x-2 w-full border-t p-2 px-0">
          <div className="w-3/5 text-start">
            <h4 className="text-sm truncate">{preview.profile?.username}</h4>
            <p className="text-xs opacity-70">
              Edited {getTimeFromNow(preview.updated_at)}
            </p>
          </div>
          <div className="flex flex-1 items-center justify-end relative space-x-2">
            <div className="flex items-center relative z-0">
              <GenericAvatar
                src={preview.profile?.avatar_url}
                email={preview.profile?.email || "fallback-" + Math.random()}
                className={`border-4 border-background cursor-pointer`}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
