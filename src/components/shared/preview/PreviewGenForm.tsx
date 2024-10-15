// /components/shared/PreviewGenForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, UploadCloud, ImageOff, ChevronDown } from "lucide-react";
import Image from "next/image";
import { usePreview } from "@/components/providers/RealtimePreviewProvider"; // Import the custom hook
import useProcessImage from "@/utils/hooks/useProcessImage";
import useProfile from "@/utils/hooks/useProfile";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import Link from "next/link";

// Define your form schema
const formSchema = z.object({
  image: z.any(),
  prompt: z.string().optional(),
});

export default function PreviewGenForm() {
  const preview = usePreview(); // Get the updated preview from the context
  const [previewImage, setPreviewImage] = useState<string | null>(
    preview?.original_url || null
  );
  const [isTaskLoading, setIstaskLoading] = useState<boolean | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(
    preview?.preview_url || null
  );
  const router = useRouter();
  const [generationType, setGenerationType] = useState<string>("realistic");
  const { data: profile, isLoading } = useProfile();
  const { mutate: processImage, isPending, error } = useProcessImage();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: null,
      prompt: "",
    },
  });

  // Update form state when the preview context changes
  useEffect(() => {
    if (preview) {
      setPreviewImage(preview.original_url || null);
      setIstaskLoading(preview.task_id && !preview.preview_url ? true : null);
      setTransformedImage(preview.preview_url || null);

      // Update the form prompt field when preview changes
      form.setValue("prompt", preview.prompt || "");
    }
  }, [preview, form]);

  const handleImageUpload = (data: any) => {
    const file = data.image?.[0];
    if (!file && !isLoading && !isPending && !isTaskLoading) return;

    processImage(
      {
        file,
        prompt: data.prompt || "Generate a preview image of the original image",
        profileId: profile.id,
        type: generationType || "realistic",
      },
      {
        onSuccess: ({ previewId }) => {
          router.push(`/preview/${previewId}`);
        },
      }
    );
  };

  const isFormLoading = isLoading || isPending || isTaskLoading;

  console.log(profile);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleImageUpload)}
        className="flex flex-col gap-6 p-6 items-center justify-center"
      >
        <section className="flex gap-6 p-6 pb-0 w-full justify-center">
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem className="w-full max-w-md flex-shrink-0 p-0 text-center">
                <FormLabel>Upload Image</FormLabel>
                <FormControl>
                  <label
                    htmlFor="image-upload"
                    className="w-full h-[60vh] bg-card border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-foreground/50 focus:outline-none focus:border-blue-500 transition"
                  >
                    {previewImage ? (
                      <Image
                        src={previewImage}
                        alt="Uploaded Preview"
                        className="w-full h-full object-cover rounded-lg"
                        width={200}
                        height={200}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UploadCloud className="w-8 h-8" />
                        <span className="text-foreground">
                          Click or drag to upload an image
                        </span>
                      </div>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        field.onChange(e.target.files);
                        form.trigger("image");
                        if (e.target.files?.[0]) {
                          setPreviewImage(
                            URL.createObjectURL(e.target.files[0])
                          );
                        }
                      }}
                    />
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="h-[40vh] flex items-center justify-center">
            <ArrowRight />
          </div>

          <div className="w-full max-w-md flex-shrink-0">
            <h3 className="mb-2 text-foreground text-center">Preview Image</h3>
            <div className="w-full h-[60vh] border-2 border-dashed bg-border rounded-lg flex items-center justify-center">
              {transformedImage ? (
                <Image
                  src={transformedImage}
                  alt="Transformed Image"
                  className="w-full h-full object-cover rounded-lg"
                  width={200}
                  height={200}
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <ImageOff className="w-8 h-8" />
                  <span className="text-foreground">
                    {isFormLoading
                      ? "Processing image..."
                      : "No transformed image yet"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex space-x-2">
          {/* Select for generation type */}
          <Select
            onValueChange={(value) => setGenerationType(value)}
            defaultValue={generationType}
          >
            <SelectTrigger className="max-w-[20vw] w-[150px]">
              <SelectValue placeholder="Select Generation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {(!profile?.face || !profile?.face.face_image_path) && (
            <Link href="/profile">
              <Button type="button" className="w-[20vw] mx-auto capitalize">
                Generate Face
              </Button>
            </Link>
          )}
          {profile?.face && profile?.face.face_image_path && (
            <Button type="submit" className="w-[20vw] mx-auto capitalize">
              {isFormLoading
                ? "Generating..."
                : `Generate ${generationType} Preview`}
            </Button>
          )}
          {/* Button to submit form */}
        </div>
        {error && <p className="text-red-500">Error: {error.message}</p>}
      </form>
    </Form>
  );
}
