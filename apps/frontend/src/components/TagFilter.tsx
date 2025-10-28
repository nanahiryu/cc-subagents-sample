import type { TagWithCount } from '../types';
import './TagFilter.css';

interface TagFilterProps {
  allTags: TagWithCount[];
  selectedTags: string[];
  tagsMode: 'and' | 'or';
  onToggleTag: (tagName: string) => void;
  onToggleMode: () => void;
  onClear: () => void;
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

export function TagFilter({
  allTags,
  selectedTags,
  tagsMode,
  onToggleTag,
  onToggleMode,
  onClear,
}: TagFilterProps) {
  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <h3>Filter by Tags</h3>
        <div className="tag-filter-controls">
          <button
            type="button"
            className={`mode-toggle ${tagsMode}`}
            onClick={onToggleMode}
            title="Toggle between AND/OR mode"
          >
            {tagsMode.toUpperCase()}
          </button>
          {selectedTags.length > 0 && (
            <button type="button" className="clear-btn" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="tag-filter-list">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <button
              type="button"
              key={tag.id}
              className={`tag-filter-item ${isSelected ? 'selected' : ''}`}
              style={{
                backgroundColor: isSelected ? stringToColor(tag.name) : '#f5f5f5',
              }}
              onClick={() => onToggleTag(tag.name)}
            >
              {tag.name}
              <span className="tag-count">({tag.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
