import { Task, type ITaskDocument } from "./model";

export const taskRepository = {
  async create(data: {
    title: string;
    inputText: string;
    operationType: string;
    userId: string;
    logs: string[];
  }): Promise<ITaskDocument> {
    return Task.create({
      title: data.title,
      inputText: data.inputText,
      operationType: data.operationType,
      userId: data.userId,
      logs: data.logs,
    });
  },

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ tasks: ITaskDocument[]; total: number }> {
    const filter = { userId };
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(filter),
    ]);
    return { tasks, total };
  },

  async findById(id: string): Promise<ITaskDocument | null> {
    return Task.findById(id);
  },
};
