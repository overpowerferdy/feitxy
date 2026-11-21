# Development Environment Setup Script for Feit Native App (PowerShell)
# This script helps set up the development environment for mobile app development

Write-Host "🚀 Feit Native Mobile App - Development Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node -v
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    $pkgManager = "npm"
} else {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host ""
Write-Host "📦 Checking package manager..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm -v
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} elseif (Get-Command bun -ErrorAction SilentlyContinue) {
    $bunVersion = bun -v
    Write-Host "✅ bun installed: $bunVersion" -ForegroundColor Green
    $pkgManager = "bun"
} else {
    Write-Host "❌ No package manager found" -ForegroundColor Red
    exit 1
}

# Check Java
Write-Host ""
Write-Host "☕ Checking Java..." -ForegroundColor Yellow
if (Get-Command java -ErrorAction SilentlyContinue) {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "✅ Java installed: $javaVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Java not found (required for Android development)" -ForegroundColor Yellow
    Write-Host "   Install Java 17 or later from https://adoptium.net/" -ForegroundColor Yellow
}

# Check Android Studio
Write-Host ""
Write-Host "🤖 Checking Android Studio..." -ForegroundColor Yellow
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$androidSdkPath2 = "$env:USERPROFILE\AppData\Local\Android\Sdk"

if ((Test-Path $androidSdkPath) -or (Test-Path $androidSdkPath2)) {
    Write-Host "✅ Android SDK found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Android SDK not found" -ForegroundColor Yellow
    Write-Host "   Install Android Studio from https://developer.android.com/studio" -ForegroundColor Yellow
}

# Check Capacitor CLI
Write-Host ""
Write-Host "⚡ Checking Capacitor CLI..." -ForegroundColor Yellow
if (Get-Command cap -ErrorAction SilentlyContinue) {
    $capVersion = cap --version
    Write-Host "✅ Capacitor CLI installed: $capVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Capacitor CLI not in PATH (this is okay, using via npm)" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
& $pkgManager install

# Build the web app
Write-Host ""
Write-Host "🏗️  Building web application..." -ForegroundColor Yellow
& $pkgManager run build

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add mobile platforms:" -ForegroundColor White
Write-Host "   $pkgManager run cap:add:android" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Sync with native projects:" -ForegroundColor White
Write-Host "   npx cap sync" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open in IDE:" -ForegroundColor White
Write-Host "   $pkgManager run android     # For Android" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Read the documentation:" -ForegroundColor White
Write-Host "   - SETUP_GUIDE.md for complete setup instructions" -ForegroundColor Gray
Write-Host "   - android-background-setup.md for Android configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For more help, see README.md" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
