"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils";
import Image from "next/image";
import BoringAvatar from "boring-avatars"; // Import Boring Avatars for generating fallback avatars

function generateAvatarURL(email: string) {
  return `https://source.boringavatars.com/beam/120/${email}?colors=FF675E,FF44EC,44BCFF`;
}

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
  const fallbackAvatar = generateAvatarURL(email || name || "fallback");

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
