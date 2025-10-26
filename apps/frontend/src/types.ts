export interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
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
