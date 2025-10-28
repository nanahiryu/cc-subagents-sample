import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import { TagInput } from './TagInput';

// Mock the getTags API call
vi.mock('../api', () => ({
  getTags: vi.fn(),
}));

describe('TagInput', () => {
  const mockTags = [
    { id: '1', name: 'work', count: 5 },
    { id: '2', name: 'personal', count: 3 },
    { id: '3', name: 'urgent', count: 2 },
  ];

  beforeEach(() => {
    vi.mocked(api.getTags).mockResolvedValue(mockTags);
  });

  it('renders input field with label', () => {
    render(<TagInput value={[]} onChange={() => {}} />);

    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add tags/)).toBeInTheDocument();
  });

  it('displays existing tags', () => {
    render(<TagInput value={['work', 'personal']} onChange={() => {}} />);

    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('personal')).toBeInTheDocument();
  });

  it('adds tag when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'newtag{Enter}');

    expect(onChange).toHaveBeenCalledWith(['newtag']);
  });

  it('adds tag when comma is entered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'newtag,');

    expect(onChange).toHaveBeenCalledWith(['newtag']);
  });

  it('removes tag when × button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work', 'personal']} onChange={onChange} />);

    const removeButton = screen.getByLabelText('Remove tag work');
    await user.click(removeButton);

    expect(onChange).toHaveBeenCalledWith(['personal']);
  });

  it('removes last tag when Backspace is pressed on empty input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work', 'personal']} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(['work']);
  });

  it('shows autocomplete suggestions when typing', async () => {
    const user = userEvent.setup();

    render(<TagInput value={[]} onChange={() => {}} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'wor');

    await waitFor(() => {
      expect(screen.getByText(/work/)).toBeInTheDocument();
    });
  });

  it('adds tag when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'wor');

    await waitFor(() => {
      expect(screen.getByText(/work/)).toBeInTheDocument();
    });

    const suggestion = screen.getByText(/work/);
    await user.click(suggestion);

    expect(onChange).toHaveBeenCalledWith(['work']);
  });

  it('shows error for tag name with invalid characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'invalid@tag{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('invalid characters');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows error for tag name longer than 20 characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'thistagiswaytoolongtobevalid{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('at most 20 characters');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('normalizes tag names to lowercase', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'WorkTag{Enter}');

    expect(onChange).toHaveBeenCalledWith(['worktag']);
  });

  it('prevents duplicate tags', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work']} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'work{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('already exists');
    expect(onChange).not.toHaveBeenCalled();
  });

  // ========== Boundary Value Tests ==========

  it('ignores empty tag name (spaces only) without error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, '   {Enter}');

    // Empty input should be ignored without showing error
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts tag with exactly 20 characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    const exactlyTwenty = '12345678901234567890'; // exactly 20 chars
    await user.type(input, `${exactlyTwenty}{Enter}`);

    expect(onChange).toHaveBeenCalledWith([exactlyTwenty]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts tag with 1 character', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'a{Enter}');

    expect(onChange).toHaveBeenCalledWith(['a']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects tag with 21 characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    const twentyOne = '123456789012345678901'; // 21 chars
    await user.type(input, `${twentyOne}{Enter}`);

    expect(screen.getByRole('alert')).toHaveTextContent('at most 20 characters');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles empty input when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, '{Enter}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles empty input when comma is entered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, ',');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not remove tag with Backspace when input has text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work']} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'a{Backspace}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not remove tag with Backspace when no tags exist', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(onChange).not.toHaveBeenCalled();
  });

  // ========== Edge Case Tests ==========

  it('handles API fetch failure gracefully', async () => {
    vi.mocked(api.getTags).mockRejectedValueOnce(new Error('Network error'));

    render(<TagInput value={[]} onChange={() => {}} />);

    // Component should still render without suggestions
    expect(screen.getByPlaceholderText(/Add tags/)).toBeInTheDocument();
  });

  it('prevents duplicate tag after normalization (uppercase)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work']} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'WORK{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('already exists');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('prevents duplicate tag after normalization (whitespace)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work']} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, '  work  {Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('already exists');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles multiple consecutive commas', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, ',,');

    // Should not add empty tags or throw errors
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles comma with spaces', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, ' , ');

    // Should not add empty tags
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('filters out already selected tags from suggestions', async () => {
    const user = userEvent.setup();

    render(<TagInput value={['work']} onChange={() => {}} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'w');

    await waitFor(() => {
      // 'work' should not appear in suggestions since it's already selected
      const suggestions = screen.queryByText(/work \(\d+\)/);
      expect(suggestions).not.toBeInTheDocument();
    });
  });

  it('handles rapid successive Enter key presses', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'tag{Enter}{Enter}{Enter}');

    // Should only add tag once and handle empty Enter presses gracefully
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['tag']);
  });

  it('handles mixed valid and invalid character sequences', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'valid-tag_123{Enter}');

    // Hyphens, underscores, and numbers should be valid
    expect(onChange).toHaveBeenCalledWith(['valid-tag_123']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts Japanese characters in tag names', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'タグ{Enter}');

    expect(onChange).toHaveBeenCalledWith(['タグ']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides suggestions when input is cleared', async () => {
    const user = userEvent.setup();

    render(<TagInput value={[]} onChange={() => {}} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'wor');

    await waitFor(() => {
      expect(screen.getByText(/work/)).toBeInTheDocument();
    });

    // Clear input
    await user.clear(input);

    await waitFor(() => {
      expect(screen.queryByText(/work \(\d+\)/)).not.toBeInTheDocument();
    });
  });

  it('maintains focus on input after clicking suggestion', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'wor');

    await waitFor(() => {
      expect(screen.getByText(/work/)).toBeInTheDocument();
    });

    const suggestion = screen.getByText(/work/);
    await user.click(suggestion);

    // Input should still be focused for easy addition of more tags
    expect(input).toHaveFocus();
  });

  // ========== Error Handling Tests ==========

  it('clears error message when valid input is entered after error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);

    // First, trigger an error
    await user.type(input, 'invalid@tag{Enter}');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Clear input and enter valid tag
    await user.clear(input);
    await user.type(input, 'validtag{Enter}');

    // Error should be cleared and tag should be added
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(['validtag']);
  });

  it('clears error message when typing after error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work']} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);

    // First, trigger an error by entering duplicate
    await user.type(input, 'work{Enter}');

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Start typing - error should clear
    await user.type(input, 'a');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows error for special characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);

    const invalidTags = ['tag@name', 'tag#name', 'tag!name', 'tag name', 'tag.name'];

    for (const invalidTag of invalidTags) {
      await user.clear(input);
      await user.type(input, `${invalidTag}{Enter}`);

      expect(screen.getByRole('alert')).toHaveTextContent('invalid characters');
      expect(onChange).not.toHaveBeenCalled();
    }
  });

  it('handles validation error with comma input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, 'invalid@tag,');

    expect(screen.getByRole('alert')).toHaveTextContent('invalid characters');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores whitespace-only input without showing error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    await user.type(input, '   {Enter}');

    // Whitespace-only input should be ignored without error
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prioritizes validation over duplicate check', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={['work']} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);
    // Invalid characters should be caught before duplicate check
    await user.type(input, 'work@{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('invalid characters');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('recovers from error state when adding tag via suggestion', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);

    // First, trigger an error
    await user.type(input, 'invalid@tag{Enter}');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Clear and use suggestion to add tag
    await user.clear(input);
    await user.type(input, 'wor');

    await waitFor(() => {
      expect(screen.getByText(/work/)).toBeInTheDocument();
    });

    const suggestion = screen.getByText(/work/);
    await user.click(suggestion);

    // Error should be cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(['work']);
  });

  it('maintains error message when invalid input is attempted multiple times', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Add tags/);

    // First invalid attempt
    await user.type(input, 'invalid@{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('invalid characters');

    // Clear error by typing
    await user.clear(input);

    // Second invalid attempt with different error
    await user.type(input, '123456789012345678901{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('at most 20 characters');

    expect(onChange).not.toHaveBeenCalled();
  });
});
