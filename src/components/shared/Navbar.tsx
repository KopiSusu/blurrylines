"use client";

import { signOut } from "@/app/(auth)/login/actions";
import { navLinks, sidebarLinks } from "@/utils/constants";
import useProfile from "@/utils/hooks/useProfile";
import { Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";
import { ProfileMenu } from "./profile/ProfileMenu";

function Navbar() {
  const pathname = usePathname();
  const { data: profile, isLoading } = useProfile();

  return (
    <header className="border-b w-full sticky top-0 left-0 px-6 py-4 bg-background shadow-md z-50">
      <div className="w-full max-w-6xl flex items-center justify-between mx-auto">
        <Link href="/" className="flex items-center justify-start space-x-2">
          <Copy />
          <b className="text-xl">BlurryLines</b>
        </Link>
        <nav className="flex items-center space-x-6">
          <ul className="flex items-center space-x-4">
            {navLinks.map((link) => {
              const isActive = link.route === pathname;
              if (link.protected === true && !profile?.id) return;
              return (
                <li key={link.route} className="group">
                  <Link
                    className={`flex transition-all items-center underline-offset-4 space-x-2 px-3 py-2 rounded hover:underline ${
                      isActive ? "underline text-foreground" : "text-foreground"
                    }`}
                    href={link.route}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center space-x-4">
          {profile !== null ? (
            <>
              {(!profile?.face || !profile?.face?.face_image_path) && (
                <Link href="/profile" className="flex items-center gap-2">
                  <Button className="w-full">Generate Face</Button>
                </Link>
              )}
              {profile?.face && profile?.face?.face_image_path && (
                <Link href="/preview" className="flex items-center gap-2">
                  <Button className="w-full">Generate Preview</Button>
                </Link>
              )}
              <ProfileMenu />
            </>
          ) : (
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
