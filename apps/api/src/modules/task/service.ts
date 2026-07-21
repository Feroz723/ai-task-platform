import { taskRepository } from "./repository";
import { enqueueTask } from "../../services/queue.service";
import { appendTaskLog } from "../../utils/task-log";
import { createAppError } from "../../middlewares/error-handler.middleware";

export const taskService = {
  async create(data: {
    title: string;
    inputText: string;
    operationType: string;
    userId: string;
  }) {
    const logs = appendTaskLog([], "Task queued");
    const task = await taskRepository.create({ ...data, logs });

    await enqueueTask(
      task._id.toString(),
      task.operationType,
      task.inputText
    );

    return {
      id: task._id.toString(),
      title: task.title,
      inputText: task.inputText,
      operationType: task.operationType,
      status: task.status,
      result: task.result,
      logs: task.logs,
      userId: task.userId.toString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  },

  async findAll(userId: string, page: number, limit: number) {
    const { tasks, total } = await taskRepository.findByUserId(
      userId,
      page,
      limit
    );

    const items = tasks.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      inputText: task.inputText,
      operationType: task.operationType,
      status: task.status,
      result: task.result,
      logs: task.logs,
      userId: task.userId.toString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string, userId: string) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw createAppError("Task not found", 404);
    }

    if (task.userId.toString() !== userId) {
      throw createAppError("Task not found", 404);
    }

    return {
      id: task._id.toString(),
      title: task.title,
      inputText: task.inputText,
      operationType: task.operationType,
      status: task.status,
      result: task.result,
      logs: task.logs,
      userId: task.userId.toString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  },
};
