/**
 * Today's date as YYYY-MM-DD, computed server-side in UTC. A pilot-scope
 * simplification — a user near a day boundary in a non-UTC timezone could
 * see "today" flip at a different wall-clock moment than they'd expect.
 * Worth revisiting (e.g. deriving from the client's local date) if that
 * turns out to matter in practice.
 */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
