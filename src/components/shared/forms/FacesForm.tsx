"use client";
// /components/FacesForm.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useRef, ChangeEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import useProfile from "@/utils/hooks/useProfile";
import { cn } from "@/utils";
import { uploadImage } from "@/utils/client/uploadImage";

const FacesFormSchema = z.object({
  realistic_url: z.string().optional(),
  anime_url: z.string().optional(),
});

type FacesFormValues = z.infer<typeof FacesFormSchema>;

const FacesForm: React.FC = () => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();

  const inputAvatarImageRef = useRef<HTMLInputElement>(null);

  const defaultValues: FacesFormValues = {
    realistic_url: profile?.realistic_url || "",
    anime_url: profile?.anime_url || "",
  };

  const form = useForm<FacesFormValues>({
    resolver: zodResolver(FacesFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const isLoadingUpdateUser = false; // Replace with your actual loading state

  const onSubmit: SubmitHandler<FacesFormValues> = async (data) => {
    try {
      // await updateUser({
      //   username: data.username,
      //   full_name: data.full_name,
      //   scope_access: data.scope,
      // });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error?.message || "An error occurred.",
      });
    }
  };

  const handleUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      const uploaded = await uploadImage(file, "profiles", `${profile.id}/`);
      // await updateUser({ anime_url: uploaded.publicUrl });
      toast({
        title: "Avatar updated",
        description: "Your profile avatar has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to upload image",
        description: error.message || "An error occurred.",
      });
    }
  };

  useEffect(() => {
    if (profile) {
      form.reset({
        realistic_url: profile.realistic_url || "",
        anime_url: profile.anime_url || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (isLoadingProfile) {
    return (
      <>
        <div className="grid grid-cols-2">
          <div className="mb-8 flex items-center space-x-5">
            <Skeleton className="h-[100px] w-[100px] rounded-full bg-foreground/10 mb-3" />
            <div>
              <Skeleton className="h-6 w-[100px] rounded-full bg-foreground/10 mb-3" />
              <Skeleton className="h-6 w-[150px] rounded-full bg-foreground/10 mb-3" />
            </div>
          </div>

          <div className="mb-8 flex items-center space-x-5">
            <Skeleton className="h-[100px] w-[100px] rounded-full bg-foreground/10 mb-3" />
            <div>
              <Skeleton className="h-6 w-[100px] rounded-full bg-foreground/10 mb-3" />
              <Skeleton className="h-6 w-[150px] rounded-full bg-foreground/10 mb-3" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between border-t mt-8 pt-4">
          <div>
            <p className="font-semibold text-lg">Faces</p>
            <p className="text-muted-foreground">
              Create your anime and realistic AI face.
            </p>
          </div>
          <div className="flex items-center space-x-2"></div>
        </div>

        <hr className="border-muted my-5" />

        <div>
          <div className="mb-8 grid items-center justify-start grid-cols-2">
            <FormField
              control={form.control}
              name="realistic_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Realistic Face</FormLabel>
                  <FormControl>
                    <input
                      ref={inputAvatarImageRef}
                      onChange={handleUploadAvatar}
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                    />
                  </FormControl>

                  <div className="flex items-center space-x-5">
                    <Avatar
                      className={cn(
                        "w-[100px] h-[100px] flex-none cursor-pointer rounded-md",
                        {
                          "border-2 border-dashed border-foreground/20":
                            !field.value,
                        }
                      )}
                      onClick={() => inputAvatarImageRef.current?.click()}
                    >
                      <AvatarImage src={field.value} />
                      <AvatarFallback className="rounded-md">
                        <UserPlus name="user-plus" />
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <Button
                        variant="outline"
                        type="button"
                        className="mb-5"
                        onClick={() => inputAvatarImageRef.current?.click()}
                        disabled={isLoadingUpdateUser}
                      >
                        Upload new image
                      </Button>

                      <FormDescription>
                        At least 800x800 px recommended. <br /> JPG, PNG, or GIF
                        is allowed.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="anime_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anime Face</FormLabel>
                  <FormControl>
                    <input
                      ref={inputAvatarImageRef}
                      onChange={handleUploadAvatar}
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                    />
                  </FormControl>

                  <div className="flex items-center space-x-5">
                    <Avatar
                      className={cn(
                        "w-[100px] h-[100px] flex-none cursor-pointer rounded-md",
                        {
                          "border-2 border-dashed border-foreground/20":
                            !field.value,
                        }
                      )}
                      onClick={() => inputAvatarImageRef.current?.click()}
                    >
                      <AvatarImage src={field.value} />
                      <AvatarFallback className="rounded-md">
                        <UserPlus name="user-plus" />
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <Button
                        variant="outline"
                        type="button"
                        className="mb-5"
                        onClick={() => inputAvatarImageRef.current?.click()}
                        disabled={isLoadingUpdateUser}
                      >
                        Upload new image
                      </Button>

                      <FormDescription>
                        At least 800x800 px recommended. <br /> JPG, PNG, or GIF
                        is allowed.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};

export default FacesForm;
