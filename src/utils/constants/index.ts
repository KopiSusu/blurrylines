import { Camera,Image, Hexagon, Home, PaintBucket, RemoveFormatting, User, Wallet } from "lucide-react";
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
    label: "Preview Generator",
    route: "/preview",
    icon: Image
  },
  {
    label: "Profile",
    route: "/profile",
    icon: User
  },
  {
    label: "subscription",
    route: "/credits",
    icon: Wallet
  },
];