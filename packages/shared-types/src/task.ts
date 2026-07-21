export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum OperationType {
  UPPERCASE = "uppercase",
  LOWERCASE = "lowercase",
  REVERSE = "reverse",
  WORD_COUNT = "word_count",
}

export interface ITask {
  id: string;
  userId: string;
  title: string;
  inputText: string;
  operationType: OperationType;
  status: TaskStatus;
  result: string | null;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  inputText: string;
  operationType: OperationType;
}

export interface TaskResultDto {
  taskId: string;
  status: TaskStatus;
  result: string | null;
  logs: string[];
}
