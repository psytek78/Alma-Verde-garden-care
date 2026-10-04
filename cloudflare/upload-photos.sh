#!/bin/sh
# Upload the exported photos to the Cloudflare R2 bucket. Run this after `npx wrangler login`.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
python3 - "$root" << 'PY'
import json, subprocess, sys
root = sys.argv[1]
manifest = json.load(open(root + "/cloudflare/seed/photos.json"))
for item in manifest:
    if "file" not in item:
        raise SystemExit("missing photo " + item.get("key", ""))
    subprocess.check_call([
        "npx", "wrangler", "r2", "object", "put", "garden-care-photos/" + item["key"],
        "--file", root + "/cloudflare/seed/photos/" + item["file"],
        "--content-type", item["content_type"],
        "--remote",
    ])
print("uploaded", len(manifest), "photos")
PY
