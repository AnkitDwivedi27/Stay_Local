# Phase 3: React Fundamentals & Component Architecture in StayLocal

> **Scope:** Core React primitives, JSX syntax rules, stateful reactivity, component composition, and event systems in StayLocal.  
> **Target Mastery:** Level 1 (Essential)

---

## Concept 1: Function Components & JSX/TSX Syntax

### 1. Concept Name
Function Components and JSX (JavaScript XML)

### 2. Why It Exists
Before React, building dynamic web applications required manual imperative DOM manipulation (`document.createElement`, `element.appendChild`), which quickly produced fragile, out-of-sync user interfaces. Function components allow developers to write **declarative UI**: you describe what the UI should look like for a given state using an HTML-like syntax (JSX/TSX), and React handles DOM updates automatically.

### 3. How It Works
- A React function component is a plain JavaScript function that accepts a `props` object and returns JSX.
- **JSX Compilation:** Browsers do not understand JSX directly. During the Vite build step, JSX is transformed by Babel/Rollup into standard JavaScript function calls:
  ```jsx
  <div className="card">Hello</div>
  // Becomes:
  React.createElement('div', { className: 'card' }, 'Hello');
  ```
- **Rules of JSX:**
  1. Must return a single root element (or a `<React.Fragment>` / `<>...</>`).
  2. All tags must be explicitly closed (`<img />`, `<input />`).
  3. HTML attribute names follow camelCase (`className` instead of `class`, `htmlFor` instead of `for`).

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/destinations/DestinationCard.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/destinations/DestinationCard.tsx#L12-L28)
- **Component:** `DestinationCard`

### 5. Actual Code Example
```typescript
// client/src/components/destinations/DestinationCard.tsx
export const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  return (
    <Card hoverable className="flex flex-col h-full bg-white group border-sand-200">
      <div className="relative h-48 w-full overflow-hidden bg-sand-200">
        <img
          src={destination.images[0] || destination.imagePlaceholder}
          alt={`Scenic view of ${destination.name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 to-transparent" />
      </div>
      <div className="p-5 flex flex-col flex-grow justify-between">
        <h3 className="font-serif text-xl font-bold text-charcoal-900">
          {destination.name}
        </h3>
      </div>
    </Card>
  );
};
```

### 6. Line-by-Line Explanation
- **Line 1:** Declares `DestinationCard` as a function component receiving `destination`.
- **Line 3:** Returns JSX. Notice `<Card hoverable className="...">` — this is a custom React component, capitalized so React distinguishes it from native HTML elements like `<div>`.
- **Lines 6–10:** Renders an `<img>` tag with dynamic JavaScript expressions inside `{}` (`src={...}`), camelCase attributes, and self-closing syntax.

### 7. Execution Flow
1. Parent component (`DestinationsPage`) renders `<DestinationCard destination={d} />`.
2. React executes `DestinationCard(props)`.
3. The function returns a Virtual DOM node tree.
4. React reconciles this Virtual DOM representation with the real browser DOM.

### 8. Interview Questions
1. *What is the Virtual DOM, and how does React use it to optimize rendering?*
2. *Why must JSX tags always have a single parent element or Fragment?*
3. *What happens under the hood when a component function is called by React?*

### 9. Practical Exercise
Create a simple functional component `<AltitudeBadge altitude="2,200m" />` that renders an altitude tag with a mountain icon.

### 10. Prerequisites
Basic HTML and JavaScript functions.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours

---

## Concept 2: Props and Uni-Directional Data Flow

### 1. Concept Name
Props (Properties) & One-Way Data Binding

### 2. Why It Exists
In complex applications, two-way data binding (where children can silently mutate parent state) leads to chaotic cascading updates that are impossible to trace. React enforces **Uni-directional Data Flow**: data strictly flows downward from parent components to child components via read-only `props`.

### 3. How It Works
- Props are **immutable**: a child component must never modify its received `props` directly (`props.stay = newStay` will throw a runtime error in strict mode).
- To send data *upward*, parents pass **callback functions** as props down to the child (e.g., `<StayCard onBookStay={handleBook} />`). The child invokes the callback when an event occurs.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/stays/StayCard.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/stays/StayCard.tsx#L22-L26)
- **Component:** `StayCard`

### 5. Actual Code Example
```typescript
// client/src/components/stays/StayCard.tsx
interface StayCardProps {
  stay: AccommodationRecord;
  onOpenExplainer?: () => void;
  onBookStay?: (stay: AccommodationRecord) => void;
}

export const StayCard: React.FC<StayCardProps> = ({ stay, onOpenExplainer, onBookStay }) => {
  // stay is read-only data
  // onBookStay is an action callback passed from StaysPage
```

### 6. Line-by-Line Explanation
- **Line 2:** `stay: AccommodationRecord` is a downward data prop.
- **Lines 3–4:** `onOpenExplainer` and `onBookStay` are upward event callbacks. When the user clicks the "Book Homestay" button on the card, the card invokes `onBookStay?.(stay)`, alerting the parent `StaysPage` to open the booking modal for this specific homestay.

### 7. Execution Flow
1. `StaysPage` holds the state for `selectedStayForBooking`.
2. `StaysPage` renders `<StayCard stay={s} onBookStay={(stay) => setSelectedStayForBooking(stay)} />`.
3. User clicks "Book Stay" inside the card.
4. `StayCard` fires `onBookStay(stay)`.
5. `StaysPage` receives the callback and updates its local state, mounting the modal.

### 8. Interview Questions
1. *Why are props in React immutable?*
2. *How do you pass data from a child component to its parent in React?*
3. *What is "prop drilling", and what techniques does React provide to solve it?*

### 9. Practical Exercise
Trace the `onOpenExplainer` prop from [RootLayout.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/layouts/RootLayout.tsx#L12) into [Header.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/common/Header.tsx#L47), and explain how clicking the micro-bar button triggers the modal state in `RootLayout`.

### 10. Prerequisites
JavaScript function parameters and callbacks.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours

---

## Concept 3: Component Composition & the `children` Prop

### 1. Concept Name
Component Composition and Containment (`props.children`)

### 2. Why It Exists
Developers often create rigid components with hardcoded structures (e.g., `<CardWithTitleAndTwoButtons />`). When a new layout variation is needed, they are forced to add dozens of optional boolean props. Component composition solves this by allowing components to act as generic wrappers (containment) that project whatever arbitrary JSX the caller places between their opening and closing tags.

### 3. How It Works
- React reserves a special prop named `children`.
- Anything written between `<Component>...</Component>` is automatically populated on `props.children`.
- The container component simply renders `{children}` wherever appropriate in its JSX layout.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/ui/Card.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Card.tsx#L9-L23)
- **Component:** `Card`

### 5. Actual Code Example
```typescript
// client/src/components/ui/Card.tsx
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-sand-200/90 editorial-card overflow-hidden transition-all duration-300 ${
        hoverable ? 'hover:-translate-y-1 hover:border-sand-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
```

### 6. Line-by-Line Explanation
- **Line 2:** Destructures `children` from props.
- **Line 14:** `{children}` renders whatever contents the caller supplied inside the beautifully styled border and shadow wrapper.

### 7. Execution Flow
1. Caller writes `<Card><h2>Munsiyari Trail</h2><p>Altitude 2200m</p></Card>`.
2. React passes the `<h2>` and `<p>` elements into `Card` as `children`.
3. `Card` renders its outer `<div>` and embeds the elements inside.

### 8. Interview Questions
1. *What is the difference between inheritance and composition in React? Why does React favor composition?*
2. *What data types can `props.children` hold in React?*
3. *How do you inspect or iterate over `children` using `React.Children.map`?*

### 9. Practical Exercise
Look at [client/src/components/ui/Button.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Button.tsx). Explain why passing `<Button><Mountain className="w-4 h-4" /><span>Explore</span></Button>` works seamlessly because of `children`.

### 10. Prerequisites
Props and JSX nesting.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.0 hours

---

## Concept 4: State and Immutability (`useState`)

### 1. Concept Name
Component State & The Immutability Principle

### 2. Why It Exists
Props provide external data, but components need memory to track user interactions that change over time (e.g., whether a dropdown is open, what the user typed in an email input, or which tab is selected). State is private, local data held by a component that triggers a UI re-render whenever it updates.

### 3. How It Works
- `const [state, setState] = useState(initialValue);`
- **Re-render Trigger:** Calling `setState(newValue)` notifies React that state has changed. React re-executes the component function with the new state value and updates the DOM.
- **Immutability Rule:** Never mutate state directly (`state.name = 'New'` does NOT notify React and will not trigger a re-render). Always provide a new object or array reference (`setState({ ...state, name: 'New' })`).

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/LoginPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/LoginPage.tsx#L11-L14)
- **Component:** `LoginPage`

### 5. Actual Code Example
```typescript
// client/src/pages/LoginPage.tsx
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

### 6. Line-by-Line Explanation
- **Line 2:** `email` is initialized to an empty string `''`. `setEmail` is the dedicated setter function.
- **Line 4:** `loading` tracks whether an authentication network request is currently inflight to disable buttons and display spinners.
- **Line 5:** `errorMessage` stores error feedback, initialized to `null`.

### 7. Execution Flow
1. User types in the email input (`onChange`).
2. Input event calls `setEmail(e.target.value)`.
3. React queues a state update.
4. React re-renders `LoginPage`, passing the latest string into `email`.
5. The input value displays the typed character.

### 8. Interview Questions
1. *Is `useState` synchronous or asynchronous? Why can't you read the new state immediately after calling `setState`?*
2. *When should you use the functional updater form `setCount(prev => prev + 1)` instead of `setCount(count + 1)`?*
3. *What causes an infinite re-render loop in React when using `useState`?*

### 9. Practical Exercise
Find a component in `client/src/pages/HostListingsPage.tsx` that updates a list in state using a functional update (`setListings(prev => ...)`). Explain why `prev` is used.

### 10. Prerequisites
Variables, functions, and destructuring.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.5 hours

---

## Concept 5: Controlled Components Pattern

### 1. Concept Name
Controlled Components vs. Uncontrolled Components

### 2. Why It Exists
In traditional HTML, form inputs (`<input>`, `<select>`, `<textarea>`) manage their own internal state in the browser DOM. This creates two separate sources of truth: the DOM holds the current value, while React has to query the DOM to find out what was typed. Controlled components make React state the **single source of truth** for all form data.

### 3. How It Works
1. React state holds the input value (`value={email}`).
2. An `onChange` handler listens for user keystrokes.
3. The handler updates React state via `setEmail(e.target.value)`.
4. React re-renders, pushing the updated value back into the DOM input.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/ui/Input.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Input.tsx#L9-L42)
- **Component:** `Input`

### 5. Actual Code Example
```typescript
// client/src/components/ui/Input.tsx
export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full">
      <input
        id={inputId}
        className={`w-full rounded-xl border ... ${error ? 'border-red-400' : 'border-sand-300'}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
```

### 6. Line-by-Line Explanation
- **Line 8:** Spreading `{...props}` onto `<input />` passes `value` and `onChange` directly from the parent form.
- **Line 11:** If the parent passes an `error` string, the input border turns red and displays the validation message.

### 7. Execution Flow
1. Parent holds `const [search, setSearch] = useState('')`.
2. Parent renders `<Input value={search} onChange={(e) => setSearch(e.target.value)} />`.
3. User types `'B'`.
4. `onChange` triggers `setSearch('B')`.
5. Component re-renders with `value="B"`.

### 8. Interview Questions
1. *What is the difference between a controlled component and an uncontrolled component using `useRef`?*
2. *What warning does React throw if an input changes from `value={undefined}` to `value="text"`?*
3. *Why are controlled components preferred for instant client-side validation?*

### 9. Practical Exercise
Inspect [client/src/components/booking/BookingModal.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/booking/BookingModal.tsx#L61-L71). List the 7 separate state variables that control the booking form inputs.

### 10. Prerequisites
HTML forms, DOM events (`e.target.value`), and `useState`.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.0 hours

---

## Concept 6: List Rendering & The `key` Prop

### 1. Concept Name
Dynamic List Rendering and Reconciliation Keys

### 2. Why It Exists
When rendering a dynamic list of items (e.g., destinations, search results, or bookings), React needs a reliable way to identify which items have changed, been added, or been removed when data updates. Without unique keys, React re-renders every item or confuses component state between siblings.

### 3. How It Works
- JavaScript's `.map()` transforms an array of data objects into an array of JSX elements.
- The `key` prop must be a unique, stable identifier (such as a database ID `stay.id`).
- **Anti-Pattern:** Never use array index (`key={index}`) if the list can be filtered, reordered, or deleted, as it causes subtle rendering bugs.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/HomePage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HomePage.tsx#L160-L165)
- **Component:** `HomePage` — rendering featured homestay cards.

### 5. Actual Code Example
```typescript
// client/src/pages/HomePage.tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
  {featuredStays.map((stay) => (
    <StayCard
      key={stay.id}
      stay={stay}
      onBookStay={(s) => setSelectedStayForBooking(s)}
    />
  ))}
</div>
```

### 6. Line-by-Line Explanation
- **Line 2:** `featuredStays.map(...)` iterates over the stays array.
- **Line 4:** `key={stay.id}` assigns the persistent MongoDB ID (`stay-mun-01`) as the reconciliation key.

### 7. Execution Flow
1. `featuredStays` array changes (e.g., item 2 is removed).
2. React compares keys between the old Virtual DOM and new Virtual DOM.
3. React sees `stay-mun-02` is gone and removes that single DOM node without recreating the others.

### 8. Interview Questions
1. *Why should you never use `Math.random()` as a `key` prop?*
2. *What problems arise when using array indices as keys in dynamic or sortable lists?*
3. *Does the `key` prop get passed into the child component's `props`?*

### 9. Practical Exercise
Find the navigation links rendering in [client/src/components/common/Header.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/common/Header.tsx#L77-L97). Identify the property used as `key` and explain why it is stable.

### 10. Prerequisites
Array `.map()` and React function components.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours
