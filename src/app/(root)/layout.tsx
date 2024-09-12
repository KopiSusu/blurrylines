import MobileNavbar from "@/components/shared/MobileNavbar";
import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import React from "react";

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="root" className="flex flex-col items-start justify-start">
      <Navbar />
      <MobileNavbar />
      <div
        id="root-container"
        className="flex-1 flex-shrink-0 w-full md:max-w-4xl lg:max-w-7xl mx-auto"
      >
        <div id="wrapper" className="px-8 py-8">
          {children}
        </div>
      </div>
    </main>
  );
}

export default RootLayout;
