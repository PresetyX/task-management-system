import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { TaskEvent } from "./types.js";

export interface Broadcaster {
  broadcast(event: TaskEvent): void;
  close(): void;
}

/** Attach a WebSocket server on /ws that fans task events out to every client. */
export function attachRealtime(server: Server): Broadcaster {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const alive = new WeakSet<WebSocket>();

  wss.on("connection", (socket) => {
    alive.add(socket);
    socket.on("pong", () => alive.add(socket));
  });

  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      if (!alive.has(client)) {
        client.terminate();
        continue;
      }
      alive.delete(client);
      client.ping();
    }
  }, 30_000);
  heartbeat.unref();

  return {
    broadcast(event) {
      const payload = JSON.stringify(event);
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
      }
    },
    close() {
      clearInterval(heartbeat);
      wss.close();
    },
  };
}
