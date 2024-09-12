import PreviewsExplore from "@/components/shared/PreviewsExplore";
import Price from "@/components/subscription/Price";
import { Github, Youtube } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function Page() {
  return (
    <div className="space-y-10">
      <Price />
      <PreviewsExplore />
    </div>
  );
}
