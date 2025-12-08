import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { WebSocket } from "ws";
import { createApp } from "../src/app.js";
import { attachRealtime, type Broadcaster } from "../src/realtime.js";
import { TaskStore } from "../src/store.js";

let server: Server;
let broadcaster: Broadcaster;
let base: string;

before(async () => {
  const store = new TaskStore();
  let b: Broadcaster | undefined;
  server = createServer(createApp(store, (e) => b?.broadcast(e)));
  b = broadcaster = attachRealtime(server);
  await new Promise<void>((r) => server.listen(0, r));
  base = `127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  broadcaster.close();
  server.close();
});

const json = (method: string, path: string, body?: unknown) =>
  fetch(`http://${base}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe("tasks API", () => {
  it("creates, lists, updates and deletes a task", async () => {
    const created = await json("POST", "/api/tasks", { title: "Write tests", priority: "high" });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.equal(task.status, "todo");
    assert.equal(task.priority, "high");

    const list = await (await json("GET", "/api/tasks")).json();
    assert.equal(list.length, 1);

    const patched = await (await json("PATCH", `/api/tasks/${task.id}`, { status: "done" })).json();
    assert.equal(patched.status, "done");

    const stats = await (await json("GET", "/api/stats")).json();
    assert.deepEqual(stats.byStatus, { done: 1 });

    assert.equal((await json("DELETE", `/api/tasks/${task.id}`)).status, 204);
    assert.equal((await json("DELETE", `/api/tasks/${task.id}`)).status, 404);
  });

  it("rejects invalid payloads", async () => {
    const res = await json("POST", "/api/tasks", { title: "" });
    assert.equal(res.status, 400);
    assert.equal((await json("PATCH", "/api/tasks/nope", { status: "bogus" })).status, 400);
  });

  it("filters by status", async () => {
    await json("POST", "/api/tasks", { title: "A", status: "in_progress" });
    await json("POST", "/api/tasks", { title: "B" });
    const list = await (await json("GET", "/api/tasks?status=in_progress")).json();
    assert.ok(list.length >= 1 && list.every((t: { status: string }) => t.status === "in_progress"));
  });

  it("pushes events over WebSocket", async () => {
    const ws = new WebSocket(`ws://${base}/ws`);
    await new Promise((r) => ws.once("open", r));
    const received = new Promise<{ type: string }>((r) => ws.once("message", (m) => r(JSON.parse(String(m)))));
    await json("POST", "/api/tasks", { title: "Realtime" });
    assert.equal((await received).type, "task.created");
    ws.close();
  });
});
