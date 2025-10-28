export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
}

export interface TodoTag {
  todoId: string;
  tagId: string;
  tag: Tag;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: TodoTag[];
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
}

export interface TagWithCount {
  id: string;
  name: string;
  count: number;
}
