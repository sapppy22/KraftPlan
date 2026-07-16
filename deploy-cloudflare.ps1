# ============================================================
# KraftPlan -- Full Cloudflare Deployment Script
# Worker (kraftplan-api) + Pages (kraftplan)
#
# Windows workarounds applied automatically:
#   1. patch-next-on-pages.js  -- fixes shellac pnpm detection
#   2. symlink-patch.js        -- replaces symlinks with copies (no admin needed)
# ============================================================

$ErrorActionPreference = "Stop"
$Root      = "D:\Gym ai project"
$WorkerDir = "$Root\apps\worker"
$WebDir    = "$Root\apps\web"

# Load secrets from tmp files
$CF_TOKEN   = (Get-Content "$WorkerDir\.cf-token.tmp"   -Raw).Trim()
$DB_URL     = (Get-Content "$WorkerDir\.db-url.tmp"     -Raw).Trim()
$JWT_SECRET = (Get-Content "$WorkerDir\.jwt-secret.tmp" -Raw).Trim()

$env:CLOUDFLARE_API_TOKEN = $CF_TOKEN

# ── STEP 1: Deploy Cloudflare Worker ────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " STEP 1/4 -- Deploy Cloudflare Worker (kraftplan-api)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location $WorkerDir

Write-Host "`n-> Setting secret: DATABASE_URL" -ForegroundColor Yellow
$DB_URL | npx wrangler secret put DATABASE_URL
if ($LASTEXITCODE -ne 0) { throw "Failed to set DATABASE_URL secret" }

Write-Host "`n-> Setting secret: JWT_SECRET" -ForegroundColor Yellow
$JWT_SECRET | npx wrangler secret put JWT_SECRET
if ($LASTEXITCODE -ne 0) { throw "Failed to set JWT_SECRET secret" }

Write-Host "`n-> Deploying Worker..." -ForegroundColor Yellow
pnpm run deploy
if ($LASTEXITCODE -ne 0) { throw "Worker deployment failed" }

Write-Host "`n[OK] Worker deployed!" -ForegroundColor Green

# ── STEP 2: Apply Windows patches ───────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " STEP 2/4 -- Apply Windows patches + build for Cloudflare Pages" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location $Root

# Patch 1: fix next-on-pages shellac pnpm version detection
Write-Host "`n-> Applying next-on-pages patch (shellac fix)..." -ForegroundColor Yellow
node "$Root\patch-next-on-pages.js"
if ($LASTEXITCODE -ne 0) { throw "next-on-pages patch failed" }

Set-Location $WebDir

# Clean previous output
Write-Host "`n-> Cleaning previous .vercel/output..." -ForegroundColor Yellow
Remove-Item ".vercel\output" -Recurse -Force -ErrorAction SilentlyContinue

# Patch 2: run vercel build with symlink->copy patch (avoids admin requirement)
Write-Host "`n-> Running vercel build (with symlink patch for Windows)..." -ForegroundColor Yellow
$env:VERCEL_TOKEN = "dummy"
node --require "$Root\symlink-patch.js" "C:\Users\user\AppData\Roaming\npm\node_modules\vercel\dist\vc.js" build --yes
if ($LASTEXITCODE -ne 0) { throw "vercel build failed" }
Remove-Item Env:VERCEL_TOKEN -ErrorAction SilentlyContinue

# Patch 3: run next-on-pages --skip-build to process vercel output for CF Pages
Write-Host "`n-> Running next-on-pages --skip-build..." -ForegroundColor Yellow
cmd /c "node_modules\.bin\next-on-pages.CMD --skip-build"
if ($LASTEXITCODE -ne 0) { throw "next-on-pages --skip-build failed" }

Write-Host "`n[OK] Pages build complete!" -ForegroundColor Green

# ── STEP 3: Deploy to Cloudflare Pages ───────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " STEP 3/4 -- Deploy to Cloudflare Pages (kraftplan)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`n-> Deploying to Pages..." -ForegroundColor Yellow
npx wrangler pages deploy .vercel\output\static --project-name kraftplan --commit-dirty=true --branch main
if ($LASTEXITCODE -ne 0) { throw "Pages deployment failed" }

Write-Host "`n[OK] Pages deployed!" -ForegroundColor Green

# ── STEP 4: Verify ───────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " STEP 4/4 -- Verifying deployments" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$workerHealth = "https://kraftplan-api.dassaptarshi13.workers" + ".dev/health"
$pagesUrl     = "https://kraftplan.pages" + ".dev"

Write-Host "`n-> Checking Worker health..." -ForegroundColor Yellow
$wResp = & curl.exe -s $workerHealth
Write-Host "  $wResp" -ForegroundColor Green

Write-Host "`n-> Checking Pages HTTP status..." -ForegroundColor Yellow
$pStatus = & curl.exe -s -o "NUL" -w "%{http_code}" $pagesUrl
Write-Host "  HTTP $pStatus" -ForegroundColor Green

$workerUrl = "https://kraftplan-api.dassaptarshi13.workers" + ".dev"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Worker API : $workerUrl" -ForegroundColor White
Write-Host "  Web App    : $pagesUrl" -ForegroundColor White
Write-Host ""
