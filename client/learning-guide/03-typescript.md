# Phase 2: TypeScript & Static Type Safety in StayLocal

> **Scope:** TypeScript language features, React typing patterns, generic abstractions, and domain contracts in StayLocal.  
> **Target Mastery:** Level 1 (Essential) & Level 2 (Intermediate)

---

## Concept 1: Interfaces vs. Type Aliases

### 1. Concept Name
Interfaces and Type Aliases

### 2. Why It Exists
JavaScript is dynamically typed: typos in property names or unexpected `undefined` fields only fail at runtime, often in production. TypeScript provides compile-time contracts. `interface` and `type` allow developers to define the exact shape an object, record, or primitive union must adhere to before any code runs.

### 3. How It Works
- **C++/Java Analogy:** Similar to `struct` / `class` interfaces in C++ or `interface` in Java.
- **`interface`:** Ideal for defining object structures and extensible component props. Supports declaration merging and inheritance via `extends`.
- **`type` alias:** Can represent objects, but also primitives, tuples, intersections, and unions (`'admin' | 'host' | 'tourist'`). Cannot be declaration-merged.

### 4. StayLocal Implementation
- **File Reference:** [client/src/types/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/types/index.ts#L6-L37)
- **Role:** Foundational domain definitions for Uttarakhand homestays and users.

### 5. Actual Code Example
```typescript
// client/src/types/index.ts
export type VerificationStatus =
  | 'unverified_lead'
  | 'verification_pending'
  | 'verified'
  | 'rejected_or_inactive';

export interface ContactDetails {
  phone?: string;
  email?: string;
  contactPerson?: string;
  isPubliclyListed: boolean;
}
```

### 6. Line-by-Line Explanation
- **Lines 1–5:** Declares `VerificationStatus` as a **String Literal Union Type**. A variable of this type can only hold one of those four exact string values. Assigning `'pending'` or `'active'` will produce a compile-time error.
- **Lines 7–12:** Declares `ContactDetails` as an **Interface**. It specifies the properties expected on a contact object, including optional fields denoted by `?` and a mandatory boolean `isPubliclyListed`.

### 7. Execution Flow
1. Developer writes `stay.verificationStatus = 'approved'`.
2. TypeScript compiler checks `VerificationStatus` union definition.
3. Compilation halts with: `Type '"approved"' is not assignable to type 'VerificationStatus'`.
4. The bug is prevented prior to committing code or deploying to production.

### 8. Interview Questions
1. *When should you use `interface` versus `type` in modern TypeScript?*
2. *What is declaration merging in TypeScript interfaces?*
3. *Can a TypeScript `type` alias extend an `interface`, or vice versa?*

### 9. Practical Exercise
Inspect `client/src/types/index.ts`. Find `AccommodationRecord` and list three fields typed as custom interfaces and two fields typed as string literal union types.

### 10. Prerequisites
Objects, basic JavaScript types, and variable declarations.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.0 hours

---

## Concept 2: Component Props Typing (`React.FC<Props>`)

### 1. Concept Name
Typed React Functional Components (`React.FC<P>`)

### 2. Why It Exists
In plain React, nothing stops a developer from passing wrong props or omitting required ones (e.g., forgetting `stay` on `<StayCard />`), causing `undefined` errors during rendering. Typing components ensures parents provide the exact required props.

### 3. How It Works
- `React.FC<P>` (or `React.FunctionComponent<P>`) is a generic type provided by `@types/react`.
- It takes a type parameter `P` describing the props contract.
- It validates the component's return value is a valid JSX element (`ReactElement | null`).

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/ui/Card.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Card.tsx#L3-L9)
- **Component:** `Card`

### 5. Actual Code Example
```typescript
// client/src/components/ui/Card.tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

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
- **Lines 1–5:** Defines `CardProps`, declaring that `children` is required (`React.ReactNode`), while `className` and `hoverable` are optional flags.
- **Line 7:** `export const Card: React.FC<CardProps> = ...` binds the `CardProps` interface to the component.
- **Line 10:** Default values (`className = ''`, `hoverable = false`) ensure the variables are never undefined inside the function body.

### 7. Execution Flow
1. Developer writes `<Card hoverable={true}><h3>Sarmoli Stay</h3></Card>`.
2. TypeScript verifies `hoverable` is a boolean and `children` contains valid React nodes.
3. If someone passes `<Card hoverable="yes">`, TypeScript raises a type mismatch error immediately.

### 8. Interview Questions
1. *What does `React.ReactNode` represent, and how does it differ from `React.ReactElement`?*
2. *Why do some developers prefer `(props: CardProps) => JSX.Element` over `React.FC<CardProps>`?*
3. *How do default prop values interact with TypeScript's optional properties?*

### 9. Practical Exercise
Look at [client/src/components/ui/Badge.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Badge.tsx). Identify the two different prop interfaces defined and explain why `VerificationBadgeProps` requires `status: VerificationStatus`.

### 10. Prerequisites
Interfaces and React function components.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours

---

## Concept 3: Extending Native HTML Attributes

### 1. Concept Name
Polymorphic HTML Props Inheritance

### 2. Why It Exists
Custom design system components like `<Button>` or `<Input>` wrap standard HTML elements (`<button>`, `<input>`). Re-declaring every single standard HTML attribute (`onClick`, `onBlur`, `disabled`, `type`, `autoFocus`, `aria-label`) in a custom interface would take hundreds of lines of fragile boilerplate. Extending native HTML interfaces inherits all standard attributes automatically.

### 3. How It Works
- TypeScript's DOM library includes typed representations for all HTML tags: `React.ButtonHTMLAttributes<HTMLButtonElement>`, `React.InputHTMLAttributes<HTMLInputElement>`, etc.
- By using `interface CustomProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`, your component inherits all standard HTML button attributes while adding your own domain-specific props.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/ui/Button.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Button.tsx#L3-L7)
- **Component:** `Button`

### 5. Actual Code Example
```typescript
// client/src/components/ui/Button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sand';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

### 6. Line-by-Line Explanation
- **Line 1:** `extends React.ButtonHTMLAttributes<HTMLButtonElement>` gives `ButtonProps` every valid HTML `<button>` attribute (e.g., `disabled`, `type`, `form`, `tabIndex`, `onMouseEnter`).
- **Lines 2–3:** Adds our custom design system modifiers: `variant` and `size`.

### 7. Execution Flow
1. Developer writes `<Button type="submit" disabled={loading} variant="primary">Confirm</Button>`.
2. TypeScript checks `type="submit"` against `ButtonHTMLAttributes`, accepts it as valid.
3. TypeScript checks `variant="primary"` against our union, accepts it as valid.
4. Any illegal attribute (like `href="https://..."` on a button) is immediately flagged as a compiler error.

### 8. Interview Questions
1. *Why should custom UI components extend native React HTML attributes?*
2. *What is the difference between `HTMLButtonElement` and `React.ButtonHTMLAttributes`?*
3. *How do you override an inherited attribute with a narrower type?*

### 9. Practical Exercise
Inspect [client/src/components/ui/Input.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Input.tsx#L3). Notice how `InputProps extends React.InputHTMLAttributes<HTMLInputElement>`. Add a new optional prop `helperText?: string` to the interface and render it below the input field if provided.

### 10. Prerequisites
Interface inheritance (`extends`) and HTML attributes.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 4: Generics in Hooks and Functions

### 1. Concept Name
TypeScript Generics (`<T>`)

### 2. Why It Exists
In statically typed languages, writing a function that works across multiple data types usually forces you to choose between duplicating code or using an unsafe `any` type (which disables all type checking). Generics act as **type variables**: they allow functions, classes, and hooks to capture and preserve types dynamically.

### 3. How It Works
- **C++/Java Analogy:** Similar to C++ Templates `template <typename T>` or Java Generics `<T>`.
- Generics preserve the exact type relationship: if you pass a `string` into `useState<string>()`, the returned value is guaranteed to be a `string`, and the updater only accepts `string`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/DestinationDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/DestinationDetailPage.tsx#L21-L22)
- **Component:** `DestinationDetailPage` — typed URL parameter extraction and state initialization.

### 5. Actual Code Example
```typescript
// client/src/pages/DestinationDetailPage.tsx
export const DestinationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [destination, setDestination] = useState<DestinationRecord | null>(null);
```

### 6. Line-by-Line Explanation
- **Line 2:** `useParams<{ id: string }>()` passes a generic type argument to React Router's `useParams` hook. This informs TypeScript that `id` is a `string | undefined`, preventing typos like `const { destinationId } = useParams()`.
- **Line 3:** `useState<DestinationRecord | null>(null)` informs TypeScript that the `destination` state starts as `null` but will later store an object of shape `DestinationRecord`.

### 7. Execution Flow
1. React Router parses the current path `/destinations/munsiyari`.
2. `useParams` extracts `{ id: 'munsiyari' }`.
3. Because of `<{ id: string }>`, TypeScript allows `id.toLowerCase()` and autocomplete for string methods.
4. If a developer accidentally writes `destination.nonExistentField`, TypeScript catches it immediately.

### 8. Interview Questions
1. *What are Generic Constraints (`<T extends Record<string, unknown>>`), and when are they used?*
2. *Why is `useState<T>()` better than `useState()` without an explicit generic when the initial state is `null`?*
3. *How do generics work with asynchronous Promises (`Promise<T>`)?*

### 9. Practical Exercise
Look at [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L104). Notice that every API method specifies a return type of `Promise<T>` (e.g., `Promise<DestinationRecord[]>`). Write a generic helper function `wrapInArray<T>(item: T): T[]` and test it with a string, a number, and a `BookingRecord`.

### 10. Prerequisites
Functions, parameters, and basic TypeScript types.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.5 hours

---

## Concept 5: Union Types and Discriminated Unions

### 1. Concept Name
Union Types and Discriminated Unions (Tagged Unions)

### 2. Why It Exists
Real-world application state transitions through distinct, mutually exclusive modes (e.g., a booking is either `'pending'`, `'confirmed'`, `'rejected'`, or `'cancelled'`). Modeling these with separate booleans (`isPending`, `isConfirmed`, `isRejected`) causes impossible state bugs (e.g., `isPending === true && isConfirmed === true`). Union types enforce that a value can only be in one valid state at a time.

### 3. How It Works
- **Union Type (`A | B`):** Allows a value to be any one of several types.
- **Discriminated Union:** A collection of object types that share a common literal discriminator property (a "tag"). TypeScript automatically narrows the object type based on checking that single tag.

### 4. StayLocal Implementation
- **File Reference:** [client/src/types/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/types/index.ts#L6-L20) and [client/src/components/ui/Badge.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/ui/Badge.tsx#L45-L68)
- **Role:** Homestay verification lifecycle rendering.

### 5. Actual Code Example
```typescript
// client/src/components/ui/Badge.tsx
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'verified':
      return <span className="...">Verified Homestay</span>;
    case 'verification_pending':
      return <span className="...">Verification Pending</span>;
    case 'unverified_lead':
      return <span className="...">Research Lead</span>;
    case 'rejected_or_inactive':
      return <span className="...">Unlisted</span>;
    default:
      return null;
  }
};
```

### 6. Line-by-Line Explanation
- **Line 1:** Receives `status` typed strictly as `VerificationStatus`.
- **Lines 2–11:** In the `switch` statement, TypeScript inspects each case. If you handle all 4 cases, it proves exhaustiveness. If a developer later adds a 5th status to `VerificationStatus`, TypeScript flags this switch statement as needing an update.

### 7. Execution Flow
1. Component receives `status="verified"`.
2. The JavaScript engine executes the `case 'verified':` branch.
3. The verified emerald badge renders in the DOM.

### 8. Interview Questions
1. *What is a Discriminated Union in TypeScript, and what makes a property a valid "discriminant"?*
2. *How do you achieve compile-time exhaustiveness checking with the `never` type in a switch statement?*
3. *Why are string literal unions superior to TypeScript `enum`s in modern React codebases?*

### 9. Practical Exercise
Inspect [client/src/types/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/types/index.ts#L14-L20). Identify `AccommodationCategory`. Add a switch statement in a new helper component that maps each category to an appropriate Himalayan icon from `lucide-react`.

### 10. Prerequisites
Switch statements, string types, and control flow.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours

---

## Concept 6: Type Narrowing (`instanceof`, `typeof`, in-operator)

### 1. Concept Name
Control Flow Based Type Narrowing

### 2. Why It Exists
When catching errors in `try/catch` blocks or handling polymorphic inputs, the caught value is typed as `unknown` in modern TypeScript. TypeScript forbids calling methods on `unknown` (e.g., `err.message`) because the thrown value could be a string, a number, or an object. Type narrowing allows developers to prove to TypeScript what type a variable is before calling properties on it.

### 3. How It Works
- **`err instanceof Error`:** Checks the prototype chain to verify whether the object is an instance of JavaScript's built-in `Error` class.
- **`typeof val === 'string'`:** Checks primitive types at runtime.
- **`'property' in obj`:** Checks whether a specific key exists on an object.

### 4. StayLocal Implementation
- **File Reference:** [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L64-L80)
- **Function:** `isNetworkError`

### 5. Actual Code Example
```typescript
// client/src/services/api.ts
function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'NetworkError') {
    return true;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('econnrefused')
    );
  }
  return false;
}
```

### 6. Line-by-Line Explanation
- **Line 1:** The parameter `err` is typed safely as `unknown`.
- **Line 2:** `if (err instanceof TypeError)` narrows `err` to a `TypeError`.
- **Line 3:** `typeof err === 'object' && 'name' in err` verifies `err` is an object containing a `name` key.
- **Line 6:** `if (err instanceof Error)` proves `err` has a `.message` string property, permitting `err.message.toLowerCase()`.

### 7. Execution Flow
1. A network failure occurs in `fetch()`.
2. The browser throws a `TypeError: Failed to fetch`.
3. `isNetworkError` inspects the error using `instanceof`.
4. It safely reads `.message` without risking a crash, confirming it is an offline error.

### 8. Interview Questions
1. *Why did TypeScript change the default type of caught errors in `catch(err)` from `any` to `unknown`?*
2. *What is a User-Defined Type Guard (`arg is Type`), and how do you write one?*
3. *What is the difference between `typeof` in JavaScript versus `typeof` in TypeScript type space?*

### 9. Practical Exercise
Write a type guard function `function isAuthUser(user: unknown): user is AuthUser` that validates whether an arbitrary object contains an `id`, `email`, and `role`.

### 10. Prerequisites
Error handling (`try/catch`), prototype chain, and runtime type checking.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 1.5 hours
