# Phase 7: API Integration & Real-Time SSE in StayLocal

> **Scope:** Centralized API services, native `fetch` client, HttpOnly cookie transport, Netlify reverse proxy, offline resilience, and Server-Sent Events (SSE) in StayLocal.  
> **Target Mastery:** Level 1 (Essential) to Level 3 (Advanced)

---

## Concept 1: Centralized API Service Architecture (`apiService`)

### 1. Concept Name
Service Layer Pattern (Encapsulated Data Access)

### 2. Why It Exists
Writing raw `fetch('https://api.../stays')` directly inside individual React components leads to severe problems: duplicated endpoint URLs, scattered authentication credentials, fragmented error parsing, and tight coupling between the UI and backend HTTP implementation. A centralized API service layer acts as a single gateway between the frontend and backend.

### 3. How It Works
- [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts) exposes a single typed object `apiService`.
- All HTTP calls, base URL resolution, header configuration, cookie policies, response serialization, and error transformations are encapsulated within this single module.
- UI components simply call clean, domain-specific methods like `apiService.getStays()` or `apiService.login(credentials)`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L34-L100)
- **Service:** `apiService`

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },
  // ... over 40 strongly typed domain methods
};
```

### 6. Line-by-Line Explanation
- **Line 1:** `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';` dynamically resolves the backend root. In production on Netlify, it defaults to `/api`, which transparently routes to the Render API.
- **Line 4:** Declares `getHealth()` returning a strongly typed `Promise<HealthResponse>`.

### 7. Execution Flow
1. Component mounts and calls `apiService.getDestinations()`.
2. `apiService` prepares headers, handles URL parameters, and invokes `fetch`.
3. If an error occurs, it unpacks JSON error details and throws a readable `Error`.
4. The component receives clean, typed data.

### 8. Interview Questions
1. *What are the architectural benefits of encapsulating API calls in a dedicated service file rather than in components?*
2. *How does `import.meta.env` work in Vite compared to `process.env` in Create React App?*
3. *Why should API methods return domain models rather than raw HTTP `Response` objects?*

### 9. Practical Exercise
Inspect [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L482-L500). Review `getMyBookings()` and `createBooking()`. Notice how both methods validate `res.ok` before parsing JSON.

### 10. Prerequisites
Promises, `async`/`await`, and HTTP fundamentals.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.5 hours

---

## Concept 2: Cookie-Based Authentication & `credentials: 'include'`

### 1. Concept Name
Credentials Mode in Fetch (`credentials: 'include'`)

### 2. Why It Exists
By default, browser `fetch()` requests omit cookies when communicating across origins or in modern cross-site contexts. If the frontend doesn't tell `fetch` to send cookies, the server receives no session token and rejects requests with `401 Unauthorized`.

### 3. How It Works
- The backend sets a JWT session token in an `HttpOnly` cookie named `staylocal_token`.
- By passing `{ credentials: 'include' }` in `fetch()` options, the browser automatically attaches all cookies belonging to that domain in the outgoing `Cookie` HTTP request header.
- JavaScript cannot read `HttpOnly` cookies (protecting against Cross-Site Scripting, XSS), but the browser sends them automatically.

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L483-L485)
- **Function:** `getMyBookings`

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
async getMyBookings(): Promise<BookingRecord[]> {
  const res = await fetch(`${API_BASE_URL}/bookings/my`, {
    credentials: 'include',
  });
```

### 6. Line-by-Line Explanation
- **Line 2:** `credentials: 'include'` instructs the browser to include credentials (cookies, HTTP basic authentication, and TLS client certificates) with this request.

### 7. Execution Flow
1. Tourist logs in; Render backend sends `Set-Cookie: staylocal_token=...; HttpOnly; Secure; SameSite=Strict`.
2. Browser securely stores the cookie in its private cookie jar.
3. When `getMyBookings()` fires, the browser appends `Cookie: staylocal_token=...` to the HTTP request.
4. Backend middleware validates the JWT and returns the tourist's bookings.

### 8. Interview Questions
1. *What are the security advantages of storing JWTs in `HttpOnly` cookies versus `localStorage`?*
2. *What are the three possible values for `credentials` in `fetch` (`omit`, `same-origin`, `include`)?*
3. *What is CSRF (Cross-Site Request Forgery), and how does the `SameSite=Strict` cookie attribute defend against it?*

### 9. Practical Exercise
Find three other authenticated methods in [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts) (e.g., `getHostBookings`, `confirmBooking`, `getMe`) and verify that all pass `credentials: 'include'`.

### 10. Prerequisites
HTTP headers, cookies, and authentication.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 3: Netlify Transparent Reverse Proxy Architecture (`_redirects`)

### 1. Concept Name
Reverse Proxying for Same-Origin SPA Deployment

### 2. Why It Exists
If the frontend is hosted on Netlify (`https://staylocal.netlify.app`) and makes API requests directly to Render (`https://staylocal-api.onrender.com`), browsers treat this as a cross-origin request (CORS). Strict third-party cookie restrictions in browsers like Safari and Chrome frequently block `HttpOnly` cookies on cross-origin requests. A reverse proxy allows the frontend to send requests to its *own* domain (`/api/*`), which the hosting edge transparently forwards to the backend.

### 3. How It Works
- In [client/public/_redirects](file:///c:/Users/HP/Downloads/Major%20Project/client/public/_redirects), Netlify redirect rules are configured:
  ```
  /api/*  https://staylocal-api.onrender.com/api/:splat  200!
  /*      /index.html                                    200
  ```
- **Line 1 (`200!` rewrite):** When the browser requests `/api/stays`, Netlify's CDN proxies the request to Render, retrieves the data, and returns it to the browser as if it originated from the frontend domain with a 200 status code.
- **Line 2 (SPA fallback):** Any non-API route (e.g., `/stays/stay-mun-01`) is served `index.html` with a 200 status code so React Router can handle routing on the client.

### 4. StayLocal Implementation
- **File Reference:** [client/public/_redirects](file:///c:/Users/HP/Downloads/Major%20Project/client/public/_redirects#L1-L2)
- **Configuration:** Netlify deployment proxy rules.

### 5. Actual Code Example
```
# client/public/_redirects
/api/*  https://staylocal-api.onrender.com/api/:splat  200!
/*      /index.html                                    200
```

### 6. Line-by-Line Explanation
- **Line 1:** The exclamation mark `200!` forces a proxy rewrite even if a local file exists. `:splat` passes whatever was matched by `*` to the destination URL.
- **Line 2:** Standard SPA fallback rule preventing 404 errors when users refresh deep URLs like `/profile` or `/host/listings`.

### 7. Execution Flow
1. Browser requests `GET https://staylocal.netlify.app/api/stays`.
2. Netlify edge proxy intercepts the request.
3. Netlify contacts `https://staylocal-api.onrender.com/api/stays`.
4. Response returns through Netlify to browser under same-origin cookie rules.

### 8. Interview Questions
1. *What is the difference between a 301/302 redirect and a 200 proxy rewrite?*
2. *Why is a reverse proxy the cleanest solution to third-party cookie blocking in modern browsers?*
3. *Why do Single Page Applications require a `/* /index.html 200` rewrite rule on static hosting platforms?*

### 9. Practical Exercise
Explain what would happen if a user refreshes the page on `https://staylocal.netlify.app/bookings` if Line 2 of `_redirects` were deleted.

### 10. Prerequisites
DNS, HTTP reverse proxies, and CORS.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 1.5 hours

---

## Concept 4: Offline Resilience & Graceful Fallback Strategy

### 1. Concept Name
Graceful Degradation with Research Data Fallback

### 2. Why It Exists
Network connectivity in remote Himalayan valleys can be intermittent. Furthermore, during development, local testing, or backend cold starts on Render (free tier sleeping), the backend might temporarily be unreachable. If the frontend crashed or showed an empty blank screen, users couldn't explore research homestays or cultural trails. StayLocal implements **Offline Resilience**: if the API is unreachable, it seamlessly falls back to static research datasets.

### 3. How It Works
1. `apiService` wraps calls in `try/catch`.
2. If `isNetworkError(err)` detects a network failure (`failed to fetch`, `econnrefused`), it sets `_isUsingFallback = true`.
3. It loads data from pre-compiled research modules in [client/src/data](file:///c:/Users/HP/Downloads/Major%20Project/client/src/data).
4. The user can still search, filter, and inspect verified homestays and artisan crafts without interruption.

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L148-L168)
- **Function:** `getDestinations` in `apiService`.

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
} catch (err) {
  if (isNetworkError(err)) {
    _isUsingFallback = true;
    console.info('[StayLocal API] Using local research fallback for destinations');
    let result = [...DESTINATIONS_DATA];
    if (filters?.district) {
      const d = filters.district.toLowerCase();
      result = result.filter((item) => item.district.toLowerCase().includes(d));
    }
    return result;
  }
  throw err;
}
```

### 6. Line-by-Line Explanation
- **Line 2:** `isNetworkError(err)` confirms this is a genuine connection problem rather than a 400 Bad Request or 403 Forbidden.
- **Line 3:** Sets internal fallback flag `_isUsingFallback = true`.
- **Line 5:** Copies static `DESTINATIONS_DATA` array.
- **Lines 6–9:** Replicates server-side filter logic in memory on the client, returning filtered results seamlessly.

### 7. Execution Flow
1. Frontend tries to fetch `/api/destinations`.
2. Network request times out or backend is sleeping.
3. Catch block triggers `isNetworkError`.
4. In-memory research data is filtered and returned.
5. The UI displays the destinations without showing a crash error.

### 8. Interview Questions
1. *What is "graceful degradation" in frontend engineering?*
2. *Why is it important to distinguish between network errors (e.g. connection refused) vs. HTTP client errors (e.g. 400 Bad Request) in fallback logic?*
3. *How does this pattern compare to Service Workers and Progressive Web Apps (PWAs)?*

### 9. Practical Exercise
Inspect [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L100-L102). Notice `isUsingFallback()`. Explain how a UI banner could use this method to display: *"You are viewing offline research records."*

### 10. Prerequisites
`try/catch`, network errors, and array filtering.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 2.5 hours

---

## Concept 5: Real-Time Server-Sent Events (SSE) Availability Stream

### 1. Concept Name
Server-Sent Events (`EventSource` API)

### 2. Why It Exists
In high-demand travel seasons, multiple guests may view the same homestay simultaneously. If Tourist A confirms the last 2 remaining beds, Tourist B's screen would continue showing those beds as available unless they manually refresh the page, leading to booking conflicts. WebSockets are bidirectional and heavy; Server-Sent Events provide a lightweight, HTTP-based, unidirectional stream where the server pushes updates to the client in real time.

### 3. How It Works
- The browser opens a persistent HTTP connection using the native `EventSource` API: `new EventSource('/api/stays/:id/availability/stream')`.
- The server holds the connection open with headers `Content-Type: text/event-stream`.
- Whenever a booking occurs in the backend, the server broadcasts an event: `data: {"event": "availability_updated"}`.
- The client's `es.onmessage` handler fires, triggering a silent availability refresh.

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L456-L480) and [client/src/pages/StayDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StayDetailPage.tsx#L82-L91)
- **Functions:** `subscribeStayAvailability` in `apiService` and subscription effect in `StayDetailPage`.

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
subscribeStayAvailability(stayId: string, onUpdate: () => void): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  try {
    const es = new EventSource(`${API_BASE_URL}/stays/${stayId}/availability/stream`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'availability_updated') {
          onUpdate();
        }
      } catch {
        // ignore parsing error
      }
    };

    return () => {
      es.close();
    };
  } catch {
    return () => {};
  }
}
```

### 6. Line-by-Line Explanation
- **Line 2:** Defensive guard checking browser support for `EventSource`.
- **Line 7:** Instantiates `EventSource` connecting to the homestay availability stream.
- **Line 8:** `es.onmessage` listens for server data packets.
- **Line 11:** If the payload matches `availability_updated`, it executes the caller's `onUpdate()` callback.
- **Line 18:** Returns a teardown function that calls `es.close()`, cleanly closing the stream when the user leaves the page.

### 7. Execution Flow
1. Tourist opens `/stays/stay-mun-01` (StayDetailPage).
2. `useEffect` calls `subscribeStayAvailability('stay-mun-01', fetchLiveAvailability)`.
3. In another browser tab, a host confirms an overlapping reservation.
4. Server emits `availability_updated` on the stream.
5. Tourist's browser receives the packet; `fetchLiveAvailability()` re-runs.
6. The bed inventory counter in the booking widget updates dynamically in real time.

### 8. Interview Questions
1. *How do Server-Sent Events (SSE) compare to WebSockets and HTTP Long-Polling?*
2. *Does `EventSource` automatically reconnect if the network drops?*
3. *What are the limitations of Server-Sent Events (e.g., HTTP/1.1 connection limits per domain)?*

### 9. Practical Exercise
Inspect [client/src/pages/StayDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StayDetailPage.tsx#L82-L91). Explain why `[id, fetchLiveAvailability]` are listed as dependencies in the SSE subscription effect.

### 10. Prerequisites
HTTP streaming, browser Web APIs, and `useEffect` teardown.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 2.5 hours
