import { CheckCircle2 } from "lucide-react";
import React from "react";
import { cn } from "@/utils";
import Checkout from "./Checkout";
import { getProfile } from "@/app/(protected)/profile/actions";
import { getSubscriptionProducts } from "@/app/(protected)/stripe/actions";
import Previews from "../shared/Previews";

export default async function Price() {
  const { profile } = await getProfile();
  const { products, prices } = await getSubscriptionProducts(); // Fetch products and prices from Stripe

  if (!profile) {
    return <></>;
  }
  if (profile?.subscription?.stripe_customer_id) {
    return (
      <>
        <Previews />
      </>
    );
  }

  console.log("profile");
  console.log(profile);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {prices.map((price, index) => {
          const product = products.find(
            (product) => product.id === price.product.id
          ); // Find the corresponding product

          if (!product) {
            return null; // Skip if no matching product is found
          }

          const isPopular = index === 1;

          return (
            <div
              key={index}
              className={cn("border rounded-md p-5 space-y-5", {
                "ring-2 ring-green-500": isPopular,
              })}
            >
              <div className="space-y-3">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {price?.unit_amount && (
                  <h1 className="text-3xl font-bold">
                    {(price?.unit_amount / 100).toFixed(2)}$
                  </h1>
                )}
                {/* Convert from cents to dollars */}
                <p className="text-sm text-gray-400">{product.description}</p>
              </div>
              <div className="space-y-3">
                {/* You can add more logic here to render benefits if they are part of your product data */}
                <p className="text-sm text-gray-400">Includes all features</p>
              </div>
              <Checkout priceId={price.id} productId={product.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
