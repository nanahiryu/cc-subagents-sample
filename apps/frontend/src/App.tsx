import { useEffect, useState } from 'react';
import { createTodo, deleteTodo, getTodos, updateTodo } from './api';
import type { CreateTodoInput, Todo } from './types';
import './App.css';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    try {
      setLoading(true);
      setError(null);
      const data = await getTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      const input: CreateTodoInput = {
        title: newTodoTitle,
        description: newTodoDescription || undefined,
      };
      await createTodo(input);
      setNewTodoTitle('');
      setNewTodoDescription('');
      await loadTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    }
  }

  async function handleToggleComplete(todo: Todo) {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      await loadTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      await deleteTodo(id);
      await loadTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  }

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Todo App</h1>

      {error && (
        <div className="error">
          {error}
          <button type="button" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="todo-form">
        <input
          type="text"
          placeholder="Todo title"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          maxLength={100}
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newTodoDescription}
          onChange={(e) => setNewTodoDescription(e.target.value)}
        />
        <button type="submit">Add Todo</button>
      </form>

      <div className="todo-list">
        {todos.length === 0 ? (
          <p className="empty-state">No todos yet. Create one above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <div className="todo-content">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(todo)}
                  aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                />
                <div className="todo-text">
                  <h3>{todo.title}</h3>
                  {todo.description && <p>{todo.description}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                className="delete-btn"
                aria-label={`Delete "${todo.title}"`}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
