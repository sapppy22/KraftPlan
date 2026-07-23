@echo off
cd /d "D:\Gym ai project\apps\web"
set PATH=D:\Gym ai project\tools;C:\Program Files\Git\bin;C:\Users\user\AppData\Local\nvm\v20.11.1;%PATH%
set NEXT_PUBLIC_API_BASE=https://kraftplan-api.dassaptarshi13.workers.dev
set CLOUDFLARE_API_TOKEN=cfut_uxsyhHJGyXEnzip5TfyXMZarQfdWHCKab3aj7rj9910c94b0
set CLOUDFLARE_ACCOUNT_ID=fdb3448544f50ec91941b6283b40e863
pnpm exec next-on-pages > "D:\Gym ai project\tools\build-web.log" 2>&1
echo BUILD_EXIT=%ERRORLEVEL% >> "D:\Gym ai project\tools\build-web.log"
