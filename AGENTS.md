# Working on this plugin

This is the public TRMNL plugin. Keep customer data, credentials and internal operational notes out of this repo. Internal Clawnify notes live in the private clawnify/wiki repo under clawnify-trmnl-plugin/.

- Read README.md and the upstream trmnlp docs before changing the polling or rendering contract.
- Use TRMNL's native Liquid filters and responsive typography; every app-authored string needs `escape` at the HTML boundary.
- Never echo the incoming `trmnl` namespace from transform.js: it can contain the display key.
- Keep polling data versioned, bounded and read-only. Failures must not become invented zeros.
- The sample contains fictional data and must preview without credentials or an API request.
- Run `npm test`, `bin/trmnlp lint`, `bin/trmnlp test --report _build/report`, and `npm run package` after relevant changes. Review both OG and X renders for clipping.
- Do not commit `.trmnlp.yml`, caches, API keys, plugin instance ids or account configuration.
- Public repo publication is separate from listing a recipe and deploying the Clawnify API. Do not claim a live device test from local fixtures.
