export function toMillis(ttl: string): number {
  const m = ttl.trim().match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!m) throw new Error(`Invalid TTL format: ${ttl}`);
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const map: Record<string, number> = { ms:1, s:1000, m:60_000, h:3_600_000, d:86_400_000 };
  return n * map[unit];
}
