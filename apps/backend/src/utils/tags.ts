/**
 * Normalize tag name by trimming whitespace and converting to lowercase
 * @param name - The tag name to normalize
 * @returns The normalized tag name
 */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}
