#!/bin/bash

# Development Environment Setup Script for Feit Native App
# This script helps set up the development environment for mobile app development

set -e

echo "🚀 Feit Native Mobile App - Development Environment Setup"
echo "=========================================================="
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm/bun
echo ""
echo "📦 Checking package manager..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm installed: $NPM_VERSION"
    PKG_MANAGER="npm"
elif command -v bun &> /dev/null; then
    BUN_VERSION=$(bun -v)
    echo "✅ bun installed: $BUN_VERSION"
    PKG_MANAGER="bun"
else
    echo "❌ No package manager found"
    exit 1
fi

# Check Java (for Android)
echo ""
echo "☕ Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "✅ Java installed: $JAVA_VERSION"
else
    echo "⚠️  Java not found (required for Android development)"
    echo "   Install Java 17 or later from https://adoptium.net/"
fi

# Check Android Studio
echo ""
echo "🤖 Checking Android Studio..."
if [ -d "$HOME/Android/Sdk" ] || [ -d "$HOME/Library/Android/sdk" ]; then
    echo "✅ Android SDK found"
else
    echo "⚠️  Android SDK not found"
    echo "   Install Android Studio from https://developer.android.com/studio"
fi

# Check Xcode (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 Checking Xcode..."
    if command -v xcodebuild &> /dev/null; then
        XCODE_VERSION=$(xcodebuild -version | head -n 1)
        echo "✅ Xcode installed: $XCODE_VERSION"
        
        # Check CocoaPods
        echo ""
        echo "💎 Checking CocoaPods..."
        if command -v pod &> /dev/null; then
            POD_VERSION=$(pod --version)
            echo "✅ CocoaPods installed: $POD_VERSION"
        else
            echo "⚠️  CocoaPods not found"
            echo "   Install with: sudo gem install cocoapods"
        fi
    else
        echo "⚠️  Xcode not found"
        echo "   Install from Mac App Store"
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
$PKG_MANAGER install

# Check if Capacitor CLI is available
echo ""
echo "⚡ Checking Capacitor CLI..."
if command -v cap &> /dev/null; then
    CAP_VERSION=$(cap --version)
    echo "✅ Capacitor CLI installed: $CAP_VERSION"
else
    echo "⚠️  Capacitor CLI not in PATH (this is okay, using via npm)"
fi

# Build the web app
echo ""
echo "🏗️  Building web application..."
$PKG_MANAGER run build

echo ""
echo "=========================================================="
echo "✅ Setup Complete!"
echo ""
echo "Next Steps:"
echo ""
echo "1. Add mobile platforms:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   $PKG_MANAGER run cap:add:android"
    echo "   $PKG_MANAGER run cap:add:ios"
else
    echo "   $PKG_MANAGER run cap:add:android"
fi
echo ""
echo "2. Sync with native projects:"
echo "   npx cap sync"
echo ""
echo "3. Open in IDE:"
echo "   $PKG_MANAGER run android     # For Android"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   $PKG_MANAGER run ios         # For iOS"
fi
echo ""
echo "4. Read the documentation:"
echo "   - SETUP_GUIDE.md for complete setup instructions"
echo "   - android-background-setup.md for Android configuration"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   - ios-background-setup.md for iOS configuration"
fi
echo ""
echo "📚 For more help, see README.md"
echo "=========================================================="
