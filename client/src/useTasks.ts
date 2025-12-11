import { useCallback, useEffect, useReducer, useState } from "react";
import { api } from "./api";
import type { Task, TaskEvent } from "./types";

type Action = { type: "load"; tasks: Task[] } | TaskEvent;

export function reducer(state: Task[], action: Action): Task[] {
  switch (action.type) {
    case "load":
      return action.tasks;
    case "task.created":
      return state.some((t) => t.id === action.task.id) ? state : [...state, action.task];
    case "task.updated":
      return state.map((t) => (t.id === action.task.id ? action.task : t));
    case "task.deleted":
      return state.filter((t) => t.id !== action.id);
  }
}

/** Loads tasks over REST and keeps them live through the WebSocket event stream. */
export function useTasks() {
  const [tasks, dispatch] = useReducer(reducer, []);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    () => api.list().then((tasks) => dispatch({ type: "load", tasks })).catch((e: Error) => setError(e.message)),
    [],
  );

  useEffect(() => {
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${proto}://${location.host}/ws`);
      socket.onopen = () => {
        setConnected(true);
        void refresh();
      };
      socket.onmessage = (msg) => dispatch(JSON.parse(msg.data) as TaskEvent);
      socket.onclose = () => {
        setConnected(false);
        if (!closed) timer = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      socket?.close();
    };
  }, [refresh]);

  return { tasks, connected, error };
}
