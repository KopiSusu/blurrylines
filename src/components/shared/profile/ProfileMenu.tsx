"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  LogOut,
  Moon,
  Subscript,
  Sun,
  User,
  UserPlus,
  Wallet,
} from "lucide-react";
import useProfile from "@/utils/hooks/useProfile";
import { GenericAvatar } from "../GenericAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { signOut } from "@/app/(auth)/login/actions";

export function ProfileMenu() {
  const [profileDialog, setProfileDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const { data: currentUser, isLoading: isCurrentUserLoading } = useProfile();
  const isLoading = isCurrentUserLoading;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    router.refresh();

    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: error.message,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  asChild
                  className="flex items-center-justify-center"
                >
                  <Button
                    variant="ghost"
                    className="aspect-square rounded-full p-0 m-0 h-8 w-8 "
                  >
                    {isLoading ? (
                      <Skeleton className="aspect-square w-full h-full rounded-full" />
                    ) : (
                      <GenericAvatar
                        src={currentUser?.avatar_url}
                        email={currentUser?.email || "fallback"}
                        className="cursor-pointer hover:opacity-80"
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={22}>
                  <p className="text-xs">Menu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="pb-0 text-md truncate font-medium">
            {currentUser?.username ||
              currentUser?.full_name ||
              currentUser?.email}
          </DropdownMenuLabel>
          <DropdownMenuLabel className="pt-0 text-xs font-normal text-foreground/50 truncate">
            {currentUser?.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <User name="user" className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/subscription")}
          >
            <Wallet name="user" className="mr-2 h-4 w-4" />
            <span>Subscription</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun
                  name="sun"
                  className=" rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-2 h-4 w-4"
                />
                <Moon
                  name="moon"
                  className="absolute  rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-2 h-4 w-4"
                />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="cursor-pointer"
                  >
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="cursor-pointer"
                  >
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="cursor-pointer"
                  >
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <form action={signOut} className="flex items-center justify-start">
              <Button className="w-full p-0 py-0 h-auto" variant="ghost">
                {" "}
                <LogOut name="log-out" className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
