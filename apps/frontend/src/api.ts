import type { CreateTodoInput, Tag, TagWithCount, Todo, UpdateTodoInput } from './types';

const API_BASE = '/api';

export async function getTodos(params?: {
  tags?: string[];
  tagsMode?: 'and' | 'or';
}): Promise<Todo[]> {
  const url = new URL(`${API_BASE}/todos`, window.location.origin);

  if (params?.tags && params.tags.length > 0) {
    url.searchParams.set('tags', params.tags.join(','));
  }

  if (params?.tagsMode) {
    url.searchParams.set('tagsMode', params.tagsMode);
  }

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch todos');
  return response.json();
}

export async function getTodo(id: string): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${id}`);
  if (!response.ok) throw new Error('Failed to fetch todo');
  return response.json();
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create todo');
  return response.json();
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to update todo');
  return response.json();
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete todo');
}

// Tag APIs
export async function getTags(): Promise<TagWithCount[]> {
  const response = await fetch(`${API_BASE}/tags`);
  if (!response.ok) throw new Error('Failed to fetch tags');
  return response.json();
}

export async function createTag(name: string): Promise<Tag> {
  const response = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create tag');
  return response.json();
}

export async function addTagsToTodo(todoId: string, tagNames: string[]): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${todoId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagNames }),
  });
  if (!response.ok) throw new Error('Failed to add tags to todo');
  return response.json();
}

export async function removeTagFromTodo(todoId: string, tagId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/todos/${todoId}/tags/${tagId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove tag from todo');
}
