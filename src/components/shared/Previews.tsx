// /app/(protected)/previews/page.tsx
import { getPreviews } from "@/app/(protected)/previews/action";
import Image from "next/image";
import Link from "next/link";
import React from "react";

// Server component to display previews
export default async function Previews() {
  const { previews } = await getPreviews();

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
        href={`/preview/${preview.id}`}
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
      </Link>
    </div>
  );
}
