import { useState } from 'react';
import type { Tag } from '../types';
import './TagInput.css';

interface TagInputProps {
  existingTags: Tag[];
  onAddTag: (tagName: string) => void;
}

export function TagInput({ existingTags, onAddTag }: TagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (value: string) => {
    setInput(value);

    if (value.trim()) {
      const filtered = existingTags.filter((tag) =>
        tag.name.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    onAddTag(trimmed);
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleSuggestionClick = (tagName: string) => {
    handleSubmit(tagName);
  };

  return (
    <div className="tag-input-wrapper">
      <input
        type="text"
        className="tag-input"
        placeholder="Add tag (press Enter or comma)"
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={20}
      />
      {showSuggestions && (
        <div className="tag-suggestions">
          {suggestions.map((tag) => (
            <button
              type="button"
              key={tag.id}
              className="tag-suggestion-item"
              onClick={() => handleSuggestionClick(tag.name)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
