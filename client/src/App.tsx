import { Board } from "./components/Board";
import { TaskForm } from "./components/TaskForm";
import { useTasks } from "./useTasks";

export function App() {
  const { tasks, connected, error } = useTasks();
  return (
    <main>
      <header className="top">
        <h1>Task Management</h1>
        <span className={connected ? "live on" : "live"}>{connected ? "● live" : "○ reconnecting…"}</span>
      </header>
      {error && <p className="error">{error}</p>}
      <TaskForm />
      <Board tasks={tasks} />
    </main>
  );
}
