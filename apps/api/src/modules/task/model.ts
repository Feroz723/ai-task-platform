import mongoose, { Schema, type Document } from "mongoose";

export type TaskStatus = "pending" | "running" | "success" | "failed";
export type OperationType =
  | "uppercase"
  | "lowercase"
  | "reverse"
  | "word_count";

export interface ITaskDocument extends Document {
  title: string;
  inputText: string;
  operationType: OperationType;
  status: TaskStatus;
  result: string | null;
  logs: string[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    inputText: { type: String, required: true },
    operationType: {
      type: String,
      enum: ["uppercase", "lowercase", "reverse", "word_count"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "success", "failed"],
      default: "pending",
    },
    result: { type: String, default: null },
    logs: { type: [String], default: [] },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdAt: -1 });

export const Task = mongoose.model<ITaskDocument>("Task", taskSchema);
