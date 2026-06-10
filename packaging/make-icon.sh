#!/usr/bin/env bash
# Regenerate the app icon (icon.icns) from icon.svg.
# Requires macOS (qlmanage, sips, iconutil).
set -euo pipefail
cd "$(dirname "$0")"

# 1. SVG -> 1024px master PNG.
# Use rsvg-convert, NOT qlmanage: qlmanage composites onto opaque white, which
# bakes a white square behind the transparent rounded corners. rsvg-convert
# preserves the alpha channel. (brew install librsvg)
rm -f icon-1024.png
rsvg-convert -w 1024 -h 1024 icon.svg -o icon-1024.png

# 2. master PNG -> .iconset (all the sizes macOS wants)
ICONSET=icon.iconset
rm -rf "$ICONSET"; mkdir "$ICONSET"
for size in 16 32 128 256 512; do
  sips -z $size       $size       icon-1024.png --out "$ICONSET/icon_${size}x${size}.png"        >/dev/null
  sips -z $((size*2)) $((size*2)) icon-1024.png --out "$ICONSET/icon_${size}x${size}@2x.png"     >/dev/null
done

# 3. .iconset -> .icns
iconutil -c icns "$ICONSET" -o icon.icns
rm -rf "$ICONSET"
echo "wrote $(pwd)/icon.icns"
