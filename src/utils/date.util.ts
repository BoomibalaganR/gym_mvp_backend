
export function getMonthRange(ym?: string) {
  const [year, month] = ym ? ym.split("-").map(Number) : [null, null];

  const y = year ?? new Date().getUTCFullYear();
  const m = month ? month - 1 : new Date().getUTCMonth();

  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

  return { start, end };
}

