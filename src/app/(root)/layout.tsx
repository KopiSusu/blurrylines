import MobileNavbar from "@/components/shared/MobileNavbar";
import Sidebar from "@/components/shared/Sidebar";
import React from "react";

function RootLayout({ children }: { children: React.ReactNode }) {
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

export default RootLayout;
