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

/**
 * Generate a color for a tag based on its name
 * @param name - The tag name
 * @returns Tailwind CSS color classes for background and text
 */
export function getTagColor(name: string): { bg: string; text: string } {
  // Simple hash function to convert tag name to a number
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Define color palette with good contrast
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { bg: 'bg-red-100', text: 'text-red-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-teal-100', text: 'text-teal-800' },
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
