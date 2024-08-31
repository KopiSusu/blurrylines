import Price from "@/components/subscription/Price";
import { Github, Youtube } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function Page() {
  return (
    <div className="space-y-10">
      <Price />
      <div className=" border-t pt-10">
        <h1 className="text-xl font-bold">
          Thank you cloning my boilerplate project.
        </h1>
        <p>If you want to support me. Follow me here</p>
        <div className="mt-5">
          <div className="flex items-center gap-5">
            <Link
              href={"https://www.youtube.com/c/DailyWebCoding"}
              target="_blank"
            >
              <Youtube className="h-8 w-8 hover:scale-105" />
            </Link>
            <Link href={"https://github.com/Chensokheng"} target="_blank">
              <Github className="h-8 w-8 hover:scale-105" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
