export function formatTextTemplate(
  template: string | undefined,
  fallback: string,
  values: Record<string, string | number>
) {
  const source = template?.trim() ? template : fallback;

  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    source
  );
}
