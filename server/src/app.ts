import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import type { TaskStore } from "./store.js";
import { createTaskSchema, updateTaskSchema, type TaskEvent } from "./types.js";

export function createApp(store: TaskStore, emit: (event: TaskEvent) => void = () => {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/stats", (_req, res) => {
    res.json(store.stats());
  });

  app.get("/api/tasks", (req, res) => {
    const { status, assignee } = req.query;
    res.json(
      store.list({
        status: typeof status === "string" ? status : undefined,
        assignee: typeof assignee === "string" ? assignee : undefined,
      }),
    );
  });

  app.post("/api/tasks", (req, res) => {
    const task = store.create(createTaskSchema.parse(req.body));
    emit({ type: "task.created", task });
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const task = store.update(req.params.id, updateTaskSchema.parse(req.body));
    if (!task) return res.status(404).json({ error: "Task not found" });
    emit({ type: "task.updated", task });
    res.json(task);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    if (!store.delete(req.params.id)) return res.status(404).json({ error: "Task not found" });
    emit({ type: "task.deleted", id: req.params.id });
    res.status(204).end();
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: err.issues });
    }
    if (err instanceof SyntaxError) return res.status(400).json({ error: "Invalid JSON" });
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
