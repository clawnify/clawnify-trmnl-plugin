// Runs in TRMNL's Node transform runtime. Only return display fields: the
// incoming `trmnl` namespace can contain credentials and must never be echoed.
function text(value, fallback = "") {
  return typeof value === "string" ? value.slice(0, 80) : fallback;
}

function formatted(value, widget) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const options = { maximumFractionDigits: 1 };
  if (Math.abs(value) >= 1e15) options.notation = "scientific";
  else if (Math.abs(value) >= 1e6) options.notation = "compact";
  if (widget.format === "percent") options.style = "percent";
  if (widget.format === "currency" && /^[A-Z]{3}$/.test(widget.currency || "")) {
    options.style = "currency";
    options.currency = widget.currency;
    options.minimumFractionDigits = 0;
  }
  return new Intl.NumberFormat("en", options).format(value);
}

function tile(widget) {
  if (!widget || !["metric", "series", "breakdown", "list"].includes(widget.kind)) return null;
  const result = { title: text(widget.title, "Untitled"), kind: widget.kind };
  if (widget.kind === "metric") return { ...result, value: formatted(widget.value, widget) };
  if (widget.kind === "series") {
    const points = (Array.isArray(widget.points) ? widget.points : []).slice(0, 90)
      .filter(p => p && typeof p.y === "number" && Number.isFinite(p.y));
    if (!points.length) return { ...result, empty: true };
    // Normalize first so a range crossing +/-Number.MAX_VALUE stays finite.
    const scale = Math.max(1, ...points.map(p => Math.abs(p.y)));
    const ys = points.map(p => p.y / scale);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    return { ...result, value: formatted(points[points.length - 1].y, widget),
      coordinates: ys.map((y, i) => `${(4 + i * 292 / Math.max(1, ys.length - 1)).toFixed(1)},${(hi === lo ? 30 : 56 - (y - lo) / (hi - lo) * 52).toFixed(1)}`).join(" "),
      single: points.length === 1,
      first: text(points[0].x), last: text(points[points.length - 1].x) };
  }
  const items = (Array.isArray(widget.items) ? widget.items : []).slice(0, widget.kind === "list" ? 5 : 12)
    .filter(item => item && typeof item.label === "string")
    .map(item => widget.kind === "list"
      ? { label: text(item.label), meta: text(item.meta) }
      : { label: text(item.label), value: formatted(item.value, widget) });
  return { ...result, items, empty: items.length === 0 };
}

function transform(input) {
  const title = text(input && input.name, "Clawnify");
  const date = input && typeof input.fetched_at === "string" ? new Date(input.fetched_at) : null;
  const fetched_at = date && Number.isFinite(date.getTime())
    ? date.toISOString().replace("T", " ").slice(0, 16) + " UTC" : "Time unavailable";
  const fetched_short = date && Number.isFinite(date.getTime()) ? date.toISOString().slice(5, 16).replace("T", " ") + "Z" : "Time unavailable";
  const unavailable = { title, fetched_at, fetched_short, widgets: [], error: "Open Clawnify to check this app's display connection." };
  if (!input || input.version !== 1 || input.error || !Array.isArray(input.widgets)) return unavailable;
  const widgets = input.widgets.slice(0, 4).map(tile).filter(Boolean);
  return widgets.length ? { title, fetched_at, fetched_short, widgets, error: null } : unavailable;
}
