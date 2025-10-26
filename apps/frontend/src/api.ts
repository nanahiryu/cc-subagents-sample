import type { Todo, CreateTodoInput, UpdateTodoInput } from './types';

const API_BASE = '/api';

export async function getTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_BASE}/todos`);
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
