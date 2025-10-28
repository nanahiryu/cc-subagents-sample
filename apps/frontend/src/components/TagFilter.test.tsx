import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import type { Tag } from '../types';
import { TagFilter } from './TagFilter';

// Mock the getTags API call
vi.mock('../api', () => ({
  getTags: vi.fn(),
}));

describe('TagFilter', () => {
  const mockTags: Tag[] = [
    { id: '1', name: 'work', count: 5 },
    { id: '2', name: 'personal', count: 3 },
    { id: '3', name: 'urgent', count: 2 },
  ];

  const defaultProps = {
    selectedTags: [],
    onSelectedTagsChange: vi.fn(),
    tagsMode: 'and' as const,
    onTagsModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(api.getTags).mockResolvedValue(mockTags);
    // Reset window.location
    window.history.replaceState({}, '', '/');
  });

  it('renders loading state initially', () => {
    render(<TagFilter {...defaultProps} />);
    expect(screen.getByText('Loading tags...')).toBeInTheDocument();
  });

  it('renders tags after loading', async () => {
    render(<TagFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });
  });

  it('displays tag counts', async () => {
    render(<TagFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('(5)')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });
  });

  it('calls onSelectedTagsChange when tag is clicked', async () => {
    const user = userEvent.setup();
    const onSelectedTagsChange = vi.fn();

    render(<TagFilter {...defaultProps} onSelectedTagsChange={onSelectedTagsChange} />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    const workTag = screen.getByLabelText('Select tag work');
    await user.click(workTag);

    expect(onSelectedTagsChange).toHaveBeenCalledWith(['work']);
  });

  it('deselects tag when clicked again', async () => {
    const user = userEvent.setup();
    const onSelectedTagsChange = vi.fn();

    render(
      <TagFilter
        {...defaultProps}
        selectedTags={['work']}
        onSelectedTagsChange={onSelectedTagsChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    const workTag = screen.getByLabelText('Deselect tag work');
    await user.click(workTag);

    expect(onSelectedTagsChange).toHaveBeenCalledWith([]);
  });

  it('allows multiple tag selection', async () => {
    const user = userEvent.setup();
    const onSelectedTagsChange = vi.fn();

    render(
      <TagFilter
        {...defaultProps}
        selectedTags={['work']}
        onSelectedTagsChange={onSelectedTagsChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('personal')).toBeInTheDocument();
    });

    const personalTag = screen.getByLabelText('Select tag personal');
    await user.click(personalTag);

    expect(onSelectedTagsChange).toHaveBeenCalledWith(['work', 'personal']);
  });

  it('displays selected tags with different styling', async () => {
    render(<TagFilter {...defaultProps} selectedTags={['work']} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Deselect tag work')).toBeInTheDocument();
    });

    const workTag = screen.getByLabelText('Deselect tag work');
    expect(workTag).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays AND mode by default', async () => {
    render(<TagFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    const andRadio = screen.getByLabelText('All tags (AND)');
    expect(andRadio).toBeChecked();
  });

  it('displays OR mode when selected', async () => {
    render(<TagFilter {...defaultProps} tagsMode="or" />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    const orRadio = screen.getByLabelText('Any tag (OR)');
    expect(orRadio).toBeChecked();
  });

  it('calls onTagsModeChange when mode is toggled', async () => {
    const user = userEvent.setup();
    const onTagsModeChange = vi.fn();

    render(<TagFilter {...defaultProps} onTagsModeChange={onTagsModeChange} />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    const orRadio = screen.getByLabelText('Any tag (OR)');
    await user.click(orRadio);

    expect(onTagsModeChange).toHaveBeenCalledWith('or');
  });

  it('displays clear filters button when tags are selected', async () => {
    render(<TagFilter {...defaultProps} selectedTags={['work']} />);

    await waitFor(() => {
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });
  });

  it('does not display clear filters button when no tags are selected', async () => {
    render(<TagFilter {...defaultProps} selectedTags={[]} />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('clears all selected tags when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSelectedTagsChange = vi.fn();

    render(
      <TagFilter
        {...defaultProps}
        selectedTags={['work', 'personal']}
        onSelectedTagsChange={onSelectedTagsChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear filters');
    await user.click(clearButton);

    expect(onSelectedTagsChange).toHaveBeenCalledWith([]);
  });

  it('displays error message when API fails', async () => {
    vi.mocked(api.getTags).mockRejectedValueOnce(new Error('Network error'));

    render(<TagFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load tags')).toBeInTheDocument();
    });
  });

  it('displays message when no tags are available', async () => {
    vi.mocked(api.getTags).mockResolvedValueOnce([]);

    render(<TagFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No tags available')).toBeInTheDocument();
    });
  });

  it('updates URL when tags are selected', async () => {
    render(<TagFilter {...defaultProps} selectedTags={['work']} tagsMode="and" />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    // URL should be updated
    await waitFor(() => {
      expect(window.location.search).toContain('tags=work');
      expect(window.location.search).toContain('tagsMode=and');
    });
  });

  it('clears URL parameters when no tags are selected', async () => {
    render(<TagFilter {...defaultProps} selectedTags={[]} />);

    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(window.location.search).not.toContain('tags=');
      expect(window.location.search).not.toContain('tagsMode=');
    });
  });
});
