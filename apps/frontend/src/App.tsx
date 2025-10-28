import { useEffect, useState } from 'react';
import {
  addTagsToTodo,
  createTodo,
  deleteTodo,
  getTags,
  getTodos,
  removeTagFromTodo,
  updateTodo,
} from './api';
import { TagFilter } from './components/TagFilter';
import { TagInput } from './components/TagInput';
import { TagList } from './components/TagList';
import type { CreateTodoInput, TagWithCount, Todo } from './types';
import './App.css';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTags, setAllTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsMode, setTagsMode] = useState<'and' | 'or'>('or');

  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to reload when filters change
  useEffect(() => {
    void loadTodos();
    void loadTags();
  }, [selectedTags, tagsMode]);

  async function loadTodos() {
    try {
      setLoading(true);
      setError(null);
      const data = await getTodos({
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        tagsMode,
      });
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  async function loadTags() {
    try {
      const data = await getTags();
      setAllTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
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
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  }

  async function handleAddTag(todoId: string, tagName: string) {
    try {
      await addTagsToTodo(todoId, [tagName]);
      await loadTodos();
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag');
    }
  }

  async function handleRemoveTag(todoId: string, tagId: string) {
    try {
      await removeTagFromTodo(todoId, tagId);
      await loadTodos();
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove tag');
    }
  }

  function handleTagFilterToggle(tagName: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((t) => t !== tagName);
      }
      return [...prev, tagName];
    });
  }

  function handleTagsModToggle() {
    setTagsMode((prev) => (prev === 'and' ? 'or' : 'and'));
  }

  function handleClearFilter() {
    setSelectedTags([]);
  }

  function handleTagClick(tagName: string) {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([tagName]);
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

      <TagFilter
        allTags={allTags}
        selectedTags={selectedTags}
        tagsMode={tagsMode}
        onToggleTag={handleTagFilterToggle}
        onToggleMode={handleTagsModToggle}
        onClear={handleClearFilter}
      />

      <div className="todo-list">
        {todos.length === 0 ? (
          <p className="empty-state">
            {selectedTags.length > 0
              ? 'No todos found with selected tags.'
              : 'No todos yet. Create one above!'}
          </p>
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
                  <TagList
                    tags={todo.tags || []}
                    onRemoveTag={(tagId) => handleRemoveTag(todo.id, tagId)}
                    onTagClick={handleTagClick}
                  />
                  <div className="tag-input-container">
                    <TagInput
                      existingTags={allTags.map((t) => ({ id: t.id, name: t.name }))}
                      onAddTag={(tagName) => handleAddTag(todo.id, tagName)}
                    />
                  </div>
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
