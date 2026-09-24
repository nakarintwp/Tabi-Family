param(
  [string]$Target = "C:\Users\Administrator\Desktop\japan-family-trip-planner"
)

$ErrorActionPreference = "Stop"
$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path $Target)) {
  throw "Target project not found: $Target"
}

$files = @(
  "package.json",
  "app\globals.css",
  "app\trips\new\page.tsx",
  "app\version\route.ts",
  "components\AppHeader.tsx",
  "components\PwaRegister.tsx",
  "public\sw.js"
)

foreach ($rel in $files) {
  $src = Join-Path $PatchRoot $rel
  $dst = Join-Path $Target $rel
  $dstDir = Split-Path -Parent $dst
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
  Copy-Item -Force $src $dst
  Write-Host "Updated $rel"
}

Set-Location $Target
Write-Host "\nLocal package version:" -ForegroundColor Cyan
(Get-Content package.json -Raw | ConvertFrom-Json).version

Write-Host "\nGit status:" -ForegroundColor Cyan
git status --short

Write-Host "\nNext commands:" -ForegroundColor Yellow
Write-Host 'git add package.json app/globals.css app/trips/new/page.tsx app/version/route.ts components/AppHeader.tsx components/PwaRegister.tsx public/sw.js'
Write-Host 'git commit -m "V7.3.4 apply build-safe patch"'
Write-Host 'git push origin main'
