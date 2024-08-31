"use client";

import { signOut } from "@/app/(auth)/login/actions";
import { navLinks } from "@/utils/constants";
import useProfile from "@/utils/hooks/useProfile";
import { Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";

function Sidebar() {
  const pathname = usePathname();
  const { data: profile, isLoading } = useProfile();

  return (
    <aside className="border-r h-screen w-[275px] sticky top-0 left-0 hidden md:block">
      <div className="flex size-full flex-col gap-0">
        <Link
          href="/"
          className="sidebar-logo flex items-center justify-start space-x-2 p-6 border-b"
        >
          <Copy />
          <b className="text-xl">BlurryLines</b>
        </Link>
        <nav className="flex flex-col justify-between items-start w-full h-full">
          <ul className="w-full">
            {navLinks.slice(0, 3).map((link, index) => {
              const isActive = link.route === pathname;
              const Icon = link.icon;
              return (
                <li
                  key={link.route}
                  className={`group flex w-full border-b hover:bg-primary/10  ${
                    isActive ? "bg-primary/30 text-white" : "text-foreground"
                  }`}
                >
                  <Link
                    className="sidebar-link flex items-center p-4 justify-start space-x-2 gap-4 w-full"
                    href={link.route}
                  >
                    <Icon />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="w-full flex flex-col justify-end items-end flex-grow flex-1 h-full">
            {navLinks.slice(3).map((link) => {
              const isActive = link.route === pathname;
              const Icon = link.icon;

              return (
                <li
                  key={link.route}
                  className={`group flex w-full border-b hover:bg-primary/10  ${
                    isActive ? "bg-primary/30 text-white" : "text-foreground"
                  }`}
                >
                  <Link
                    className="sidebar-link flex items-center p-4 justify-start space-x-2 gap-4 w-full"
                    href={link.route}
                  >
                    <Icon />
                    {link.label}
                  </Link>
                </li>
              );
            })}

            <li className="flex-center cursor-pointer gap-2 p-4 w-full">
              {profile !== null ? (
                <form
                  action={signOut}
                  className="flex items-center gap-2 w-full"
                >
                  <Button className="w-full">Sign Out</Button>
                </form>
              ) : (
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
