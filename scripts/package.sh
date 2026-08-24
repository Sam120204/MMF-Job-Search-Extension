#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
dist_dir="$project_dir/dist"
version="$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).version' "$project_dir/manifest.json")"
mode="${1:-release}"

case "$mode" in
  release)
    package_path="$dist_dir/job-sheet-v${version}.zip"
    if rg -q 'REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID' "$project_dir/manifest.json"; then
      echo "Refusing to package: replace the Google OAuth client ID in manifest.json first." >&2
      exit 1
    fi
    ;;
  --bootstrap)
    version="0.1.0"
    package_path="$dist_dir/job-sheet-bootstrap-v${version}.zip"
    ;;
  *)
    echo "Usage: $0 [--bootstrap]" >&2
    exit 2
    ;;
esac

mkdir -p "$dist_dir"
rm -f "$package_path"

if [[ "$mode" == "--bootstrap" ]]; then
  staging_dir="$(mktemp -d)"
  trap 'rm -rf "$staging_dir"' EXIT
  cp -R "$project_dir/manifest.json" "$project_dir/src" "$project_dir/assets" "$staging_dir/"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const manifest = JSON.parse(fs.readFileSync(path, "utf8"));
    manifest.version = "0.1.0";
    delete manifest.oauth2;
    fs.writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  ' "$staging_dir/manifest.json"
  cd "$staging_dir"
else
  cd "$project_dir"
fi

zip -qr "$package_path" manifest.json src assets/icon-16.png assets/icon-32.png assets/icon-48.png assets/icon-128.png
echo "$package_path"
