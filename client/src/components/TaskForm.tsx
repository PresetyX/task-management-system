import { useState, type FormEvent } from "react";
import { api } from "../api";
import type { Priority } from "../types";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await api.create({ title, description, priority, assignee: assignee.trim() || null });
      setTitle("");
      setDescription("");
      setAssignee("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input placeholder="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
      <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button disabled={busy}>Add task</button>
    </form>
  );
}
