import { manageBilling } from "@/app/(protected)/stripe/actions";
import { Button } from "@/components/ui/button";
import React from "react";
import { getProfile } from "@/app/(protected)/profile/actions";

export default async function Page() {
  const { profile } = await getProfile();

  const handleBilling = async () => {
    if (profile?.subscription?.customer_id) {
      const data = await manageBilling(profile?.subscription?.customer_id);
      window.location.href = data.url;
    }
  };

  return (
    <div>
      <div className=" space-y-5">
        <h1 className=" text-3xl font-bold">Hi, {profile?.email}</h1>
        {profile?.subscription?.end_at && (
          <p>
            Your Subscription will end on{" "}
            {new Date(profile?.subscription?.end_at).toDateString()}
          </p>
        )}
        {profile?.subscription?.customer_id && (
          <Button onClick={handleBilling}>Cancel</Button>
        )}
      </div>
    </div>
  );
}
