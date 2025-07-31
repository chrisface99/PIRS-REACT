#!/bin/bash
echo "🏗️ Building PIRS Widget..."
npm run build

echo "📋 Build Summary:"
echo "└── widget/build/"
ls -la build/

echo "✨ Ready for deployment!"
echo "📁 Widget files: widget/build/"
echo "📁 Extension files: ../extension/"