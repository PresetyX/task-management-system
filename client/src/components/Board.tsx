import { api } from "../api";
import { COLUMNS, type Status, type Task } from "../types";

function TaskCard({ task }: { task: Task }) {
  return (
    <article className={`card priority-${task.priority}`} draggable onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}>
      <header>
        <strong>{task.title}</strong>
        <button aria-label={`Delete ${task.title}`} onClick={() => void api.remove(task.id)}>×</button>
      </header>
      {task.description && <p>{task.description}</p>}
      <footer>
        <span className="badge">{task.priority}</span>
        {task.assignee && <span className="assignee">@{task.assignee}</span>}
      </footer>
    </article>
  );
}

export function Board({ tasks }: { tasks: Task[] }) {
  const drop = (status: Status) => (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/task-id");
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) void api.setStatus(id, status);
  };

  return (
    <div className="board">
      {COLUMNS.map(({ status, label }) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <section key={status} className="column" onDragOver={(e) => e.preventDefault()} onDrop={drop(status)}>
            <h2>
              {label} <span>{items.length}</span>
            </h2>
            {items.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
