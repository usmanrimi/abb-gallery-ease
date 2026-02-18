# Paystack Setup & Deployment

Currently, the Paystack integration uses a Supabase Edge Function to securely handle payment initialization and verification.

## Prerequisites

1.  **Node.js** installed.
2.  **Supabase Account** with access to the project `ztmihyravdlomtrqlwsb`.
3.  **Paystack Secret Key** (from your Paystack Dashboard > Settings > API Keys & Webhooks).

## Deployment Steps

We have created a helper script to automate the process.

1.  Open your terminal in the project root.
2.  Run the deployment script:
    ```powershell
    .\deploy_paystack.ps1
    ```
3.  Follow the prompts:
    *   It may check for Supabase login (opens a browser).
    *   It will ask for your `PAYSTACK_SECRET_KEY`. Enter it carefully (it won't be shown on screen in some terminals, or will be plain text in others, be careful).
4.  Wait for the deployment to finish.

## Manual Steps (if script fails)

If the script fails, you can run these commands manually:

```bash
# 1. Login
npx supabase login

# 2. Link Project
npx supabase link --project-ref ztmihyravdlomtrqlwsb

# 3. Set Secret
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_key_here

# 4. Deploy Function
npx supabase functions deploy paystack --no-verify-jwt
```

## Troubleshooting

-   **"Failed to send a request to the Edge Function"**: This means the function is not deployed, or the `paystack` function folder is missing `index.ts`.
-   **"Paystack not configured"**: The function is deployed but `PAYSTACK_SECRET_KEY` is not set in Supabase Secrets.
-   **"Invalid API Key"**: The secret key provided is incorrect.
