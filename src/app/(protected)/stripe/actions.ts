// "use server";
// import Stripe from "stripe";

// // Initialize Stripe with your secret key
// const stripe = new Stripe(process.env.STRIPE_SK!);
"use server";

import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Ensure this is the version you want to use
});


// Define TypeScript types for function parameters
interface CheckoutParams {
  email: string;
  priceId: string;
  redirectTo: string;
  stripeCustomerId: string | undefined;
}

interface ManageBillingParams {
  customer_id: string;
}

// Define return types
type CheckoutSession = Stripe.Checkout.Session;
type BillingSession = Stripe.BillingPortal.Session;

// Define TypeScript types for products and prices
interface Product {
  id: string;
  name: string;
  description: string | null;  // Allow description to be null
  images: string[];
}

interface Price {
  id: string;
  unit_amount: number | null;  // Allow unit_amount to be null
  currency: string;
  product: Product;
}

// Fetch products and prices
export async function getSubscriptionProducts(): Promise<{ products: Product[], prices: Price[] }> {
  // Fetch products
  const products = await stripe.products.list({
    expand: ['data.prices'],
  });

  // Fetch prices
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    limit: 100, // Adjust as needed
  });

  // Map Stripe products to your custom Product type
  const mappedProducts: Product[] = products.data.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,  // Handle potential null here
    images: product.images,
  }));

  // Map Stripe prices to your custom Price type
  const mappedPrices: Price[] = prices.data.map(price => {
    let productData: Product;

    if (typeof price.product === 'string') {
      // If the product is a string (product ID), you'll need to fetch the product details separately
      throw new Error(`Expected product to be an object but received a string (product ID: ${price.product})`);
    } else if (price.product.object === 'product') {
      // Check that the product is not deleted and access its properties
      const product = price.product as Stripe.Product;

      productData = {
        id: product.id,
        name: product.name,
        description: product.description,  // Handle description safely
        images: product.images,
      };
    } else if (price.product.object === 'deleted_product') {
      // Handle deleted product case (e.g., skip or throw an error)
      throw new Error(`Product ${price.product.id} has been deleted.`);
    } else {
      throw new Error(`Unexpected product type: ${price.product.object}`);
    }

    return {
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      product: productData,
    };
  });

  return {
    products: mappedProducts.reverse(),
    prices: mappedPrices.reverse(),
  };

}

export async function checkout({
  email,
  stripeCustomerId,
  priceId,
  redirectTo,
}: CheckoutParams): Promise<CheckoutSession> {
  let existingSubscription;

  if (stripeCustomerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    // Get the first active subscription
    existingSubscription = subscriptions.data[0]; // Assuming one active subscription

    if (existingSubscription) {
      // Get the subscription item ID
      const subscriptionItemId = existingSubscription.items.data[0].id;

      // Update the existing subscription with the new price, replacing the old item
      await stripe.subscriptions.update(existingSubscription.id, {
        items: [
          {
            id: subscriptionItemId, // The existing subscription item ID
            price: priceId, // The new price ID
          },
        ],
        proration_behavior: 'create_prorations', // Handle prorations for changes in billing period
      });

      // Cancel any other subscriptions if necessary
      for (let i = 1; i < subscriptions.data.length; i++) {
        await stripe.subscriptionItems.del(subscriptions.data[i].id);
      }
    }
  }

  let session;
  if (stripeCustomerId) {
    session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      success_url: redirectTo || process.env.SITE_URL!,
      cancel_url: process.env.SITE_URL!,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
    });
  } else {
    session = await stripe.checkout.sessions.create({
      success_url: redirectTo || process.env.SITE_URL!,
      cancel_url: process.env.SITE_URL!,
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
    });
  }

  return session;
}




export async function manageBilling({
  customer_id,
}: ManageBillingParams): Promise<BillingSession> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customer_id,
    return_url: process.env.SITE_URL!,
  });

  return session;
}

