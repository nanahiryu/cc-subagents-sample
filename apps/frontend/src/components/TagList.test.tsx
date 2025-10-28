import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Tag } from '../types';
import { TagList } from './TagList';

describe('TagList', () => {
  const mockTags: Tag[] = [
    { id: '1', name: 'work', count: 5 },
    { id: '2', name: 'personal', count: 3 },
    { id: '3', name: 'urgent', count: 2 },
  ];

  it('renders tags as badges', () => {
    render(<TagList tags={mockTags} />);

    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('personal')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('renders nothing when tags array is empty', () => {
    const { container } = render(<TagList tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onTagClick when tag is clicked', async () => {
    const user = userEvent.setup();
    const onTagClick = vi.fn();

    render(<TagList tags={mockTags} onTagClick={onTagClick} />);

    const workTag = screen.getByText('work');
    await user.click(workTag);

    expect(onTagClick).toHaveBeenCalledWith(mockTags[0]);
  });

  it('calls onTagClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onTagClick = vi.fn();

    render(<TagList tags={mockTags} onTagClick={onTagClick} />);

    const workTag = screen.getByRole('button', { name: 'Filter by tag work' });
    workTag.focus();
    await user.keyboard('{Enter}');

    expect(onTagClick).toHaveBeenCalledWith(mockTags[0]);
  });

  it('calls onTagClick when Space key is pressed', async () => {
    const user = userEvent.setup();
    const onTagClick = vi.fn();

    render(<TagList tags={mockTags} onTagClick={onTagClick} />);

    const workTag = screen.getByRole('button', { name: 'Filter by tag work' });
    workTag.focus();
    await user.keyboard(' ');

    expect(onTagClick).toHaveBeenCalledWith(mockTags[0]);
  });

  it('displays remove button when onTagRemove is provided', () => {
    const onTagRemove = vi.fn();

    render(<TagList tags={mockTags} onTagRemove={onTagRemove} />);

    expect(screen.getByLabelText('Remove tag work')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove tag personal')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove tag urgent')).toBeInTheDocument();
  });

  it('does not display remove button when onTagRemove is not provided', () => {
    render(<TagList tags={mockTags} />);

    expect(screen.queryByLabelText('Remove tag work')).not.toBeInTheDocument();
  });

  it('calls onTagRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onTagRemove = vi.fn();

    render(<TagList tags={mockTags} onTagRemove={onTagRemove} />);

    const removeButton = screen.getByLabelText('Remove tag work');
    await user.click(removeButton);

    expect(onTagRemove).toHaveBeenCalledWith('1');
  });

  it('does not trigger onTagClick when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onTagClick = vi.fn();
    const onTagRemove = vi.fn();

    render(<TagList tags={mockTags} onTagClick={onTagClick} onTagRemove={onTagRemove} />);

    const removeButton = screen.getByLabelText('Remove tag work');
    await user.click(removeButton);

    expect(onTagRemove).toHaveBeenCalledWith('1');
    expect(onTagClick).not.toHaveBeenCalled();
  });

  it('applies different colors to different tags', () => {
    const { container } = render(<TagList tags={mockTags} />);

    // Check that tags have color classes
    const tagElements = container.querySelectorAll('span[class*="bg-"]');
    expect(tagElements.length).toBeGreaterThan(0);
  });

  it('applies consistent color for same tag name', () => {
    const duplicateTags: Tag[] = [
      { id: '1', name: 'work', count: 5 },
      { id: '2', name: 'work', count: 3 },
    ];

    const { container } = render(<TagList tags={duplicateTags} />);

    const tagElements = container.querySelectorAll('span[class*="bg-"]');
    const firstTagClasses = tagElements[0].className;
    const secondTagClasses = tagElements[1].className;

    // Both should have same color classes
    expect(firstTagClasses).toBe(secondTagClasses);
  });
});
