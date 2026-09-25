export function toCsv(rows: Record<string, string | number>[], headers: { key: string; label: string }[]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    if (s.includes(";") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const headerLine = headers.map((h) => escape(h.label)).join(";");
  const lines = rows.map((row) => headers.map((h) => escape(row[h.key])).join(";"));
  return [headerLine, ...lines].join("\n");
}
