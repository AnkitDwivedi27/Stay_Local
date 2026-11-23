# Phase 1: JavaScript Fundamentals & Web APIs in StayLocal

> **Scope:** Core JavaScript (ES6+), modern browser Web APIs, and asynchronous programming patterns powering the StayLocal frontend.  
> **Target Mastery:** Level 1 (Essential) & Level 2 (Intermediate)

---

## Concept 1: ES6 Modules (`import` and `export`)

### 1. Concept Name
ES6 Modules (Static Module System)

### 2. Why It Exists
Before ES6, JavaScript lacked an official, standardized module system. Large applications relied on global variables, `<script>` tag ordering, or wrapper formats like CommonJS (`require`) and AMD. This caused namespace pollution, hidden collisions, and untraceable dependencies. ES6 modules establish explicit boundaries between files: code is private by default and only exposed through explicit exports.

### 3. How It Works
- **C++/Java Analogy:** Similar to `#include <header>` in C++ or `import package.Class;` in Java, with an important distinction: ES6 module resolution is **static**. The JavaScript engine analyzes all `import` and `export` statements *before* running any code.
- **`export const / export function` (Named Export):** Exposes one or more specific identifiers from a file. Consumers must import them using the exact same name in curly braces (`import { Button } from './Button'`).
- **`export default` (Default Export):** Exposes one primary entity per file. Consumers can import it under any identifier without curly braces (`import App from './App'`).

### 4. StayLocal Implementation
- **File Reference:** [client/src/main.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/main.tsx#L1-L5) and [client/src/components/ui/Button.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Button.tsx#L9)
- **Role:** Central application bootstrap and reusable component exposition.

### 5. Actual Code Example
```typescript
// client/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
```

### 6. Line-by-Line Explanation
- **Line 1:** `import React from 'react';` imports the default export from the `react` package.
- **Line 2:** `import ReactDOM from 'react-dom/client';` imports the React 18 client rendering bundle.
- **Line 3:** `import { BrowserRouter } from 'react-router-dom';` imports the named `BrowserRouter` component from the router package using destructuring syntax.
- **Line 4:** `import App from './App';` imports the primary root component exported via `export default` in `App.tsx`.
- **Line 5:** `import './index.css';` imports CSS purely for its side effects (loading styles into the document head via Vite).

### 7. Execution Flow
1. Vite dev server / browser evaluates `main.tsx`.
2. The browser discovers dependency specifiers (`react`, `react-dom/client`, `./App`).
3. Modules are loaded and resolved recursively into a dependency graph before execution begins.
4. Each imported file executes once, and its exported bindings are linked live into the importing scope.

### 8. Interview Questions
1. *What is the difference between named exports and default exports? When should you use which?*
2. *Why are ES6 imports called "static", and how does this enable Tree Shaking in bundlers like Vite?*
3. *What happens if two modules import each other in a circular dependency?*

### 9. Practical Exercise
Open any component (e.g., `client/src/components/ui/Card.tsx`). Convert the named export `export const Card` to a default export `export default Card`, update all importing files, and verify that the TypeScript build (`npm run build:client`) succeeds.

### 10. Prerequisites
Basic JavaScript syntax, variables, and understanding of file systems.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.0 hour

---

## Concept 2: Arrow Functions & Lexical `this`

### 1. Concept Name
Arrow Functions (`() => {}`)

### 2. Why It Exists
Traditional `function` declarations in JavaScript bind their own `this` context depending on *how* they are called (invocation context), leading to confusing bugs when passing methods as callbacks (e.g., event handlers or timeouts). Arrow functions provide concise syntax and **lexically inherit `this`** from their enclosing scope.

### 3. How It Works
- **C++/Java Analogy:** Similar to modern Java lambdas `() -> {}` or C++ lambdas `[&]() {}`.
- **No Own `this`:** Arrow functions do not create their own `this`, `arguments`, or `super` bindings.
- **Implicit Return:** If the body is a single expression without braces (`x => x * 2`), it automatically returns the result.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/common/Header.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/common/Header.tsx#L23-L34)
- **Component:** `Header` — helper function `getRoleBadgeClasses`.

### 5. Actual Code Example
```typescript
// client/src/components/common/Header.tsx
const getRoleBadgeClasses = (role?: string) => {
  switch (role) {
    case 'admin':
      return 'bg-forest-900 text-sand-100 border-forest-800';
    case 'host':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'guide':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    default:
      return 'bg-forest-100 text-forest-800 border-forest-200';
  }
};
```

### 6. Line-by-Line Explanation
- **Line 1:** `const getRoleBadgeClasses = (role?: string) => {` defines an arrow function taking an optional string parameter `role`.
- **Lines 2–11:** Evaluates the role string and directly returns the tailored Tailwind utility class string.

### 7. Execution Flow
1. The `Header` component executes during render.
2. `getRoleBadgeClasses` is declared in the local stack frame.
3. When rendering the user status pill, the function is invoked with `user?.role`.
4. It resolves synchronously, returning the appropriate styling string.

### 8. Interview Questions
1. *Can arrow functions be used as constructors with `new`? Why or why not?*
2. *How does `this` scoping differ between a standard `function()` and an arrow function?*
3. *Why are React functional components typically declared as arrow functions (`export const App: React.FC = () => {}`)?*

### 9. Practical Exercise
Write a pure arrow function `formatCurrency = (amount: number): string => ...` that formats a number into Indian Rupees (INR) using `Intl.NumberFormat('en-IN')`. Test it with values `2400` and `15000`.

### 10. Prerequisites
Variables, functions, and control flow (switch/if).  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.0 hour

---

## Concept 3: Object and Array Destructuring

### 1. Concept Name
Destructuring Assignment

### 2. Why It Exists
Extracting values from complex data objects or arrays previously required verbose, repetitive code (`const name = stay.name; const district = stay.district;`). Destructuring allows unpacking values from arrays or properties from objects directly into distinct variables using a clean, pattern-matching syntax.

### 3. How It Works
- **C++ Analogy:** Similar to C++17 Structured Bindings `auto [x, y] = point;`.
- **Object Destructuring:** Matches property names: `const { name, locality } = stay;`.
- **Array Destructuring:** Matches positional indices: `const [checkIn, setCheckIn] = useState('');`.
- **Renaming and Defaults:** You can alias variables (`const { id: stayId } = stay;`) or provide fallbacks (`const { totalBeds = 4 } = stay;`).

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/stays/StayCard.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/stays/StayCard.tsx#L36)
- **Component:** `StayCard` props unpacking.

### 5. Actual Code Example
```typescript
// client/src/components/stays/StayCard.tsx
export const StayCard: React.FC<StayCardProps> = ({ stay, onOpenExplainer, onBookStay }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isVerified = stay.verificationStatus === 'verified';
```

### 6. Line-by-Line Explanation
- **Line 1:** Instead of writing `(props: StayCardProps)` and then accessing `props.stay`, the function parameter list directly unpacks `{ stay, onOpenExplainer, onBookStay }`.
- **Line 2:** Destructures the array returned by `useState(false)` into `showDetails` (the current state value) and `setShowDetails` (the state updater function).

### 7. Execution Flow
1. Parent component passes `<StayCard stay={stayData} onOpenExplainer={openModal} />`.
2. React invokes `StayCard` with the props object.
3. JavaScript unpacks the properties immediately upon entering the function scope.

### 8. Interview Questions
1. *What happens if you destructure a property that does not exist on an object?*
2. *How do you set a default fallback value during object destructuring?*
3. *How does array destructuring work with React's `useState` hook?*

### 9. Practical Exercise
Refactor a component that uses `props.user.name` and `props.user.email` to unpack both properties in the function signature with a fallback `role = 'tourist'`.

### 10. Prerequisites
JavaScript objects and arrays.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.0 hour

---

## Concept 4: Rest and Spread Operators (`...`)

### 1. Concept Name
Spread Syntax (`...iterable`) and Rest Parameters (`...rest`)

### 2. Why It Exists
- **Spread:** Solves the problem of shallow-copying and merging objects/arrays immutably without mutating original references.
- **Rest:** Solves the problem of accepting an unknown number of function arguments or capturing "all remaining properties" into a single object.

### 3. How It Works
- **In Object Literals (Spread):** Copies enumerable properties from one object into another: `{ ...formData, amenities: updatedList }`.
- **In JSX Element Props (Spread):** Forwards unknown or standard HTML attributes directly to the underlying DOM node: `<button {...props}>`.
- **In Destructuring (Rest):** Collects leftover keys: `const { variant, size, className, children, ...props } = allProps;`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/ui/Button.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Button.tsx#L9-L15)
- **Component:** `Button` — forwarding standard button attributes (`disabled`, `type`, `onClick`).

### 5. Actual Code Example
```typescript
// client/src/components/ui/Button.tsx
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 6. Line-by-Line Explanation
- **Line 6:** `...props` uses the **Rest operator** to collect any HTML attributes passed by the caller (like `onClick`, `disabled`, `type="submit"`, `id`) into a single object `props`.
- **Line 11:** `{...props}` uses the **Spread operator** in JSX to apply all collected attributes onto the native `<button>` element.

### 7. Execution Flow
1. Caller writes `<Button type="submit" disabled={loading} variant="secondary">Save</Button>`.
2. `variant="secondary"` is extracted by name.
3. `type="submit"` and `disabled={loading}` are gathered into `props`.
4. In the JSX return, `{...props}` spreads those attributes directly onto the HTML DOM button.

### 8. Interview Questions
1. *Is the spread operator a deep clone or a shallow clone? What are the implications for nested objects?*
2. *Why is the spread operator critical for state management in React?*
3. *What is the difference between `...` in a function signature vs. `...` in an object literal?*

### 9. Practical Exercise
Look at [client/src/components/host/ListingFormModal.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/host/ListingFormModal.tsx#L86). Explain why updating amenities requires `setFormData({ ...formData, amenities: [...current, amenity] })` instead of `formData.amenities.push(amenity)`.

### 10. Prerequisites
Objects, arrays, and reference vs. value assignment in JavaScript.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours

---

## Concept 5: Optional Chaining (`?.`) and Nullish Coalescing (`??`)

### 1. Concept Name
Optional Chaining Operator (`?.`) and Nullish Coalescing Operator (`??`)

### 2. Why It Exists
Before optional chaining, accessing nested properties on potentially null or undefined data required defensive, noisy checks (`user && user.profile && user.profile.avatar`). If any link was missing, JavaScript threw `TypeError: Cannot read properties of undefined`.
Similarly, the logical OR operator (`||`) treated `0`, `""`, and `false` as falsy, leading to bugs when assigning default numerical values (e.g., `guestCount || 1` would overwrite a valid `0`).

### 3. How It Works
- **`?.` (Optional Chaining):** Short-circuits and returns `undefined` if the operand before `?.` is `null` or `undefined`, without throwing an exception.
- **`??` (Nullish Coalescing):** Returns the right-hand operand **only** if the left-hand operand is `null` or `undefined` (ignoring `0` or `false`).

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L84-L95)
- **Function:** `parseApiError` — extracting nested error details safely.

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
function parseApiError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const errorObj = (data as { error?: { message?: string; details?: Array<{ message?: string }> } }).error;
    if (errorObj?.details && Array.isArray(errorObj.details) && errorObj.details.length > 0) {
      const details = errorObj.details
        .map((d) => d?.message)
        .filter(Boolean)
        .join('. ');
      if (details) return details;
    }
    if (errorObj?.message) {
      return errorObj.message;
    }
  }
  return fallback;
}
```

### 6. Line-by-Line Explanation
- **Line 4:** `if (errorObj?.details ...)` safely checks whether `errorObj` exists before accessing `.details`. If `errorObj` is undefined, it evaluates to `undefined` without a runtime error.
- **Line 6:** `d?.message` safely reads `message` on each detail item in case an array entry is null.

### 7. Execution Flow
1. The server returns a 400 error with a JSON payload.
2. `parseApiError` receives the parsed JSON object.
3. The chain `errorObj?.details` safely navigates the response tree.
4. If present, it maps and joins error strings; otherwise, it falls back to the default message.

### 8. Interview Questions
1. *What is the difference between `const x = a || b;` and `const x = a ?? b;`?*
2. *What does `user?.getAddress?.()?.zip` do if `getAddress` is not a function?*
3. *Can optional chaining be used on array indices (e.g., `items?.[0]`)?*

### 9. Practical Exercise
Find three places in `client/src/pages/StaysPage.tsx` where optional chaining is used to read homestay properties safely.

### 10. Prerequisites
Boolean logic, truthy/falsy values, and object properties.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.0 hour

---

## Concept 6: Modern Array Methods (`map`, `filter`, `find`, `some`)

### 1. Concept Name
Functional Array Methods

### 2. Why It Exists
Traditional `for` loops require manual index tracking, condition bounds, and array mutation. Functional array methods treat data as immutable streams: they transform, filter, or query arrays declaratively without side effects.

### 3. How It Works
- **`.map()`:** Transforms every element in an array into a new value, producing an array of identical length (essential for rendering lists in React).
- **`.filter()`:** Tests each element against a predicate, producing a new array containing only elements that return `true`.
- **`.find()`:** Returns the **first** element that matches the predicate, or `undefined`.
- **`.some()`:** Returns `true` if **at least one** element satisfies the condition.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/StaysPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StaysPage.tsx#L61-L63)
- **Component:** `StaysPage` — deriving metrics from the loaded stays list.

### 5. Actual Code Example
```typescript
// client/src/pages/StaysPage.tsx
const verifiedCount = stays.filter((s) => s.verificationStatus === 'verified').length;
const pendingCount = stays.filter((s) => s.verificationStatus === 'verification_pending').length;
const leadCount = stays.filter((s) => s.verificationStatus === 'unverified_lead').length;
```

### 6. Line-by-Line Explanation
- **Line 1:** `stays.filter(...)` iterates over all stays in state, keeping only records where `verificationStatus === 'verified'`, and reads `.length` to display the verified homestays metric.

### 7. Execution Flow
1. `stays` array is updated via `setStays(data)`.
2. On re-render, `filter()` executes synchronously over the array.
3. Three integer counts are calculated and passed into UI metric counters.

### 8. Interview Questions
1. *Why should you never mutate the original array inside a `.map()` callback?*
2. *What is the time complexity of `.filter()` followed by `.map()`?*
3. *What is the difference between `.find()` and `.filter()` when searching for a unique ID?*

### 9. Practical Exercise
Given `const stays: AccommodationRecord[]`, write a single line using `.filter()` and `.reduce()` to calculate the average `pricePerNight` of all verified homestays.

### 10. Prerequisites
Arrays, callbacks, and arrow functions.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.0 hours

---

## Concept 7: Promises and `async` / `await`

### 1. Concept Name
Asynchronous Programming with Promises and `async`/`await`

### 2. Why It Exists
Network operations like HTTP requests take unpredictable amounts of time. JavaScript is single-threaded; blocking the execution thread while waiting for a server response freezes the entire browser UI. Promises represent a value that will be available in the future (pending, fulfilled, or rejected). `async`/`await` provides clean, sequential-looking syntax over Promises without callback nesting ("callback hell").

### 3. How It Works
- **C++/Java Analogy:** Similar to `std::future` in C++ or `CompletableFuture` in Java.
- **`async` keyword:** Automatically wraps the function's return value in a Promise.
- **`await` keyword:** Pauses execution of the `async` function until the Promise settles, unpacking the fulfilled value or throwing an error if rejected.

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L482-L489)
- **Function:** `getMyBookings` in `apiService`.

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
async getMyBookings(): Promise<BookingRecord[]> {
  const res = await fetch(`${API_BASE_URL}/bookings/my`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error?.message || 'Failed to fetch personal bookings');
  }
  const json = await res.json();
  return json.data;
}
```

### 6. Line-by-Line Explanation
- **Line 1:** Declares `getMyBookings` as an asynchronous function returning a Promise of `BookingRecord[]`.
- **Line 2:** `await fetch(...)` triggers the HTTP GET request and pauses function execution until HTTP response headers arrive.
- **Line 5:** If the HTTP status is not 2xx (`!res.ok`), it parses error details and throws an Error.
- **Line 9:** `await res.json()` reads the response body stream to completion and parses JSON.
- **Line 10:** Returns the data array, which resolves the outer Promise.

### 7. Execution Flow
1. UI component calls `apiService.getMyBookings()`.
2. Browser sends network packet.
3. Event loop continues processing user clicks and animations without freezing.
4. When the response arrives, the Promise resolves, and execution resumes right after `await`.

### 8. Interview Questions
1. *What happens under the hood when you use `await` inside an `async` function?*
2. *How do you handle errors in an `async`/`await` block?*
3. *Can you use `await` outside of an `async` function?*

### 9. Practical Exercise
Refactor a Promise `.then().catch()` chain into a clean `async`/`await` block with a `try/catch/finally` structure.

### 10. Prerequisites
Event loop, synchronous vs. asynchronous execution, callbacks.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.5 hours

---

## Concept 8: Concurrent Execution with `Promise.all`

### 1. Concept Name
Concurrent Promise Resolution (`Promise.all`)

### 2. Why It Exists
When a page needs data from multiple independent endpoints (e.g., destinations AND homestays on the Home Page), awaiting them sequentially doubles the total waiting time (`T_total = T_destinations + T_stays`). `Promise.all` kicks off both network requests **in parallel**, resolving when all promises settle (`T_total = max(T_destinations, T_stays)`).

### 3. How It Works
- Accepts an iterable of Promises.
- Returns a single Promise that resolves with an array of the results in the exact order requested.
- **Fail-Fast Behavior:** If any single promise rejects, the entire `Promise.all` immediately rejects with that error.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/HomePage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HomePage.tsx#L36-L40)
- **Component:** `HomePage` — loading destinations and stays simultaneously.

### 5. Actual Code Example
```typescript
// client/src/pages/HomePage.tsx
const [dests, stays] = await Promise.all([
  apiService.getDestinations(),
  apiService.getStays(),
]);
setDestinations(dests);
setFeaturedStays(stays.slice(0, 3));
```

### 6. Line-by-Line Explanation
- **Line 1:** `Promise.all([...])` executes `apiService.getDestinations()` and `apiService.getStays()` simultaneously over the network.
- **Line 1:** Array destructuring `[dests, stays]` unpacks the two resolved arrays into local variables as soon as both finish.
- **Lines 4–5:** Updates React state for both destinations and featured stays in one atomic batch.

### 7. Execution Flow
1. `loadData()` starts during component mount.
2. Two separate HTTP requests fire concurrently.
3. When both succeed, execution advances to the state setters.
4. React 18 batches both state updates into a single re-render.

### 8. Interview Questions
1. *What is the difference between `Promise.all` and `Promise.allSettled`?*
2. *If one request in `Promise.all` fails, what happens to the other running requests?*
3. *Why is `Promise.all` preferred over sequential `await` calls in React data loaders?*

### 9. Practical Exercise
Inspect [client/src/pages/MyBookingsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/MyBookingsPage.tsx#L37). Notice how `apiService.getTouristGuideBookings().catch(() => [])` is wrapped inside `Promise.all`. Explain why `.catch()` was added to that specific promise.

### 10. Prerequisites
Promises and array destructuring.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 1.5 hours

---

## Concept 9: The `FileReader` Web API & Base64 Data URLs

### 1. Concept Name
Client-Side File Reading & Encoding (`FileReader.readAsDataURL`)

### 2. Why It Exists
When users upload documents (e.g., land deeds, electricity bills, host authorizations), the browser cannot directly access their local file system for security reasons. The `FileReader` Web API provides a secure mechanism to asynchronously read the contents of files stored on the user's computer and convert them into Base64-encoded Data URLs for instant client-side preview or direct JSON transmission.

### 3. How It Works
- An `<input type="file">` change event emits a `FileList` object.
- A `new FileReader()` instance is created.
- Calling `reader.readAsDataURL(file)` reads the binary file chunks and encodes them into a string format: `data:<mime-type>;base64,<encoded-data>`.
- The `reader.onload` callback fires when conversion completes, exposing the result string on `reader.result`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/host/HostVerificationModal.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/host/HostVerificationModal.tsx#L134-L156)
- **Component:** `HostVerificationModal` — processing host verification documents.

### 5. Actual Code Example
```typescript
// client/src/components/host/HostVerificationModal.tsx
const reader = new FileReader();
reader.onload = () => {
  const dataUrl = reader.result as string;
  const newItem: UploadedFileItem = {
    id: `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    documentType: selectedDocType,
    dataUrl,
  };

  setPendingFiles((prev) => [...prev, newItem]);
  e.target.value = ''; // reset file input
};

reader.readAsDataURL(file);
```

### 6. Line-by-Line Explanation
- **Line 1:** Instantiates a new browser `FileReader`.
- **Line 2:** Attaches the `onload` event handler, which will execute asynchronously when the file is fully read into memory.
- **Line 3:** Casts `reader.result` to a string containing the Base64 Data URL.
- **Lines 4–11:** Creates an `UploadedFileItem` metadata object bundling the file's name, size, type, and Base64 content.
- **Line 13:** Functional state update appends the new document to `pendingFiles`.
- **Line 14:** Resets `e.target.value` to empty string so the user can re-upload the same file if needed.
- **Line 17:** Initiates the asynchronous reading process.

### 7. Execution Flow
1. Host selects a PDF or image in the file picker.
2. Size (< 5MB) and MIME type checks pass.
3. `FileReader` loads the binary stream into memory and encodes it as Base64.
4. `pendingFiles` state updates, rendering a document tag with a delete button in the UI.

### 8. Interview Questions
1. *What is a Base64 Data URL, and what is the typical file size overhead compared to binary data?*
2. *Why do you need to reset `e.target.value = ''` after handling a file upload in React?*
3. *What are the security considerations when accepting user files in the browser?*

### 9. Practical Exercise
Create a small React component with an `<input type="file" accept="image/*" />` that reads an image via `FileReader` and renders a live `<img>` preview using the generated `dataUrl`.

### 10. Prerequisites
DOM events, binary files, and asynchronous callbacks.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 10: The `URLSearchParams` Web API

### 1. Concept Name
URL Search Parameters Utility (`URLSearchParams`)

### 2. Why It Exists
Constructing and parsing URL query strings manually (e.g., `?destination=Munsiyari&district=Pithoragarh`) is error-prone due to special characters, spaces, and ampersands requiring percent-encoding (`encodeURIComponent`). `URLSearchParams` provides standard methods to get, set, append, and serialize query parameters cleanly.

### 3. How It Works
- `const params = new URLSearchParams();`
- `params.append('key', 'value');` automatically URL-encodes special characters (`" "` becomes `"+"` or `"%20"`).
- `params.toString()` returns the formatted query string without a leading `?`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L132-L136)
- **Function:** `getDestinations` filter string builder.

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
const params = new URLSearchParams();
if (filters?.search) params.append('search', filters.search);
if (filters?.district) params.append('district', filters.district);

const url = `${API_BASE_URL}/destinations?${params.toString()}`;
const res = await fetch(url);
```

### 6. Line-by-Line Explanation
- **Line 1:** Initializes an empty query parameter collection.
- **Lines 2–3:** Appends `search` and `district` query parameters only if they exist and are non-empty.
- **Line 5:** Serializes the parameters into a valid URL string (`/destinations?search=munsiyari&district=pithoragarh`).

### 7. Execution Flow
1. User types in a filter box.
2. `getDestinations({ search: 'alpine lodge' })` is invoked.
3. `URLSearchParams` formats `search=alpine+lodge`.
4. The fetch request sends a clean, standards-compliant URL.

### 8. Interview Questions
1. *How does `URLSearchParams` handle duplicate parameter keys?*
2. *How is `URLSearchParams` related to React Router's `useSearchParams` hook?*
3. *Why should you never concatenate user input into URLs using raw template literals?*

### 9. Practical Exercise
Inspect [client/src/pages/HomePage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HomePage.tsx#L54-L60). Trace how `handleHeroSearch` builds a query string and passes it to `navigate('/stays?' + params.toString())`.

### 10. Prerequisites
HTTP URLs, query strings, and basic string manipulation.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 1.5 hours
