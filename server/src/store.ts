import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { CreateTask, Task, UpdateTask } from "./types.js";

/** In-memory task repository with optional JSON-file persistence. */
export class TaskStore {
  private tasks = new Map<string, Task>();

  constructor(private readonly file?: string) {
    if (file && existsSync(file)) {
      const saved = JSON.parse(readFileSync(file, "utf8")) as Task[];
      for (const t of saved) this.tasks.set(t.id, t);
    }
  }

  list(filter: { status?: string; assignee?: string } = {}): Task[] {
    return [...this.tasks.values()]
      .filter((t) => (!filter.status || t.status === filter.status))
      .filter((t) => (!filter.assignee || t.assignee === filter.assignee))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  create(input: CreateTask): Task {
    const now = new Date().toISOString();
    const task: Task = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.tasks.set(task.id, task);
    this.persist();
    return task;
  }

  update(id: string, patch: UpdateTask): Task | undefined {
    const current = this.tasks.get(id);
    if (!current) return undefined;
    const next: Task = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.tasks.set(id, next);
    this.persist();
    return next;
  }

  delete(id: string): boolean {
    const ok = this.tasks.delete(id);
    if (ok) this.persist();
    return ok;
  }

  stats() {
    const all = [...this.tasks.values()];
    const by = (key: "status" | "priority") =>
      all.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t[key]]: (acc[t[key]] ?? 0) + 1 }), {});
    return { total: all.length, byStatus: by("status"), byPriority: by("priority") };
  }

  private persist() {
    if (!this.file) return;
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify([...this.tasks.values()], null, 2));
  }
}
