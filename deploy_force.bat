@echo off
echo ===================================================
echo   Force Deploy Paystack Function
echo ===================================================

echo 1. Checking Supabase Login...
call npx supabase login
if %errorlevel% neq 0 (
    echo Login failed. Please try running this script again.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Linking Project to qfxzlanslydldungcvqm...
call npx supabase link --project-ref qfxzlanslydldungcvqm
if %errorlevel% neq 0 (
    echo Linking failed.
    pause
    exit /b %errorlevel%
)

echo.
echo 3. Setting Secrets...
set /p PAYSTACK_KEY="Enter Paystack Secret Key (sk_test_...): "
call npx supabase secrets set PAYSTACK_SECRET_KEY=%PAYSTACK_KEY%

echo.
echo 4. Deploying Function...
call npx supabase functions deploy paystack --no-verify-jwt
if %errorlevel% neq 0 (
    echo Deployment FAILED.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo   DEPLOYMENT SUCCESSFUL
echo ===================================================
pause
