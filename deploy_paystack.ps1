$ErrorActionPreference = "Stop"

Write-Host "Starting Paystack Edge Function Deployment..." -ForegroundColor Green

# 1. Check for Node.js and NPM
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "NPM is not installed. Please install Node.js first."
    exit 1
}

# 2. Get Project Ref
$ProjectRef = "qfxzlanslydldungcvqm"
Write-Host "Targeting Supabase Project: $ProjectRef" -ForegroundColor Cyan

# 3. Login Check (Basic check, might need manual login)
Write-Host "Ensuring you are logged in..."
try {
    cmd /c "npx -y supabase login"
}
catch {
    Write-Warning "Login command failed or was cancelled. Proceeding, but deployment might fail if not authenticated."
}

# 4. Link Project
Write-Host "Linking project..." -ForegroundColor Cyan
try {
    # Using cmd /c to handle npx correctly in PowerShell
    cmd /c "npx -y supabase link --project-ref $ProjectRef"
}
catch {
    Write-Warning "Link command reported an error. It might already be linked."
}

# 5. Ask for Secret Key
$PaystackSecret = Read-Host -Prompt "Enter your Paystack Secret Key (sk_live_... or sk_test_...)"

if ([string]::IsNullOrWhiteSpace($PaystackSecret)) {
    Write-Error "Paystack Secret Key is required!"
    exit 1
}

# 6. Set Secret
Write-Host "Setting PAYSTACK_SECRET_KEY..." -ForegroundColor Cyan
cmd /c "npx -y supabase secrets set PAYSTACK_SECRET_KEY=$PaystackSecret"

# 7. Deploy Function
Write-Host "Deploying 'paystack' function..." -ForegroundColor Green
cmd /c "npx -y supabase functions deploy paystack --no-verify-jwt"

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Please test the checkout flow now." -ForegroundColor Green
