import type { TodoTag } from '../types';
import './TagList.css';

interface TagListProps {
  tags: TodoTag[];
  onRemoveTag?: (tagId: string) => void;
  onTagClick?: (tagName: string) => void;
  readonly?: boolean;
}

// Simple hash function to generate color from tag name
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
}

export function TagList({ tags, onRemoveTag, onTagClick, readonly = false }: TagListProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="tag-list">
      {tags.map((todoTag) => (
        <span
          key={todoTag.tagId}
          className={`tag-badge ${onTagClick ? 'clickable' : ''}`}
          style={{ backgroundColor: stringToColor(todoTag.tag.name) }}
          onClick={() => onTagClick?.(todoTag.tag.name)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onTagClick?.(todoTag.tag.name);
            }
          }}
        >
          {todoTag.tag.name}
          {!readonly && onRemoveTag && (
            <button
              type="button"
              className="tag-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTag(todoTag.tagId);
              }}
              aria-label={`Remove tag ${todoTag.tag.name}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
