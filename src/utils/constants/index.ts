import { Camera,Image, Hexagon, Home, PaintBucket, RemoveFormatting, User, Wallet, GalleryHorizontal, ImagePlus } from "lucide-react";
import react from "react";

export const protectedPaths = ["/private"];
export const authPaths = ["/login"];

export const navLinks = [
  {
    label: "Home",
    route: "/",
    icon: Home,
  },
  {
    label: "Previews",
    route: "/previews",
    icon: GalleryHorizontal
  },
  {
    label: "Generate preview",
    route: "/preview",
    icon: ImagePlus
  },
  {
    label: "Profile",
    route: "/profile",
    icon: User
  },
  {
    label: "subscription",
    route: "/subscription",
    icon: Wallet
  },
];