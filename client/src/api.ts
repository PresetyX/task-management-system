import type { Priority, Status, Task } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed (${res.status})`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface NewTask {
  title: string;
  description?: string;
  priority?: Priority;
  assignee?: string | null;
}

export const api = {
  list: () => request<Task[]>("/api/tasks"),
  create: (task: NewTask) => request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(task) }),
  setStatus: (id: string, status: Status) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  remove: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
};
