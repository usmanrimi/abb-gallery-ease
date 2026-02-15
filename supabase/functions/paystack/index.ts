import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { action, ...data } = await req.json();

    switch (action) {
      case "initialize": {
        // Initialize a Paystack transaction
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
            callback_url: `${req.headers.get("origin")}/orders`,
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
        // Verify a transaction
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

              // Notify admins
              const { data: adminRoles } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "admin");

              if (adminRoles?.length) {
                await supabase.from("notifications").insert(
                  adminRoles.map((admin) => ({
                    user_id: admin.user_id,
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
        // Create a dedicated virtual account for the customer
        const { customerId, email, firstName, lastName, phone, orderId } = data;

        // First, create or get customer
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

        // Create dedicated virtual account
        const dvaResponse = await fetch("https://api.paystack.co/dedicated_account", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customerResult.data.customer_code,
            preferred_bank: "wema-bank", // or "test-bank" for test mode
          }),
        });

        const dvaResult = await dvaResponse.json();

        if (!dvaResult.status) {
          // Virtual accounts might not be enabled, return bank transfer info instead
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
