"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Spinner } from "@/components/Spinner";
import { taskService, type Task } from "@/services/task.service";

const OPERATIONS = [
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "LOWERCASE" },
  { value: "reverse", label: "REVERSE" },
  { value: "word_count", label: "WORD_COUNT" },
];

function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [inputText, setInputText] = useState("");
  const [operationType, setOperationType] = useState("uppercase");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !inputText) {
      setError("Title and input text are required");
      return;
    }

    setLoading(true);
    try {
      await taskService.create({ title, inputText, operationType });
      setTitle("");
      setInputText("");
      setOperationType("uppercase");
      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Create Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My task" />
        <TextArea label="Input text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Enter text to process" />
        <Select label="Operation" value={operationType} onChange={(e) => setOperationType(e.target.value)} options={OPERATIONS} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" loading={loading}>Create Task</Button>
      </form>
    </Card>
  );
}

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await taskService.findAll(1, 50);
      setTasks(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  if (loading) return <Spinner />;

  return (
    <Card title="My Tasks">
      {tasks.length === 0 ? (
        <p className="text-sm text-neutral-500">No tasks yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between border border-neutral-200 rounded-md px-3 py-2">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-medium text-neutral-900 truncate">{task.title}</p>
                <p className="text-xs text-neutral-500">{task.operationType.toUpperCase()} &middot; {new Date(task.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge status={task.status} />
                <Link href={`/tasks/${task.id}`} className="text-sm text-neutral-600 hover:text-neutral-900 underline">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <CreateTaskForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <TaskList key={refreshKey} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
