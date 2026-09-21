export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  try {
    const parsed = new URL(url);
    return parsed.pathname + (parsed.search || "");
  } catch {
    return url;
  }
}
