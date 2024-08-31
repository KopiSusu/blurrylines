import Stripe from "stripe";
import { headers } from "next/headers";
import { buffer } from "node:stream/consumers";
import { supabaseAdmin } from "@/utils/supabase/admin";

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET!;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: any) {
  const rawBody = await buffer(req.body);
  try {
    const sig = headers().get("stripe-signature");
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
    } catch (err: any) {
      return Response.json({ error: `Webhook Error ${err?.message!} ` });
    }

    switch (event.type) {
      case "invoice.payment_succeeded":
        const result = event.data.object;
        const end_at = new Date(result.lines.data[0].period.end * 1000).toISOString();
        const stripe_customer_id = result.customer as string;
        const stripe_subscription_id = result.subscription as string;
        const email = result.customer_email as string;
        const error = await onPaymentSucceeded(end_at, stripe_customer_id, stripe_subscription_id, email);
        if (error) {
          return Response.json({ error: error.message });
        }
        break;

      case "customer.subscription.deleted":
        const deleteSubscription = event.data.object;
        const cancelError = await onSubCancel(deleteSubscription.id);
        if (cancelError) {
          return Response.json({ error: cancelError.message });
        }
        break;

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object;
        const updateError = await onSubscriptionUpdate(updatedSubscription);
        if (updateError) {
          return Response.json({ error: updateError.message });
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return Response.json({});
  } catch (e) {
    return Response.json({ error: `Webhook Error` });
  }
}

async function onPaymentSucceeded(end_at: string, stripe_customer_id: string, stripe_subscription_id: string, email: string) {
  const supabase = await supabaseAdmin();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_id", stripe_customer_id)
    .single();

  if (subscription) {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        end_at,
        stripe_customer_id,
        stripe_subscription_id,
      })
      .eq("stripe_customer_id", stripe_customer_id)
      .select("id");

    if (error) {
      console.error("Error updating subscription:", error);
      return error;
    }
  } else {
    const { error } = await supabase
      .from("subscriptions")
      .insert({
        end_at,
        stripe_customer_id,
        stripe_subscription_id,
        email,
      });

    if (error) {
      console.error("Error inserting new subscription:", error);
      return error;
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: stripe_customer_id })
    .eq("email", email);

  if (profileError) {
    console.error("Error updating profile:", profileError);
    return profileError;
  }

  return null;
}

async function onSubscriptionUpdate(updatedSubscription: any) {
  const supabase = await supabaseAdmin();

  const stripe_customer_id = updatedSubscription.customer as string;
  const stripe_subscription_id = updatedSubscription.id as string;
  const end_at = new Date(updatedSubscription.current_period_end * 1000).toISOString();

  // Update subscription data in Supabase
  const { error } = await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id,
      end_at,
    })
    .eq("stripe_customer_id", stripe_customer_id);

  if (error) {
    console.error("Error updating subscription:", error);
    return error;
  }

  return null;
}

async function onSubCancel(subscription_id: string) {
  const supabase = await supabaseAdmin();

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .update({
      end_at: new Date().toISOString(),
      stripe_subscription_id: null,
    })
    .eq("stripe_subscription_id", subscription_id)
    .select("*")
    .single();

  if (subError) {
    console.error("Error cancelling subscription:", subError);
    return subError;
  }

  return null;
}
