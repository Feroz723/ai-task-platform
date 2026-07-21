import { api } from "@/lib/api-client";

export type TaskStatus = "pending" | "running" | "success" | "failed";
export type OperationType = "uppercase" | "lowercase" | "reverse" | "word_count";

export interface Task {
  id: string;
  title: string;
  inputText: string;
  operationType: OperationType;
  status: TaskStatus;
  result: string | null;
  logs: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const taskService = {
  async create(data: {
    title: string;
    inputText: string;
    operationType: string;
  }): Promise<Task> {
    return api.post<Task>("/tasks", data);
  },

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<Task>> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/tasks?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body.error?.message || "Failed to fetch tasks");
    return { data: body.data, pagination: body.pagination };
  },

  async findById(id: string): Promise<Task> {
    return api.get<Task>(`/tasks/${id}`);
  },
};
