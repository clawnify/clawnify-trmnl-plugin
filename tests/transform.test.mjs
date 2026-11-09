import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";
const source = readFileSync(new URL("../src/transform.js", import.meta.url), "utf8");
const sample = JSON.parse(readFileSync(new URL("../preview/sample.json", import.meta.url), "utf8"));
const transform = input => JSON.parse(JSON.stringify(runInNewContext(source + "\ntransform(input)", { input }, { timeout: 1000 })));

test("renders metrics, trends, lists and breakdowns from the versioned feed", () => {
  const out = transform(sample);
  assert.equal(out.error, null);
  assert.equal(out.widgets.length, 4);
  assert.equal(out.widgets[0].value, "€42,850");
  assert.equal(out.widgets[1].value, "45");
  assert.match(out.widgets[1].coordinates, /^4\.0,/);
  assert.equal(out.widgets[2].items.length, 3);
  assert.equal(out.widgets[3].items[0].value, "€18,500");
  assert.equal(out.fetched_at, "2026-11-09 16:50 UTC");
});

test("does not copy credentials, hidden fields or navigation into output", () => {
  const input = structuredClone(sample);
  input.trmnl = { plugin_settings: { custom_fields_values: { display_key: "SECRET" } } };
  input.widgets[0].secret = "SECRET";
  input.widgets[0].at = "/private-link";
  const out = JSON.stringify(transform(input));
  assert.doesNotMatch(out, /SECRET|private-link|custom_fields|display_key/);
});

test("fails closed on error, missing data and unsupported contract versions", () => {
  for (const input of [null, {}, { ...sample, version: 2 }, { ...sample, error: "SECRET API error" }, { ...sample, widgets: [] }]) {
    const out = transform(input);
    assert.ok(out.error);
    assert.deepEqual(out.widgets, []);
    assert.doesNotMatch(JSON.stringify(out), /SECRET/);
  }
});

test("missing values stay missing, while zero remains a real value", () => {
  const out = transform({ ...sample, widgets: [
    { kind: "metric", value: null }, { kind: "metric", value: 0 },
    { kind: "series", points: [] }, { kind: "list", items: [] }
  ] });
  assert.equal(out.widgets[0].value, "—");
  assert.equal(out.widgets[1].value, "0");
  assert.equal(out.widgets[2].empty, true);
  assert.equal(out.widgets[3].empty, true);
});

test("bounds all arrays and text, and keeps extreme charts finite", () => {
  const one = { kind: "series", title: "X".repeat(200), points: [{ x: "A", y: -Number.MAX_VALUE }, { x: "B", y: Number.MAX_VALUE }] };
  const out = transform({ ...sample, widgets: Array(20).fill(one) });
  assert.equal(out.widgets.length, 4);
  assert.equal(out.widgets[0].title.length, 80);
  assert.doesNotMatch(out.widgets[0].coordinates, /NaN|Infinity/);
  for (const points of [[{ x: "One", y: 1 }], [{ y: 5 }, { y: 5 }], [{ y: null }, null]]) {
    const result = transform({ ...sample, widgets: [{ kind: "series", points }] });
    assert.doesNotMatch(JSON.stringify(result), /NaN|Infinity/);
  }
});

test("formats fractional percentages and invalid timestamps explicitly", () => {
  const out = transform({ ...sample, fetched_at: "bad-date", widgets: [{ kind: "metric", value: 0.42, format: "percent" }] });
  assert.equal(out.widgets[0].value, "42%");
  assert.equal(out.fetched_at, "Time unavailable");
});
