"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/Button";
import { taskService, type Task } from "@/services/task.service";

function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTask = useCallback(async () => {
    try {
      const data = await taskService.findById(id);
      setTask(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Task not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    if (!task) return;
    if (task.status === "success" || task.status === "failed") return;

    const interval = setInterval(fetchTask, 3000);
    return () => clearInterval(interval);
  }, [task, fetchTask]);

  if (loading) return <Spinner className="py-16" />;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-600 mb-4">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-neutral-600 hover:text-neutral-900 mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </button>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-neutral-900">{task.title}</h1>
              <Badge status={task.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">Operation</p>
                <p className="font-medium">{task.operationType.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-neutral-500">Created</p>
                <p className="font-medium">{new Date(task.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-neutral-500 mb-1">Input text</p>
              <p className="text-sm bg-neutral-100 rounded-md px-3 py-2 whitespace-pre-wrap">{task.inputText}</p>
            </div>

            {task.result !== null && (
              <div>
                <p className="text-sm text-neutral-500 mb-1">Result</p>
                <p className="text-sm bg-neutral-100 rounded-md px-3 py-2 whitespace-pre-wrap">{task.result}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-neutral-500 mb-1">Logs</p>
              <div className="bg-neutral-100 rounded-md px-3 py-2 space-y-1">
                {task.logs.length === 0 ? (
                  <p className="text-sm text-neutral-400">No logs yet</p>
                ) : (
                  task.logs.map((log, i) => (
                    <p key={i} className="text-xs font-mono text-neutral-700">{log}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <ProtectedRoute>
      <TaskDetail />
    </ProtectedRoute>
  );
}
