#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
dist_dir="$project_dir/dist"
version="$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).version' "$project_dir/manifest.json")"
package_path="$dist_dir/job-sheet-v${version}.zip"

if rg -q 'REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID' "$project_dir/manifest.json"; then
  echo "Refusing to package: replace the Google OAuth client ID in manifest.json first." >&2
  exit 1
fi

mkdir -p "$dist_dir"
rm -f "$package_path"
cd "$project_dir"
zip -qr "$package_path" manifest.json src assets/icon-16.png assets/icon-32.png assets/icon-48.png assets/icon-128.png
echo "$package_path"
