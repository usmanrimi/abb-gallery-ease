@echo off
echo ===================================================
echo   FAST Deploy Paystack Function (No Login Check)
echo ===================================================

echo.
echo 1. Linking Project to qfxzlanslydldungcvqm...
call npx supabase link --project-ref qfxzlanslydldungcvqm
if %errorlevel% neq 0 (
    echo Linking failed. You might need to login first.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Setting Secrets...
set /p PAYSTACK_KEY="Enter Paystack Secret Key (sk_test_...): "
echo Setting key...
call npx supabase secrets set PAYSTACK_SECRET_KEY=%PAYSTACK_KEY%

echo.
echo 3. Deploying Function...
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
