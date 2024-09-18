"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils";
import BoringAvatar from "boring-avatars"; // Import Boring Avatars for generating fallback avatars

export function GenericAvatar({
  src,
  email,
  name,
  className,
}: {
  src: string;
  email: string;
  name?: string;
  className: string;
}) {
  return (
    <Avatar className={cn("h-8 w-8 aspect-square", className)}>
      <AvatarImage src={src} className="object-cover" />
      <AvatarFallback>
        <BoringAvatar
          name={email || name || "fallback"}
          variant="beam"
          size={32} // Adjust size as needed
          colors={["#FF675E", "#FF44EC", "#44BCFF"]}
        />
      </AvatarFallback>
    </Avatar>
  );
}
