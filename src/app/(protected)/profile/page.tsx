import FacesForm from "@/components/shared/forms/FacesForm";
import ProfileDetailForm from "@/components/shared/forms/ProfileDetailsForm";
import React from "react";

function profile() {
  return (
    <>
      <div className=" max-w-6xl mx-auto">
        <ProfileDetailForm />
        {/* <FacesForm /> */}
      </div>
    </>
  );
}

export default profile;
