#!/usr/bin/env bash
# Scan asset directories and rewrite the <template id="mosaic-assets"> block in
# index.html so the gallery uses every available asset.
#
# Usage:  ./scripts/build-gallery-template.sh
# Run before each deploy after dropping new files into assets/gallery-frames/ etc.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Paths that hold gallery-eligible images. Order matters only for diff stability.
IMAGE_DIRS=(
  "assets/lifestyle"
  "assets/video-frames"
  "assets/gallery-frames"
  "assets/images/real"
  "assets/video"   # paphos-* stills, kitchen posters etc.
)

# Posters and obvious non-photo files to exclude
SKIP_PATTERNS='(-poster\.|favicon|asado-logo|yt-thumb|dish-rect)'

# Build image list (BSD find — separate -name predicates per extension)
images=()
for dir in "${IMAGE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    while IFS= read -r f; do
      images+=("$f")
    done < <(find "$dir" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) 2>/dev/null \
              | grep -vE "$SKIP_PATTERNS" \
              | sort)
  fi
done

# Add the menu dish photos explicitly
for f in assets/images/asado-bowl.png assets/images/boneless-chicken-bowl.png assets/images/kebab-bowl.png \
         assets/images/jerusalem-mix-bowl.png assets/images/ribeye-entrecote-bowl.png assets/images/hummus-asado-bowl.png \
         assets/images/hummus-kebab-bowl.png assets/images/chicken-schnitzel-bowl.png assets/images/pita-pulled-chicken.png \
         assets/images/pita-asado.png assets/images/pita-kebab.png assets/images/hero-hummus-asado.png; do
  [ -f "$f" ] && images+=("$f")
done

# Build video list — pair each .mp4 with its -poster.jpg
videos=()
while IFS= read -r v; do
  poster="${v%.mp4}-poster.jpg"
  [ -f "$poster" ] && videos+=("$v|$poster")
done < <(find assets/video -maxdepth 1 -type f -name "*.mp4" 2>/dev/null | sort)

# Generate the template body
{
  printf '      <template id="mosaic-assets">\n'
  for v in "${videos[@]}"; do
    src="${v%|*}"
    poster="${v#*|}"
    printf '        <i data-video="%s" data-poster="%s"></i>\n' "$src" "$poster"
  done
  for img in "${images[@]}"; do
    printf '        <i data-img="%s"></i>\n' "$img"
  done
  printf '      </template>'
} > /tmp/mosaic-template.html

# Replace block in index.html using awk (handles multi-line)
awk -v repl_file="/tmp/mosaic-template.html" '
  BEGIN {
    while ((getline line < repl_file) > 0) repl = repl line "\n"
    close(repl_file)
    sub(/\n$/, "", repl)
    in_block = 0
  }
  /<template id="mosaic-assets">/ {
    print repl
    in_block = 1
    next
  }
  in_block && /<\/template>/ {
    in_block = 0
    next
  }
  !in_block { print }
' index.html > index.html.new && mv index.html.new index.html

img_count=${#images[@]}
vid_count=${#videos[@]}
echo "Gallery template rebuilt: $img_count images + $vid_count videos = $((img_count + vid_count)) total assets"
rm -f /tmp/mosaic-template.html
