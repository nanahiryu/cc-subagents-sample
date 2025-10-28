import { useEffect, useRef, useState } from 'react';
import { getTags } from '../api';
import type { Tag } from '../types';
import { normalizeTagName, validateTagName } from '../utils/tags';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getTags();
        setAllTags(tags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Filter suggestions based on input value
  useEffect(() => {
    if (inputValue.trim()) {
      const normalizedInput = normalizeTagName(inputValue);
      const filtered = allTags.filter(
        (tag) => tag.name.includes(normalizedInput) && !value.includes(tag.name),
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, allTags, value]);

  const addTag = (tagName: string) => {
    const normalized = normalizeTagName(tagName);
    const error = validateTagName(normalized);

    if (error) {
      setErrorMessage(error);
      return;
    }

    if (!value.includes(normalized)) {
      onChange([...value, normalized]);
      setInputValue('');
      setErrorMessage(null);
      setShowSuggestions(false);
    } else {
      setErrorMessage('Tag already exists');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Check for comma
    if (newValue.includes(',')) {
      const tagName = newValue.replace(',', '').trim();
      if (tagName) {
        addTag(tagName);
      } else {
        setInputValue('');
      }
      return;
    }

    setInputValue(newValue);
    setErrorMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tagName = inputValue.trim();
      if (tagName) {
        addTag(tagName);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(value[value.length - 1]);
    }
  };

  const handleSuggestionClick = (tagName: string) => {
    addTag(tagName);
    inputRef.current?.focus();
  };

  return (
    <div className="tag-input-container">
      <label htmlFor="tag-input" className="tag-input-label">
        Tags
      </label>

      <div className="tag-input-wrapper">
        {/* Display selected tags */}
        <div className="tag-list">
          {value.map((tag) => (
            <span key={tag} className="tag">
              {tag}
              <button
                type="button"
                className="tag-remove-button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          id="tag-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Add tags (press Enter or comma to add)"
          className="tag-input-field"
          aria-describedby={errorMessage ? 'tag-error' : undefined}
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div id="tag-error" className="tag-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-suggestion"
              onClick={() => handleSuggestionClick(tag.name)}
            >
              {tag.name} ({tag.count})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
