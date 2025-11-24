# ============================================================================
# KATALARA - Quick Deploy Script
# ============================================================================
# Deploy to Vercel production with single command
# Usage: .\deploy.ps1 "commit message"
# ============================================================================

param(
    [string]$Message = "update: Manual deployment"
)

Write-Host "🚀 KATALARA DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if there are changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Changes detected, committing..." -ForegroundColor Yellow
    git add -A
    git commit -m $Message
    git push origin main
    Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Gray
    Write-Host ""
}

# Deploy to Vercel
Write-Host "🔨 Building and deploying to production..." -ForegroundColor Yellow
vercel deploy --prod --yes

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
