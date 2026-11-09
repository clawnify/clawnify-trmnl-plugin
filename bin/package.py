#!/usr/bin/env python3
"""Build TRMNL's flat import archive from an explicit file allowlist."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
files = ["settings.yml", "transform.js", "shared.liquid", "full.liquid", "half_horizontal.liquid", "half_vertical.liquid", "quadrant.liquid"]
output = root / "_build/clawnify-trmnl-plugin.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for name in files:
        contents = (root / "src" / name).read_bytes()
        if len(contents) > 100_000:
            raise ValueError(f"{name} exceeds TRMNL's per-file limit")
        archive.writestr(name, contents)
print(output)
