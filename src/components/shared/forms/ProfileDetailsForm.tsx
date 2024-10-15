"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/(protected)/profile/actions";
import useProcessFace from "@/utils/hooks/useProcessFace";
import { useRouter } from "next/navigation";

const profileDetailFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
  full_name: z
    .string()
    .min(2, {
      message: "Full name must be at least 2 characters.",
    })
    .max(30, {
      message: "Full name must not be longer than 30 characters.",
    }),
  avatar_url: z.string().optional(),
  face_url: z.string().optional(),
  prompt: z
    .string({
      required_error: "Please add a facial description.",
    })
    .min(2, {
      message: "Please add a facial description.",
    }),
});

type ProfileDetailFormValues = z.infer<typeof profileDetailFormSchema>;

const ProfileDetailForm: React.FC = () => {
  const router = useRouter();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  console.log(profile);
  const { mutate: processFace, isPending, error } = useProcessFace();

  const inputAvatarImageRef = useRef<HTMLInputElement>(null);
  const inputFaceImageRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileDetailFormValues>({
    resolver: zodResolver(profileDetailFormSchema),
    defaultValues: {
      username: "",
      full_name: "",
      avatar_url: "",
      face_url: "",
      prompt: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile?.username || "",
        full_name: profile?.full_name || "",
        avatar_url: profile?.avatar_url || "",
        face_url: profile?.face?.face_url || "",
        prompt: profile?.face?.prompt || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit: SubmitHandler<ProfileDetailFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await updateProfile(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error?.message || "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadFace = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isPending || isSubmitting) return;
    setIsSubmitting(true);

    processFace(
      {
        file,
        profileId: profile.id,
        type: "realistic",
      },
      {
        onSuccess: ({ faceId }) => {
          setIsSubmitting(false);
          router.push(`/profile`);
        },
      }
    );
  };

  const handleUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      const { publicUrl, path } = await uploadImage(
        file,
        "avatars",
        `${profile.id}/`
      );
      // Update the avatar_url in the form and profile
      form.setValue("avatar_url", publicUrl);
      await updateProfile({
        avatar_url: publicUrl,
        avatar_image_path: path,
      });
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

  if (isLoadingProfile) {
    // Render skeletons as placeholders
    return <>{/* ...Skeleton components as in your original code... */}</>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">Personal info</p>
            <p className="text-muted-foreground">
              Update your photo and personal details here.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              className="w-[100px]"
              onClick={() => {
                if (profile) {
                  form.reset({
                    full_name: profile.full_name || "",
                    username: profile.username || "",
                    face_url: profile.face.face_url || "",
                    prompt: profile.face.prompt || "",
                    avatar_url: profile.avatar_url || "",
                  });
                }
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-[100px]" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </div>

        <hr className="border-muted my-5" />

        <div>
          <div className="mb-8">
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
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
                        "w-[100px] h-[100px] flex-none cursor-pointer",
                        {
                          "border-2 border-dashed border-foreground/20":
                            !field.value,
                        }
                      )}
                      onClick={() => inputAvatarImageRef.current?.click()}
                    >
                      <AvatarImage src={field.value} />
                      <AvatarFallback>
                        <UserPlus name="user-plus" />
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <Button
                        variant="outline"
                        type="button"
                        className="mb-5"
                        onClick={() => inputAvatarImageRef.current?.click()}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Uploading..." : "Upload new image"}
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

          <div className="grid grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center justify-start pt-8 w-full">
            <FormField
              control={form.control}
              name="face_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Face</FormLabel>
                  <FormControl>
                    <input
                      ref={inputFaceImageRef}
                      onChange={handleUploadFace}
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                    />
                  </FormControl>

                  <div className="flex items-start space-x-5">
                    <Avatar
                      className={cn(
                        "w-[200px] h-[200px] flex-none cursor-pointer rounded-md",
                        {
                          "border-2 border-dashed border-foreground/20":
                            !field.value,
                        }
                      )}
                      onClick={() => inputFaceImageRef.current?.click()}
                    >
                      <AvatarImage src={field.value} />
                      <AvatarFallback>
                        <UserPlus name="user-plus" />
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <Button
                        variant="outline"
                        type="button"
                        className="mb-5"
                        onClick={() => inputFaceImageRef.current?.click()}
                        disabled={isSubmitting}
                      >
                        Upload new Face
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
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem className="pt-6">
                <FormLabel>Face Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Facial description..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default ProfileDetailForm;
