
export function formatNaira(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₦0';
  return `₦${Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(
  date: Date | string | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opts,
  });
}

export function formatTenorLabel(tenor: number): string {
  if (tenor === 1) return 'Full payment';
  return `${tenor}-month plan`;
}


export function formatPercent(value: number): string {
  const pct = value > 1 ? value : value * 100;
  return `${pct.toFixed(0)}%`;
}
