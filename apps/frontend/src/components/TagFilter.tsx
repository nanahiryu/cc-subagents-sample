import { useEffect, useState } from 'react';
import { getTags } from '../api';
import type { Tag } from '../types';
import { getTagColor } from '../utils/tags';

interface TagFilterProps {
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  tagsMode: 'and' | 'or';
  onTagsModeChange: (mode: 'and' | 'or') => void;
}

export function TagFilter({
  selectedTags,
  onSelectedTagsChange,
  tagsMode,
  onTagsModeChange,
}: TagFilterProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const tags = await getTags();
        setAllTags(tags);
        setError(null);
      } catch (err) {
        setError('Failed to load tags');
        console.error('Failed to fetch tags:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  // Sync URL with state on mount only
  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect should only run once on mount to restore state from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlTags = url.searchParams.get('tags');
    const urlMode = url.searchParams.get('tagsMode');

    if (urlTags) {
      const tags = urlTags.split(',').filter((t) => t.trim());
      onSelectedTagsChange(tags);
    }

    if (urlMode === 'and' || urlMode === 'or') {
      onTagsModeChange(urlMode);
    }
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const url = new URL(window.location.href);

    if (selectedTags.length > 0) {
      url.searchParams.set('tags', selectedTags.join(','));
      url.searchParams.set('tagsMode', tagsMode);
    } else {
      url.searchParams.delete('tags');
      url.searchParams.delete('tagsMode');
    }

    window.history.replaceState({}, '', url.toString());
  }, [selectedTags, tagsMode]);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onSelectedTagsChange([...selectedTags, tagName]);
    }
  };

  const clearFilters = () => {
    onSelectedTagsChange([]);
  };

  if (loading) {
    return (
      <div className="tag-filter-container">
        <p>Loading tags...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tag-filter-container">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (allTags.length === 0) {
    return (
      <div className="tag-filter-container">
        <p className="text-gray-500">No tags available</p>
      </div>
    );
  }

  return (
    <div className="tag-filter-container border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Tags Mode Toggle */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Match mode:</div>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="tagsMode"
              value="and"
              checked={tagsMode === 'and'}
              onChange={() => onTagsModeChange('and')}
              className="mr-2"
            />
            <span className="text-sm">All tags (AND)</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="tagsMode"
              value="or"
              checked={tagsMode === 'or'}
              onChange={() => onTagsModeChange('or')}
              className="mr-2"
            />
            <span className="text-sm">Any tag (OR)</span>
          </label>
        </div>
      </div>

      {/* Tag List */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const colors = getTagColor(tag.name);
          const isSelected = selectedTags.includes(tag.name);

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.name)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-blue-500`
                  : `${colors.bg} ${colors.text} opacity-60 hover:opacity-100`
              }`}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} tag ${tag.name}`}
            >
              <span>{tag.name}</span>
              <span className="text-xs opacity-75">({tag.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
