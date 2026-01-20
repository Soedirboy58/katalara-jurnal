# ============================================================================
# KATALARA - Quick Deploy Script
# ============================================================================
# Deploy to Vercel production with single command
# Usage: .\deploy.ps1 "commit message"
# ============================================================================

param(
    [string]$Message = "update: Manual deployment",
    [string]$Remote = ""
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
    
    # IMPORTANT:
    # Vercel auto-deploy is connected to GitHub repo: Soedirboy58/katalara-jurnal
    # In this workspace, that repo is commonly configured as remote: "jurnal"
    # If "jurnal" exists, push there to trigger Vercel.
    $pushRemote = $Remote
    if (-not $pushRemote) {
        $hasJurnal = $false
        try {
            $null = git remote get-url jurnal 2>$null
            if ($LASTEXITCODE -eq 0) { $hasJurnal = $true }
        } catch {
            $hasJurnal = $false
        }

        $pushRemote = if ($hasJurnal) { "jurnal" } else { "origin" }
    }

    git push $pushRemote main
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
