#!/bin/sh
# Makes the stage's plates (img/plates/) from Studio's (vendor/studio/traco-wireframe/plates/):
# the same five frames, resized and re-encoded for the page, never redrawn.
#   phone-0N.jpg (Studio's, as delivered, 585 × 1266) and phone-0N.webp
#   desktop-0N-1280.jpg / .webp and desktop-0N-1920.webp (from Studio's 2160 × 1350)
# Run by hand when a new version of the package is taken. Needs macOS's sips and cwebp.
set -eu
cd "$(dirname "$0")/.."
src=vendor/studio/traco-wireframe/plates
out=img/plates
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
rm -f "$out"/phone-0* "$out"/desktop-0*
for n in 01 02 03 04 05; do
  cp "$src/phone-$n.jpg" "$out/phone-$n.jpg"
  cwebp -quiet -q 80 "$src/phone-$n.jpg" -o "$out/phone-$n.webp"
  for w in 1280 1920; do
    sips -s format png --resampleWidth "$w" "$src/desktop-$n.jpg" --out "$tmp/d-$n-$w.png" >/dev/null
    cwebp -quiet -q 80 "$tmp/d-$n-$w.png" -o "$out/desktop-$n-$w.webp"
  done
  sips -s format jpeg -s formatOptions 82 --resampleWidth 1280 "$src/desktop-$n.jpg" --out "$out/desktop-$n-1280.jpg" >/dev/null
done
ls -l "$out"
