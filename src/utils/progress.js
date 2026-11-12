/** Points before every history entry, oldest first, ending at the current total. */
export function pointsSeries(points, history) {
  const entries = [...(history || [])]
    .filter((h) => h?.created_at)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const total = entries.reduce((sum, h) => sum + (Number(h.points_changed) || 0), 0);
  let running = points - total;
  const series = [{ value: running, at: entries[0]?.created_at }];
  for (const h of entries) {
    running += Number(h.points_changed) || 0;
    series.push({ value: running, at: h.created_at });
  }
  return series;
}
