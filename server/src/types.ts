import { z } from "zod";

export const STATUSES = ["todo", "in_progress", "done"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).default(""),
  status: z.enum(STATUSES).default("todo"),
  priority: z.enum(PRIORITIES).default("medium"),
  assignee: z.string().trim().min(1).max(60).nullable().default(null),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export type TaskEvent =
  | { type: "task.created"; task: Task }
  | { type: "task.updated"; task: Task }
  | { type: "task.deleted"; id: string };
