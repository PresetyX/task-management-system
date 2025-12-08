import { createServer } from "node:http";
import { createApp } from "./app.js";
import { attachRealtime } from "./realtime.js";
import { TaskStore } from "./store.js";

const port = Number(process.env.PORT ?? 3001);
const store = new TaskStore(process.env.DATA_FILE ?? "data/tasks.json");

// The HTTP server is created first so the WebSocket layer can share it.
let broadcaster: ReturnType<typeof attachRealtime> | undefined;
const app = createApp(store, (event) => broadcaster?.broadcast(event));
const server = createServer(app);
broadcaster = attachRealtime(server);

server.listen(port, () => console.log(`Task API listening on http://localhost:${port}`));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    broadcaster?.close();
    server.close(() => process.exit(0));
  });
}
