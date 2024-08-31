"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Copy, Menu } from "lucide-react";
import { navLinks } from "@/utils/constants";
import useProfile from "@/utils/hooks/useProfile";
import { signOut } from "@/app/(auth)/login/actions";

const MobileNavbar = () => {
  const pathname = usePathname();
  const { data: profile, isLoading } = useProfile();

  return (
    <header className="header flex fixed top-0 left-0 right-0 justify-between md:hidden w-screen bg-background/90 py-4 px-8">
      <div className="flex-grow-0">
        <Link href="/" className="flex items-center gap-2 md:py-2">
          <Copy />
          <b className="text-xl">JustaPeek</b>
        </Link>
      </div>

      <nav className="flex gap-2 flex-grow justify-end px-0">
        {profile && (
          <>
            <Sheet>
              <SheetTrigger>
                <Menu />
              </SheetTrigger>
              <SheetContent className="sheet-content sm:w-64 p-0">
                <aside className="h-screen">
                  <div className="flex size-full flex-col gap-0">
                    <Link
                      href="/"
                      className="sidebar-logo flex items-center justify-start space-x-2 p-6 border-b"
                    >
                      <Copy />
                      <b className="text-xl">JustaPeek</b>
                    </Link>
                    <nav className="flex flex-col justify-between items-start w-full h-full">
                      <ul className="w-full">
                        {navLinks.slice(0, 2).map((link, index) => {
                          const isActive = link.route === pathname;
                          const Icon = link.icon;
                          return (
                            <li
                              key={link.route}
                              className={`group flex w-full border-b hover:bg-primary/10  ${
                                isActive
                                  ? "bg-primary/30 text-white"
                                  : "text-foreground"
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
                        {navLinks.slice(2).map((link) => {
                          const isActive = link.route === pathname;
                          const Icon = link.icon;

                          return (
                            <li
                              key={link.route}
                              className={`group flex w-full border-b hover:bg-primary/10  ${
                                isActive
                                  ? "bg-primary/30 text-white"
                                  : "text-foreground"
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
              </SheetContent>
            </Sheet>
          </>
        )}
        {!profile && (
          <>
            <Button asChild className="button bg-purple-gradient bg-cover">
              <Link href="/sign-in">Login</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
};

export default MobileNavbar;
