#!/usr/bin/env python3
"""Write a credential-free trmnlp config from the one shared sample fixture."""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
config = {"watch": ["src"], "variables": json.loads((root / "preview/sample.json").read_text())}
config["variables"]["trmnl"] = {"plugin_settings": {"polling_url": ""}}
(root / ".trmnlp.yml").write_text(json.dumps(config, indent=2) + "\n")
