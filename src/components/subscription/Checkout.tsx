"use client";

import React from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { cn } from "@/utils";
import { Loader2 } from "lucide-react";
import useProfile from "@/utils/hooks/useProfile";
import { checkout } from "@/app/(protected)/stripe/actions";
import { useMutation } from "@tanstack/react-query";

export default function Checkout({
  priceId,
  productId,
}: {
  priceId: string;
  productId: string;
}) {
  const { data: profile } = useProfile();
  const router = useRouter();
  const {
    data,
    isPending,
    mutate: serverCheckout,
  } = useMutation({
    mutationFn: checkout,
    onSuccess: async (data) => {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);
      const res = await stripe?.redirectToCheckout({
        sessionId: data.id,
      });
      if (res?.error) {
        alert("Fail to checkout");
      }
    },
    onError: async (error) => {
      alert("Fail to checkout");
    },
  });

  const handleCheckout = async () => {
    if (profile?.id) {
      serverCheckout({
        stripeCustomerId: profile.stripe_customer_id || undefined,
        email: profile.email,
        priceId,
        redirectTo: location.origin + "/profile",
      });
    } else {
      router.push("/login?next=" + location.pathname);
    }
  };

  const isSubscribed =
    profile?.subscription?.stripe_subscription_id === productId;

  return (
    <Button
      disabled={isPending || isSubscribed}
      className="w-full flex items-center gap-2"
      onClick={handleCheckout}
    >
      {isSubscribed ? "Subscribed" : "Getting Started"}{" "}
      <Loader2 className={cn("animate-spin", isPending ? "block" : "hidden")} />
    </Button>
  );
}
