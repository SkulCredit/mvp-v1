
export function generateReference(prefix = 'SKC'): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}
