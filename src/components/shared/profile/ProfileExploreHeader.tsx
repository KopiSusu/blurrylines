import { getProfileById } from "@/app/(protected)/profile/actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import useProfile from "@/utils/hooks/useProfile";
import { UserPlus } from "lucide-react";
import React from "react";
import { GenericAvatar } from "../GenericAvatar";

async function ProfileExploreHeader({ id }: { id: string }) {
  const { profile } = await getProfileById(id);
  return (
    <div className="w-full flex items-center justify-center py-8">
      <div className="relative rounded-lg p-2 bg-transparent border-none">
        <div className="flex-1 flex flex-col items-center justify-center space-x-2">
          <div>
            <div className="cursor-pointer relative inline-flex group w-full bg-gradient-to-r  from-primary via-secondary to-destructive p-0.5 rounded-full">
              <div className="absolute transition-all opacity-80 -inset-px bg-gradient-to-r from-primary via-secondary to-destructive rounded-full blur-md group-hover:opacity-100 group-hover:-inset-1 animate-tilt" />

              {/* <Avatar
                className={
                  "w-[45px] h-[45px] aspect-square flex-none rounded-full"
                }
              >
                <AvatarImage
                  src={profile?.avatar_url}
                  className="rounded-full object-cover aspect-square"
                />
                <AvatarFallback className="aspect-square w-[45px] h-[45px] flex items-center justify-center">
                  <UserPlus name="user-plus" />
                </AvatarFallback>
              </Avatar> */}
              <GenericAvatar
                src={profile?.avatar_url}
                email={profile?.email || "fallback-" + Math.random()}
                className={`border-4 border-background cursor-pointer object-cover w-[45px] h-[45px] aspect-square flex-none rounded-full`}
              />
            </div>
          </div>

          <>
            <div className="flex-1 relative pt-2 flex flex-col items-center justify-center">
              <h4 className="mb-0 capitalize text-center">
                {profile?.username}
              </h4>
              <p className="mb-0 text-xs opacity-80 text-center truncate relative overflow-hidden">
                by @{profile?.username}
              </p>

              <p className="text-xs line-clamp-3 max-w-md text-center pt-2">
                {profile?.email}
              </p>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}

export default ProfileExploreHeader;
