import AuthComponent from "@/components/shared/AuthComponent";
import React, { Suspense } from "react";

function page() {
  return (
    <div>
      <Suspense>
        <AuthComponent />
      </Suspense>
    </div>
  );
}

export default page;
