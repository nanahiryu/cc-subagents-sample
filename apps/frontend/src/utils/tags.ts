/**
 * Normalize tag name by trimming whitespace and converting to lowercase
 * @param name - The tag name to normalize
 * @returns The normalized tag name
 */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Validate tag name format
 * @param name - The tag name to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTagName(name: string): string | null {
  if (name.length === 0) {
    return 'Tag name cannot be empty';
  }
  if (name.length > 20) {
    return 'Tag name must be at most 20 characters';
  }
  if (!/^[a-zA-Z0-9ぁ-んァ-ヶー一-龠\-_]+$/.test(name)) {
    return 'Tag name contains invalid characters';
  }
  return null;
}
