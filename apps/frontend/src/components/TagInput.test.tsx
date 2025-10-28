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
});
