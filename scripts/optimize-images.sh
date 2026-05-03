#!/usr/bin/env bash
# Convert dish PNGs (1.5-3 MB each) → WebP at q=82 (~150-300 KB each), keep PNG as fallback.
# Hero stays PNG too for quality on the LCP element.

set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/assets/images"
cd "$DIR"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp missing — brew install webp" >&2
  exit 1
fi

shopt -s nullglob
total_in=0
total_out=0

for png in *.png; do
  case "$png" in
    storefront*.png) continue ;;
  esac
  webp="${png%.png}.webp"
  if [ -f "$webp" ] && [ "$webp" -nt "$png" ]; then
    echo "[skip] $webp (newer than source)"
    continue
  fi
  in=$(stat -f%z "$png")
  cwebp -quiet -q 82 -m 6 "$png" -o "$webp"
  out=$(stat -f%z "$webp")
  total_in=$((total_in + in))
  total_out=$((total_out + out))
  printf "[done] %-32s %5dKB → %4dKB  (%d%%)\n" "$png" $((in/1024)) $((out/1024)) $((out * 100 / in))
done

if [ "$total_in" -gt 0 ]; then
  printf "\nTotal: %dKB → %dKB  (%d%% of original)\n" $((total_in/1024)) $((total_out/1024)) $((total_out * 100 / total_in))
fi
