import type { Tag } from '../types';
import { getTagColor } from '../utils/tags';

interface TagListProps {
  tags: Tag[];
  onTagClick?: (tag: Tag) => void;
  onTagRemove?: (tagId: string) => void;
}

export function TagList({ tags, onTagClick, onTagRemove }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const colors = getTagColor(tag.name);
        const isClickable = !!onTagClick;
        const isRemovable = !!onTagRemove;

        return (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${
              isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
            }`}
            onClick={isClickable ? () => onTagClick(tag) : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTagClick(tag);
                    }
                  }
                : undefined
            }
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={isClickable ? `Filter by tag ${tag.name}` : undefined}
          >
            <span>{tag.name}</span>
            {isRemovable && (
              <button
                type="button"
                className="ml-1 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagRemove(tag.id);
                }}
                aria-label={`Remove tag ${tag.name}`}
              >
                ×
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
