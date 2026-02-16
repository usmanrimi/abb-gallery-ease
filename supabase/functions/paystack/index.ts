import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          error: "Paystack not configured",
          message: "Please add PAYSTACK_SECRET_KEY to enable card payments. For now, use bank transfer option."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if this is a webhook (no JSON body parsing needed for signature check)
    const url = new URL(req.url);
    const isWebhook = url.pathname.endsWith("/webhook") || url.searchParams.get("action") === "webhook";

    if (isWebhook && req.method === "POST") {
      // ---- WEBHOOK HANDLER ----
      const body = await req.text();
      const signature = req.headers.get("x-paystack-signature");

      // Verify webhook signature
      if (signature) {
        const encoder = new TextEncoder();
        const key = encoder.encode(PAYSTACK_SECRET_KEY);
        const data = encoder.encode(body);
        const hmac = createHmac("sha512", key);
        hmac.update(data);
        const expectedSignature = hmac.digest("hex");

        if (signature !== expectedSignature) {
          console.error("Invalid webhook signature");
          return new Response("Invalid signature", { status: 401 });
        }
      }

      const event = JSON.parse(body);

      if (event.event === "charge.success") {
        const txData = event.data;
        const reference = txData.reference;
        const orderId = txData.metadata?.order_id;

        if (orderId) {
          // Update order status
          await supabase
            .from("orders")
            .update({
              status: "paid",
              payment_status: "paid",
              payment_reference: reference,
              payment_verified_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          // Get order details for notification
          const { data: order } = await supabase
            .from("orders")
            .select("user_id, package_name")
            .eq("id", orderId)
            .single();

          if (order) {
            // Notify customer
            await supabase.from("notifications").insert({
              user_id: order.user_id,
              order_id: orderId,
              title: "Payment Successful ✓",
              message: `Your payment for ${order.package_name} has been confirmed. Your order is now being processed.`,
            });

            // Notify admins (use profiles table, not user_roles)
            const { data: admins } = await supabase
              .from("profiles")
              .select("id")
              .in("role", ["admin_ops", "super_admin"]);

            if (admins?.length) {
              await supabase.from("notifications").insert(
                admins.map((admin) => ({
                  user_id: admin.id,
                  order_id: orderId,
                  title: "New Payment Received",
                  message: `Payment received for ${order.package_name}. Order is ready for processing.`,
                }))
              );
            }
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ---- REGULAR API ACTIONS ----
    const { action, ...data } = await req.json();

    switch (action) {
      case "initialize": {
        const { email, amount, orderId, metadata } = data;

        const response = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            amount: Math.round(amount * 100), // Convert to kobo
            reference: `MAG-${orderId}-${Date.now()}`,
            callback_url: data.callback_url || `${req.headers.get("origin")}/orders`,
            metadata: {
              order_id: orderId,
              ...metadata,
            },
          }),
        });

        const result = await response.json();

        if (!result.status) {
          throw new Error(result.message || "Failed to initialize payment");
        }

        return new Response(
          JSON.stringify({
            authorization_url: result.data.authorization_url,
            access_code: result.data.access_code,
            reference: result.data.reference,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        const { reference } = data;

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        });

        const result = await response.json();

        if (!result.status) {
          throw new Error(result.message || "Failed to verify payment");
        }

        if (result.data.status === "success") {
          const orderId = result.data.metadata?.order_id;
          if (orderId) {
            // Update order status
            await supabase
              .from("orders")
              .update({
                status: "paid",
                payment_status: "paid",
                payment_reference: reference,
                payment_verified_at: new Date().toISOString(),
              })
              .eq("id", orderId);

            // Get order details for notification
            const { data: order } = await supabase
              .from("orders")
              .select("user_id, package_name")
              .eq("id", orderId)
              .single();

            if (order) {
              await supabase.from("notifications").insert({
                user_id: order.user_id,
                order_id: orderId,
                title: "Payment Successful ✓",
                message: `Your payment for ${order.package_name} has been confirmed. Your order is now being processed.`,
              });

              // Notify admins
              const { data: admins } = await supabase
                .from("profiles")
                .select("id")
                .in("role", ["admin_ops", "super_admin"]);

              if (admins?.length) {
                await supabase.from("notifications").insert(
                  admins.map((admin) => ({
                    user_id: admin.id,
                    order_id: orderId,
                    title: "New Payment Received",
                    message: `Payment received for ${order.package_name}. Order is ready for processing.`,
                  }))
                );
              }
            }
          }
        }

        return new Response(
          JSON.stringify({
            status: result.data.status,
            amount: result.data.amount / 100,
            reference: result.data.reference,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_virtual_account": {
        const { email, firstName, lastName, phone } = data;

        const customerResponse = await fetch("https://api.paystack.co/customer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
          }),
        });

        const customerResult = await customerResponse.json();

        if (!customerResult.status) {
          throw new Error(customerResult.message || "Failed to create customer");
        }

        const dvaResponse = await fetch("https://api.paystack.co/dedicated_account", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customerResult.data.customer_code,
            preferred_bank: "wema-bank",
          }),
        });

        const dvaResult = await dvaResponse.json();

        if (!dvaResult.status) {
          return new Response(
            JSON.stringify({
              useFallback: true,
              message: "Virtual accounts not available. Please use manual bank transfer.",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            account_number: dvaResult.data.account_number,
            account_name: dvaResult.data.account_name,
            bank_name: dvaResult.data.bank.name,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
