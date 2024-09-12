import PreviewsProfile from "@/components/shared/PreviewsProfile";
import ProfileExploreHeader from "@/components/shared/profile/ProfileExploreHeader";
import React from "react";

function page({ params }: { params: { id: string } }) {
  return (
    <>
      <ProfileExploreHeader id={params.id} />
      <PreviewsProfile id={params.id} />
    </>
  );
}

export default page;
