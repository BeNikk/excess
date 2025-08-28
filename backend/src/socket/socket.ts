// using bun as the web socket server.
import { createClient } from "redis";

const clients:any = new Set();
const subscriber = createClient();
console.log("Client created");
await subscriber.connect();

subscriber.subscribe("price", (data) => {
  console.log("data recieved from the publisher");
  for (let ws of clients){
      ws.send(data);
  }
});
const server = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response("Hello world!");
  },
  websocket: {
    // this is called when a message is received

    async message(ws, message) {
      console.log(`Received ${message}`);
      // send back a message
      ws.send(`You said: ${message}`);
    },
    open(ws) {
      console.log("Client connected in websocket");
      clients.add(ws);
    },
    close(ws) {
      console.log("Client disconnected");
      clients.delete(ws);
    },
  },
  port: 4000,
});

console.log(`Listening on ${server.hostname}:${server.port}`);
