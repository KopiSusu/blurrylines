import Sidebar from "@/components/shared/Sidebar";
import React from "react";
import { getProfile } from "./profile/actions";
import { redirect } from "next/navigation";
import MobileNavbar from "@/components/shared/MobileNavbar";

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <main id="root" className="flex items-start justify-start">
      <Sidebar />
      <MobileNavbar />
      <div id="root-container" className="flex-1 flex-shrink-0">
        <div id="wrapper" className="px-8 py-8">
          {children}
        </div>
      </div>
    </main>
  );
}

export default ProtectedLayout;
