// /app/(protected)/previews/page.tsx
import { getPreviews } from "@/app/(protected)/previews/action";
import Image from "next/image";
import Link from "next/link";
import React from "react";

// Server component to display previews
export default async function Previews() {
  const { previews } = await getPreviews();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {previews?.map((preview: any) => (
        <PreviewCard key={preview.id} preview={preview} />
      ))}
    </div>
  );
}

// Card component for each preview
function PreviewCard({ preview }: { preview: any }) {
  return (
    <Link href={`/preview/${preview.id}`}>
      <div className="group perspective w-full max-w-xs mx-auto">
        <div className="relative w-full h-60 transform-style-3d transition-transform duration-500 group-hover:rotate-y-180">
          {/* Back side showing the original image */}
          <div className="absolute w-full h-full backface-hidden transform rotate-y-180 rounded-lg shadow-lg border transition-all">
            <Image
              src={preview.original_url}
              alt="Original Image"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          {/* Front side showing the preview image */}
          <div className="absolute w-full h-full backface-hidden rounded-lg shadow-lg border transition-all group-hover:opacity-0">
            {preview?.preview_url !== null && (
              <Image
                src={preview.preview_url}
                alt="Preview Image"
                fill
                className="object-cover rounded-lg"
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
