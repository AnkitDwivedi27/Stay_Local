# Module 08: Real-Time Communication with Server-Sent Events (SSE)

This module explains the real-time communication architecture of StayLocal. It covers how the backend pushes live availability and inventory updates to connected web clients using **Server-Sent Events (SSE)**, how connection registries manage subscribers, how proxy timeouts are prevented with heartbeats, and why StayLocal deliberately chose SSE over WebSockets or Socket.IO.

---

## Architectural Confirmation: WebSockets vs. SSE in StayLocal

> [!IMPORTANT]
> **Codebase Fact**: The StayLocal backend **does NOT implement WebSockets or Socket.IO**.
> Instead, StayLocal exclusively uses **Server-Sent Events (SSE)** via standard HTTP streaming in [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts).

```mermaid
flowchart TD
    subgraph Browser ["Tourist Web Browser"]
        A["new EventSource('/api/stays/stay-mun-01/availability/stream')"]
    end

    subgraph Network ["HTTP / Reverse Proxy Layer (Render / Netlify)"]
        B["Persistent HTTP/1.1 Connection"]
        C["Headers: text/event-stream, no-cache, keep-alive"]
    end

    subgraph ExpressBackend ["StayLocal Express Engine"]
        D["handleStayAvailabilityStream() in realtime.service.ts"]
        E["realtimeService.registerClient('stay-mun-01', res)"]
        F["Map<stayId, Set<ClientConnection>>"]
        G["Heartbeat Timer (25s): ': keep-alive\n\n'"]
    end

    subgraph MutationEvent ["Booking Lifecycle Event"]
        H["Booking Confirmed / Cancelled"] --> I["realtimeService.broadcastAvailabilityChange('stay-mun-01')"]
    end

    A --> B --> D --> E --> F
    G -.->|Every 25s| B
    I -->|Push Event| F
    F -->|'data: {event: availability_updated}\n\n'| B
    B -->|onmessage / event listener| A
```

---

## Concept 1: Server-Sent Events (SSE) vs. WebSockets Architecture

### 1. Concept Name
Server-Sent Events (SSE) Unidirectional Push Architecture vs. WebSockets.

### 2. Simple Definition
**Server-Sent Events (SSE)** is an HTML5 standard that allows a web server to push real-time data to a web browser over a single, long-lived HTTP connection. Unlike WebSockets—which provides two-way (bidirectional) communication—SSE is **unidirectional** (server to client only).

### 3. Real-World Analogy
- **WebSockets** is like a full-duplex phone call: both you and your friend speak and listen simultaneously over a specialized line.
- **Server-Sent Events (SSE)** is like tuning into a local Himalayan community FM radio station: the station manager transmits weather and road closure alerts continuously over standard radio waves, while listeners simply tune in their radios and listen without speaking back into the receiver.

### 4. Why Developers Need It
In homestay and travel platforms, 99% of real-time needs are **server-to-client notifications**:
- When another user confirms a booking, the current tourist's screen should immediately update to show remaining beds.
- Tourists don't need real-time binary streaming from the browser; normal tourist interactions (searching, submitting bookings) are standard HTTP `POST` or `GET` requests.
- WebSockets require protocol switching (`HTTP 101 Switching Protocols`), specialized load balancer configurations, custom reconnection handlers, and heavy client libraries. SSE runs over vanilla HTTP, reconnects automatically in browsers via `EventSource`, and works seamlessly through firewalls and corporate proxies.

### 5. How StayLocal Uses It
StayLocal exposes `GET /api/stays/:id/availability/stream` in [server/src/routes/stays.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/stays.route.ts#L17). When a tourist views a homestay details page, the browser opens this stream. Whenever bookings are confirmed or cancelled, the backend notifies all active viewers of that specific homestay so their UI instantly updates remaining beds without page reloads.

### 6. Actual File Location
- File: [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts)
- Route: [server/src/routes/stays.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/stays.route.ts)
- Method: `handleStayAvailabilityStream(req: Request, res: Response)`

### 7. Code Explanation
Here is the stream endpoint from [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L94-L124):

```typescript
export function handleStayAvailabilityStream(req: Request, res: Response): void {
  const stayId = req.params.id as string;
  if (!stayId) {
    res.status(400).json({ error: 'Stay ID is required' });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const cleanup = realtimeService.registerClient(stayId, res);

  // Keep-alive heartbeat every 25 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    cleanup();
  });
}
```

- **Line 95**: Extracts target `stayId` from request parameters.
- **Lines 102–107 (`res.writeHead`)**: Sends HTTP 200 with the mandatory SSE streaming headers.
- **Line 109 (`realtimeService.registerClient`)**: Adds this client's `res` socket to the active subscriber set for this homestay.
- **Lines 112–118**: Sets up a 25-second ping timer.
- **Lines 120–123 (`req.on('close')`)**: Listens for the client disconnecting (closing tab or navigating away) and triggers resource cleanup.

### 8. Execution Flow
1. Tourist navigates to `/stays/stay-mun-01` on the frontend.
2. The browser executes `const es = new EventSource('/api/stays/stay-mun-01/availability/stream')`.
3. Express matches `GET /api/stays/:id/availability/stream` and calls `handleStayAvailabilityStream`.
4. The server writes headers (`Content-Type: text/event-stream`). The connection remains open (no `res.end()` is called).
5. Initial greeting is pushed to the client:
   `data: {"event":"connected","stayId":"stay-mun-01","timestamp":"2026-11-24T12:00:00.000Z"}\n\n`
6. The connection sits idle, awaiting inventory broadcasts or heartbeats.

### 9. Common Mistakes
- **Using WebSockets when only one-way updates are needed**: Adding `socket.io` adds 60KB+ to the frontend bundle, requires sticky sessions on load balancers, and adds complex socket handshake logic for a simple notification use case.
- **Calling `res.end()` or `res.send()` in an SSE handler**: Calling `res.end()` immediately closes the HTTP connection, defeating the purpose of a persistent stream.
- **Buffering middleware**: If an Express response compression middleware (e.g. `compression()`) is enabled without flushing, SSE events get queued in an in-memory buffer and never reach the browser in real time.

### 10. Interview Questions & Answers
**Q1: Compare Server-Sent Events (SSE) and WebSockets across protocol, multiplexing, and reconnection capabilities.**
*Answer:*
| Feature | Server-Sent Events (SSE) | WebSockets (WS) |
| :--- | :--- | :--- |
| **Protocol** | Standard HTTP/1.1 or HTTP/2 | Custom `ws://` / `wss://` protocol |
| **Direction** | Unidirectional (Server to Client) | Full Duplex (Bidirectional) |
| **Data Format** | UTF-8 Text / JSON | Text or Binary (ArrayBuffer, Blob) |
| **Reconnection** | Built-in native browser retry (`EventSource`) | Requires custom JavaScript reconnection logic |
| **Proxy Friendly** | Works over standard port 80/443 without special proxy configs | Often requires explicit reverse proxy upgrade directives |
| **Max Connections** | HTTP/1.1 limited to 6 per domain; HTTP/2 multiplexes 100+ over 1 TCP socket | 1 TCP socket per connection |

**Q2: Why does StayLocal's architectural decision to use SSE over WebSockets fit its operational model?**
*Answer:* StayLocal is an eco-tourism reservation platform. Travelers use standard REST APIs to submit search queries and booking requests. Real-time communication is needed strictly to broadcast availability and bed inventory changes to tourists currently viewing a homestay page. Because communication is purely server-to-client, SSE provides native browser auto-reconnection, lower server memory footprint, zero protocol switching, and 100% compatibility with standard HTTP reverse proxies like Render and Netlify.

### 11. Practical Exercise
Inspect [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L1-L124). Notice how there is zero import of `socket.io` or `ws`. The entire real-time engine is built natively using standard Node.js Express `Response` streaming.

---

## Concept 2: HTTP Streaming Headers and the Event-Stream Protocol

### 1. Concept Name
The `text/event-stream` Protocol Specification and Mandatory HTTP Headers.

### 2. Simple Definition
The **W3C Server-Sent Events specification** defines a strict, line-based text formatting protocol. To maintain an open stream, the server must emit specific HTTP headers that disable client/proxy caching, keep the TCP socket open, and format every message using standardized prefixes (`data:`, `event:`, `id:`) followed by a double newline (`\n\n`).

### 3. Real-World Analogy
Think of a teletype machine or ticker tape in an old stock exchange. The tape rolls continuously. Each message starts on a new line with a prefix like `NEWS:` or `STOCK:`. When a story ends, the machine feeds two blank lines (`\n\n`) to tell the reader that the message is complete and ready to tear off.

### 4. Why Developers Need It
If headers are missing or messages are not terminated with `\n\n`:
1. Intermediate proxies (Cloudflare, Render, AWS ALB) will buffer the text in chunks of 4KB or 8KB, delaying real-time delivery by minutes.
2. The browser's native `EventSource` parser will wait indefinitely for the message to terminate and will never fire the `onmessage` event listener.
3. Browsers may cache the initial response and refuse to open a new stream.

### 5. How StayLocal Uses It
In [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L102-L107), StayLocal explicitly defines the 4 essential SSE headers and formats all broadcasts with `data: ${payload}\n\n`.

### 6. Actual File Location
- File: [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts)
- Lines: 32, 66, 102–107

### 7. Code Explanation
Here are the headers and payload formatting in [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L102-L107):

```typescript
// Set SSE Headers
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
});
```

And the message transmission format:

```typescript
// Initial connection acknowledgment
res.write(`data: ${JSON.stringify({ event: 'connected', stayId: normStayId, timestamp: new Date().toISOString() })}\n\n`);

// Availability broadcast
client.res.write(`data: ${payload}\n\n`);
```

- **`Content-Type: text/event-stream`**: Informs the browser that this response is an open-ended stream of text events rather than a static document.
- **`Cache-Control: no-cache`**: Prevents browser or CDN caching layers from serving stale data or caching the stream connection.
- **`Connection: keep-alive`**: Instructs the underlying TCP socket layer to remain open for future chunked transfers.
- **`\n\n` (Double Newline)**: Essential delimiter defined by the W3C SSE standard. The first `\n` ends the `data:` field; the second `\n` signals the end of the event dispatch.

### 8. Execution Flow
1. Server calls `client.res.write('data: {"event":"availability_updated"}\n\n')`.
2. The Node.js HTTP parser flushes the chunk to the TCP buffer.
3. The browser receives the bytes.
4. The browser's `EventSource` engine parses the prefix `data: ` and buffers the text until it sees the blank line `\n\n`.
5. The browser constructs a `MessageEvent` containing `e.data = '{"event":"availability_updated"}'` and dispatches it to the frontend JavaScript event handler.

### 9. Common Mistakes
- **Using a single newline (`\n`) instead of double newline (`\n\n`)**: If you send `data: hello\n`, the browser will wait indefinitely for more fields (like `id:` or `event:`) and never trigger the `onmessage` callback.
- **Omitting `Cache-Control: no-cache`**: Causes corporate proxies or aggressive browser caches to return a cached 304 or closed response on subsequent connection attempts.

### 10. Interview Questions & Answers
**Q1: What are the standardized field types supported by the Server-Sent Events protocol?**
*Answer:* The W3C SSE specification defines four standard field prefixes:
1. `data: <content>`: The payload body of the event. Can span multiple lines.
2. `event: <name>`: Custom event type. Allows clients to listen with `es.addEventListener('customName', handler)` instead of generic `es.onmessage`.
3. `id: <value>`: Sets the event ID. If the connection drops, the browser sends this ID in the `Last-Event-ID` request header upon reconnecting.
4. `retry: <milliseconds>`: Instructs the browser how many milliseconds to wait before attempting to reconnect after a connection drop.
5. `: <comment>`: Any line starting with a colon is treated as a comment and ignored by the client (useful for keep-alive heartbeats).

**Q2: How does HTTP/2 eliminate the historic 6-connection-per-domain limit of Server-Sent Events?**
*Answer:* Under HTTP/1.1, web browsers enforce a hard limit of 6 concurrent TCP connections per origin. If a user opened 6 browser tabs with active SSE streams, all other HTTP requests (API calls, image downloads) to that domain would be blocked and queued. Under HTTP/2, all streams are multiplexed over a single persistent TCP connection as binary frames, allowing dozens of concurrent SSE streams and API calls to coexist without exhausting browser connection limits.

### 11. Practical Exercise
Check lines 32 and 66 in [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts). Verify that every single call to `res.write()` ends strictly with `\n\n`.

---

## Concept 3: In-Memory Pub/Sub Client Registry (`Map<string, Set<ClientConnection>>`)

### 1. Concept Name
In-Memory Topic-Based Connection Registry using Nested Sets.

### 2. Simple Definition
A **client connection registry** is an in-memory data structure that keeps track of every active HTTP client socket, grouped by the specific resource (topic) they are subscribed to. When an event occurs for a resource, the server iterates through only the clients listening to that specific resource, rather than broadcasting to all users across the entire system.

### 3. Real-World Analogy
Imagine an apartment building with an intercom system. Rather than having a single loudspeaker that blares every message into all 50 apartments, the concierge has an intercom panel organized by apartment number. When a delivery arrives for Apartment 4B, the concierge rings only the handsets in Apartment 4B.

### 4. Why Developers Need It
1. **Targeted Notifications**: If 100 tourists are viewing 50 different homestays in Uttarakhand, an inventory change at `stay-mun-01` should ONLY be sent to the 2 tourists currently viewing `stay-mun-01`. Broadcasting it to all 100 tourists wastes server CPU, outbound network bandwidth, and triggers unnecessary frontend re-renders.
2. **Preventing Memory Leaks**: When clients navigate away, their sockets must be cleanly dereferenced and removed from the set. If dead sockets remain in memory, the Node.js process experiences continuous heap growth.

### 5. How StayLocal Uses It
In [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L9-L44), StayLocal encapsulates client registration inside the `RealtimeService` class using `private clients: Map<string, Set<ClientConnection>> = new Map();`.

### 6. Actual File Location
- File: [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts)
- Class: `RealtimeService`
- Lines: 9–44, 77–86

### 7. Code Explanation
Here is the client registration and cleanup lifecycle from [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L9-L44):

```typescript
interface ClientConnection {
  id: string;
  res: Response;
  stayId: string;
}

class RealtimeService {
  private clients: Map<string, Set<ClientConnection>> = new Map();

  public registerClient(stayId: string, res: Response): () => void {
    const normStayId = stayId.toLowerCase();
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const connection: ClientConnection = {
      id: clientId,
      res,
      stayId: normStayId,
    };

    if (!this.clients.has(normStayId)) {
      this.clients.set(normStayId, new Set());
    }

    this.clients.get(normStayId)!.add(connection);

    // Initial connection acknowledgment
    res.write(`data: ${JSON.stringify({ event: 'connected', stayId: normStayId, timestamp: new Date().toISOString() })}\n\n`);

    // Cleanup function
    return () => {
      const set = this.clients.get(normStayId);
      if (set) {
        set.delete(connection);
        if (set.size === 0) {
          this.clients.delete(normStayId); // Prune empty topics
        }
      }
    };
  }
}
```

- **Line 10 (`Map<string, Set<ClientConnection>>`)**: Keyed by `stayId`. The value is a JavaScript `Set` containing the active client connections for that stay. Using `Set` guarantees $O(1)$ addition and $O(1)$ deletion without duplicate entries.
- **Lines 17–23**: Assigns a unique tracking `clientId` and constructs the connection descriptor holding Express's `res` object.
- **Lines 25–29**: Initializes the `Set` if this is the first viewer for the homestay, then adds the connection.
- **Lines 35–43 (Returned Cleanup Closure)**: Returns a cleanup teardown function. When called, it removes the connection from the `Set`. If `set.size === 0`, it deletes the `stayId` key from the `Map`, freeing up memory when no one is watching that homestay.

### 8. Execution Flow
1. Tourist A opens `/stays/stay-mun-01`. `registerClient` creates a `Set` for `'stay-mun-01'` and adds Tourist A.
2. Tourist B opens `/stays/stay-mun-01`. Tourist B is added to the same `Set`. (Count: 2).
3. Tourist C opens `/stays/stay-bhm-01`. A new `Set` is created for `'stay-bhm-01'`.
4. Host confirms a booking on `stay-mun-01`.
5. `broadcastAvailabilityChange('stay-mun-01')` retrieves only the `Set` for `'stay-mun-01'`.
6. Sends the notification to Tourist A and Tourist B. Tourist C receives zero traffic.
7. Tourist A closes the browser tab. `req.on('close')` fires, executing the cleanup closure. Tourist A is removed from the `Set`.

### 9. Common Mistakes
- **Forgetting to delete empty keys**: If you remove clients from the `Set` but never call `this.clients.delete(normStayId)` when `set.size === 0`, the `Map` will eventually contain thousands of empty Sets, leaking memory.
- **Storing request objects instead of response objects**: The `res` object is what writes to the client socket. Holding references to large `req` objects retains uploaded payloads and headers in memory unnecessarily.

### 10. Interview Questions & Answers
**Q1: How does using an in-memory `Map<string, Set<ClientConnection>>` behave when scaling to multiple backend server instances?**
*Answer:* An in-memory registry works within a single Node.js process. When scaling horizontally across multiple container instances (e.g., 3 Render web services), an event triggered on Instance 1 will only notify clients connected to Instance 1; clients connected to Instances 2 and 3 will not receive the update. In a multi-instance production cluster, this is resolved by introducing a **Redis Pub/Sub** or RabbitMQ message broker: each backend instance subscribes to Redis channels and fans out messages to its own locally-connected SSE clients.

**Q2: Why is `Set` preferred over an `Array` for storing client connections in the registry?**
*Answer:* A `Set` enforces reference uniqueness and provides $O(1)$ constant-time lookup and deletion via `set.delete(connection)`. In contrast, deleting an item from an `Array` requires $O(N)$ linear scanning with `indexOf` or `filter()`, which degrades performance as the number of concurrent listeners on a popular listing increases.

### 11. Practical Exercise
Review [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L77-L86). Look at `getActiveListenerCount()`. Observe how it calculates total system listeners across all homestays by iterating `this.clients.values()`.

---

## Concept 4: Proxy Timeout Prevention via Heartbeat Intervals (`: keep-alive\n\n`)

### 1. Concept Name
SSE Keep-Alive Heartbeat Mechanisms and Reverse Proxy Timeout Mitigation.

### 2. Simple Definition
A **heartbeat** (or ping) is a lightweight comment message sent periodically from the server to the client across an idle streaming connection. It keeps network devices, load balancers, and reverse proxies from assuming the connection is dead and abruptly terminating it.

### 3. Real-World Analogy
Imagine staying on a phone call while your friend walks into the other room to look for a document. Every 20 seconds, they shout "Still here!" from down the hall. If they stayed silent for 60 seconds, you would assume the line got disconnected and hang up.

### 4. Why Developers Need It
Modern cloud hosting providers and edge proxies (Render, AWS CloudFront, Cloudflare, Nginx, Netlify) enforce **idle connection timeouts** (typically 30 seconds to 60 seconds). If no data bytes traverse an active TCP connection within that window, the proxy assumes the client or server has crashed and sends a TCP `FIN` packet, closing the stream. Heartbeats ensure bytes are transmitted regularly, keeping the socket indefinitely alive.

### 5. How StayLocal Uses It
In [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L111-L123), StayLocal sets a 25-second interval timer for every connected client that writes `: keep-alive\n\n`. In SSE, any line beginning with a colon (`:`) is parsed as a comment and ignored by the browser, preserving connection state without triggering frontend event listeners.

### 6. Actual File Location
- File: [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts)
- Lines: 111–123

### 7. Code Explanation
Here is the heartbeat logic from [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L111-L123):

```typescript
// Keep-alive heartbeat every 25 seconds
const heartbeat = setInterval(() => {
  try {
    res.write(': keep-alive\n\n');
  } catch {
    clearInterval(heartbeat);
  }
}, 25000);

req.on('close', () => {
  clearInterval(heartbeat);
  cleanup();
});
```

- **Line 112 (`setInterval(..., 25000)`)**: Triggers every 25,000 milliseconds (25 seconds). This is specifically chosen to be below Render and Nginx's 30-to-60-second idle socket timeout.
- **Line 114 (`res.write(': keep-alive\n\n')`)**: Writes an SSE comment line. The leading colon (`:`) tells the browser's `EventSource` parser to discard the line silently without dispatching an event to user code.
- **Lines 115–117**: If `res.write()` fails because the underlying socket was abruptly terminated, the `catch` block clears the interval timer immediately.
- **Lines 120–123 (`req.on('close')`)**: When the client disconnects normally, `clearInterval(heartbeat)` is called to prevent timer leaks in the Node.js event loop.

### 8. Execution Flow
1. Tourist opens stream. Heartbeat timer starts at $T=0$.
2. No booking updates occur for 24 seconds.
3. At $T=25\text{s}$, timer fires: server writes `: keep-alive\n\n`.
4. Render reverse proxy notes active data transfer on the socket and resets its idle timeout counter.
5. Tourist's browser receives the comment, ignores it, and keeps the stream active.
6. The process repeats indefinitely until the tourist leaves the page.

### 9. Common Mistakes
- **Sending normal data for heartbeats**: Sending `data: ping\n\n` causes the browser's `onmessage` listener to fire every 25 seconds, forcing the frontend application to process dummy messages. Using the SSE comment format (`: comment\n\n`) is silent and clean.
- **Forgetting `clearInterval()` on socket close**: If you do not listen to `req.on('close')` and clear the timer, the interval timer will continue firing in the background forever, attempting to write to dead sockets and leaking memory.

### 10. Interview Questions & Answers
**Q1: Why does StayLocal use an SSE comment line (`: keep-alive\n\n`) for heartbeats instead of a standard event payload?**
*Answer:* According to the W3C Server-Sent Events standard, any line that begins with a colon character (`:`) is defined as a comment. The browser's native `EventSource` parser discards comment lines completely without triggering the `onmessage` handler or dispatching any DOM events. This allows the backend to transmit raw bytes across the TCP connection to satisfy reverse proxy idle timeouts without polluting client application state.

**Q2: What happens if a Node.js server forgets to clear heartbeat intervals when clients disconnect?**
*Answer:* In Node.js, active `setInterval` timers are registered in the internal timer heap and keep references to their enclosing lexical scope (including the `res` and `req` objects). If not cancelled via `clearInterval()`, these closures cannot be garbage collected, leading to an **event listener and memory leak**. Over time, thousands of orphaned timers will run continuously, wasting CPU cycles and eventually crashing the process with an `Out of Memory` (OOM) error.

### 11. Practical Exercise
Inspect lines 120–123 in [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts). Verify that `clearInterval(heartbeat)` is the very first line executed inside the `req.on('close')` event listener.

---

## Concept 5: Real-Time Broadcast Integration with the Booking Lifecycle

### 1. Concept Name
Lifecycle-Driven Event Broadcasting and Resilient Socket Error Handling.

### 2. Simple Definition
**Lifecycle-driven broadcasting** is the practice of triggering real-time update notifications immediately following successful state-modifying database operations (such as confirming, cancelling, or releasing a booking). Resilient broadcasting ensures that if any individual client socket has dropped or disconnected, it is pruned without breaking the broadcast loop for other clients.

### 3. Real-World Analogy
Imagine a stock exchange trading floor where a bell rings whenever a trade clears. If one trader's telephone line happens to be static or unplugged, the exchange doesn't cancel the bell or stop speaking to the other 99 traders; the operator simply unplugs the dead handset and continues announcing the price.

### 4. Why Developers Need It
1. **Immediate Consistency Across Users**: If Tourist A confirms the last available cottage, Tourist B (viewing the same cottage on another screen) must see the cottage become unavailable in real time, preventing them from attempting a doomed booking.
2. **Defensive Socket Protection**: Web browsers frequently close without warning (e.g., closing laptop lid, losing Wi-Fi signal). If a broadcast loop attempts to call `.write()` on a broken socket without error handling, Node.js throws an uncaught exception (`EPIPE` or `ECONNRESET`), crashing the server.

### 5. How StayLocal Uses It
In [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L50-L72), `broadcastAvailabilityChange()` iterates through all listeners of a stay inside a `try/catch` block, pruning any closed sockets. This method is called from `BookingService.confirmBooking()` and `BookingService.cancelBooking()`.

### 6. Actual File Location
- File: [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts)
- Method: `broadcastAvailabilityChange(stayId: string)`
- Call Sites: [server/src/services/booking.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/booking.service.ts#L276) (`cancelBooking`), Line 425 (`confirmBooking`)

### 7. Code Explanation
Here is the broadcast implementation from [server/src/services/realtime.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/realtime.service.ts#L50-L72):

```typescript
public broadcastAvailabilityChange(stayId: string): void {
  const normStayId = stayId.toLowerCase();
  const listeners = this.clients.get(normStayId);

  if (!listeners || listeners.size === 0) {
    return;
  }

  const payload = JSON.stringify({
    event: 'availability_updated',
    stayId: normStayId,
    timestamp: new Date().toISOString(),
  });

  for (const client of listeners) {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // Socket may have closed unexpectedly
      listeners.delete(client);
    }
  }
}
```

- **Lines 51–56**: Normalizes `stayId` and checks if any clients are listening. If no one is currently viewing the homestay, it exits immediately with zero computation.
- **Lines 58–62**: Pre-serializes the JSON payload string **once** before entering the loop. This avoids re-running `JSON.stringify()` for every individual subscriber, saving CPU cycles.
- **Lines 64–71**: Traverses the `Set` of client connections:
  - `client.res.write(...)`: Transmits the event to the client.
  - `catch`: If writing fails because the client lost network connection, `listeners.delete(client)` automatically prunes the dead connection from memory.

### 8. Execution Flow
1. Host clicks "Confirm Booking" on `/admin/bookings`.
2. `BookingService.confirmBooking()` atomically updates the booking in MongoDB Atlas from `'pending'` to `'confirmed'`.
3. Immediately following the successful commit, line 425 executes:
   `realtimeService.broadcastAvailabilityChange(booking.stayId);`
4. `realtimeService` finds 3 active viewers on that homestay.
5. All 3 browsers receive:
   `data: {"event":"availability_updated","stayId":"stay-mun-01","timestamp":"2026-11-24T12:05:00.000Z"}\n\n`
6. The frontend's `EventSource` triggers a re-fetch of the stay's `/availability` endpoint.
7. Available beds on the screen updates from "2 beds left" to "0 beds left (Sold Out)" within 50 milliseconds.

### 9. Common Mistakes
- **Putting sensitive user data in broadcast payloads**: The SSE stream is an unauthenticated public event channel for stay viewers. Sending tourist names, phone numbers, or payment totals in the broadcast payload creates an immediate security and privacy breach. StayLocal only broadcasts safe operational metadata: `{ event: 'availability_updated', stayId, timestamp }`.
- **Serializing JSON inside the loop**: Running `JSON.stringify()` inside `for (const client of listeners)` when broadcasting to 5,000 clients causes unnecessary CPU thrashing. Always serialize the string once outside the loop.

### 10. Interview Questions & Answers
**Q1: Why should an SSE broadcast payload contain an "invalidation signal" rather than full new database state?**
*Answer:* In real-time architectures, broadcasting full data snapshots (e.g. the complete updated homestay document with all bookings) can lead to data races and security issues, since different clients have different authorization scopes (tourists vs hosts). Broadcasting a lightweight **invalidation signal** (e.g. `{ event: 'availability_updated', stayId }`) instructs connected clients to re-query the standard REST endpoint with their own credentials, guaranteeing that caching, rate limiting, and role-based permissions are strictly respected.

**Q2: What is the risk of an unhandled `EPIPE` error in Node.js when writing to an HTTP response socket?**
*Answer:* When a client abruptly terminates a TCP connection without completing an HTTP handshake (e.g., pulling a network cable or closing a mobile browser), writing to that socket in Node.js can emit an `EPIPE` ("broken pipe") or `ECONNRESET` error on the stream. If the write operation is not wrapped in a `try/catch` or an error event handler, the unhandled stream error bubbles up to the Node.js `uncaughtException` handler and crashes the entire server process.

### 11. Practical Exercise
Open [server/src/services/booking.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/booking.service.ts#L276). Search for `broadcastAvailabilityChange`. Notice how both `cancelBooking()` and `confirmBooking()` trigger this notification to keep the entire community informed of inventory changes.

---

## Summary of Real-Time SSE Architecture

| Feature | Implementation | Architectural Benefit |
| :--- | :--- | :--- |
| **Protocol** | Server-Sent Events (`text/event-stream`) | Zero extra dependencies; native browser auto-reconnect |
| **Absence of WebSockets** | Deliberate engineering decision | No socket handshakes, sticky sessions, or proxy upgrades |
| **Subscriber Registry** | `Map<string, Set<ClientConnection>>` | $O(1)$ operations; targeted homestay-level topic routing |
| **Keep-Alive Heartbeat** | `: keep-alive\n\n` every 25 seconds | Prevents Render and proxy timeouts without triggering client events |
| **Broadcast Safety** | Isolated `try/catch` pruning dead sockets | Prevents server crash on broken client network sockets |