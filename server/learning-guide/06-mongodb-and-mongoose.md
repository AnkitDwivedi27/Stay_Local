# Module 06: MongoDB & Mongoose Architecture

This module provides a comprehensive, production-grade guide to the database tier of the StayLocal platform. It explores how StayLocal interfaces with MongoDB Atlas using Mongoose (Object-Document Mapper), covering connection lifecycles, resilient retry loops, schema design, compound indexing, pre-save middleware hooks, `.lean()` execution mechanics, and multi-document transactions.

---

## Architecture Diagram: Database Connection & Document Lifecycle

```mermaid
flowchart TD
    subgraph ExpressApp ["Express Application Layer"]
        A["server.ts: bootstrap()"] --> B["connectDB(retries=2) in config/db.ts"]
    end

    subgraph MongooseLifecycle ["Mongoose Connection Manager"]
        B --> C{"Check MONGODB_URI"}
        C -- "Missing in Prod" --> D["Throw ConfigurationError"]
        C -- "Configured" --> E["mongoose.connect(uri, options)"]
        E -- "Failure" --> F{"Attempt <= 2?"}
        F -- "Yes" --> G["Sleep 1.5s & Retry"]
        G --> E
        F -- "No" --> H["Log Sanitized Error & Halt"]
        E -- "Success" --> I["readyState = 1 (connected)"]
        I --> J["Log Connected Database Name: staylocal"]
    end

    subgraph DocumentLayer ["Schema & Model Operations"]
        K["Client Request"] --> L["BookingModel / UserModel / StayModel"]
        L --> M{"Query Type"}
        M -- "Read-only (.lean())" --> N["Plain JavaScript Object (POJO)"]
        M -- "Mutation (.save())" --> O["Pre-save Middleware Hooks (Bcrypt)"]
        O --> P["Validation Pipeline"]
        P --> Q["BSON Serialization to MongoDB Atlas"]
        Q --> R["toJSON Transformation (Strips _id, __v)"]
    end

    I -.-> DocumentLayer
```

---

## Concept 1: Mongoose Connection Lifecycle, Ready States, and Exponential Backoff Retries

### 1. Concept Name
Mongoose Connection Lifecycle, Connection State Monitoring, and Backoff Retries.

### 2. Simple Definition
A database connection is an active, persistent network socket between your backend Node.js server and your database server (MongoDB Atlas). Rather than opening a new socket for every HTTP request, Mongoose maintains a shared **connection pool**. The connection lifecycle manages the establishment, verification, failure recovery, and graceful termination of this pool.

### 3. Real-World Analogy
Imagine a dedicated hotline between an emergency response dispatch room (Node.js) and a regional hospital (MongoDB). When the station powers on in the morning, dispatchers test the line. If the line is busy or crackling, they don't immediately abandon hope; they wait 1.5 seconds and redial up to two more times. While active, an indicator light on the console shows whether the line is green (ready), yellow (dialing), or red (dead).

### 4. Why Developers Need It
Database servers restart, experience network jitter, or undergo automated cluster failovers. If an application crashes on the very first transient network hiccup, uptime suffers dramatically. A resilient connection manager provides:
1. **Configurable timeout budgets** (`serverSelectionTimeoutMS`) so API threads do not hang indefinitely.
2. **Retry loops** to tolerate momentary network drops during container boots.
3. **Connection state inspection** (`readyState`) so readiness probes and health check endpoints can instantly report whether the database is healthy.
4. **Credential sanitization** to prevent connection strings containing passwords from leaking into monitoring logs.

### 5. How StayLocal Uses It
StayLocal encapsulates database connectivity in [server/src/config/db.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/config/db.ts). It enforces strict environment checks: in production, missing connection strings throw a fatal `ConfigurationError`, whereas local development gracefully falls back to read-only research mode. The connection manager attempts connection with 2 retries, a 1.5-second backoff delay, an 8000ms server selection timeout, and URI credential masking.

### 6. Actual File Location
- File: [server/src/config/db.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/config/db.ts)
- Functions: `connectDB()`, `isDatabaseConnected()`, `getDatabaseStatus()`, `sanitizeMongoUri()`, `getConnectedDatabaseName()`, `disconnectDB()`

### 7. Code Explanation
Here is the core connection loop from [server/src/config/db.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/config/db.ts#L47-L89):

```typescript
export async function connectDB(retries = 2): Promise<void> {
  const uri = env.MONGODB_URI?.trim();

  if (!uri) {
    if (env.NODE_ENV === 'production') {
      throw new ConfigurationError(
        'Missing required MONGODB_URI in production environment. A valid MongoDB Atlas connection string is required.'
      );
    }
    console.info('[Database] MONGODB_URI is not configured. Running in offline/read-only mode...');
    return;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.info(`[Database] Connecting to MongoDB Atlas (attempt ${attempt})...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        autoIndex: env.NODE_ENV !== 'production',
      });
      console.info('[Database] Successfully connected to MongoDB Atlas.');
      console.info(`[Database] Connected database: ${mongoose.connection.name}`);
      return;
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      const sanitizedMsg = sanitizeMongoUri(rawMsg);
      if (attempt <= retries) {
        console.warn(`[Database] Connection attempt ${attempt} failed (${sanitizedMsg}). Retrying in 1.5s...`);
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        console.error('[Database] Connection error to MongoDB Atlas:', sanitizedMsg);
        if (env.NODE_ENV === 'production') {
          throw new ConfigurationError('Failed to connect to MongoDB Atlas in production environment.');
        }
      }
    }
  }
}
```

- **Lines 48–61**: Validates `env.MONGODB_URI`. If missing in `production`, it halts immediately by throwing `ConfigurationError`.
- **Line 66–69**: `mongoose.connect()` establishes the socket pool.
  - `serverSelectionTimeoutMS: 8000`: Fails fast after 8 seconds instead of hanging for the default 30 seconds if Atlas is unreachable.
  - `autoIndex: env.NODE_ENV !== 'production'`: In development, Mongoose automatically generates indexes. In production, index generation is turned off on startup to avoid performance degradation on large collections.
- **Line 71**: Logs `mongoose.connection.name` (`staylocal`) to verify which database the server has connected to.
- **Line 74–75**: Error messages are piped through `sanitizeMongoUri()`, which replaces `mongodb+srv://user:password@cluster...` with `mongodb+srv://***:***@cluster...` before writing to `stdout`/`stderr`.
- **Line 78**: Uses `await new Promise((r) => setTimeout(r, 1500))` as an asynchronous non-blocking delay between retry attempts.

### 8. Execution Flow
1. During startup, `bootstrap()` in `server.ts` calls `await connectDB()`.
2. `connectDB` inspects `env.MONGODB_URI`.
3. Loop initiates at `attempt = 1`.
4. Mongoose attempts TCP handshake with MongoDB Atlas replica set.
5. If Atlas replies within 8000ms:
   - `mongoose.connection.readyState` transitions from `2` (`connecting`) to `1` (`connected`).
   - The loop logs the connected database name (`staylocal`) and returns immediately.
6. If the connection fails (e.g. IP whitelist delay or network timeout):
   - The error string is sanitized.
   - The loop sleeps for 1500ms without blocking the Node.js event loop.
   - Loop increments to `attempt = 2` and retries.
7. If all 3 attempts fail in production, a `ConfigurationError` is thrown, triggering `process.exit(1)`.

### 9. Common Mistakes
- **Hardcoding connection URIs**: Committing passwords and replica set URLs directly into repository files.
- **Leaking credentials in error logs**: When MongoDB driver connection errors occur, the unparsed error message often contains the full URI including the plain-text password. StayLocal prevents this with `sanitizeMongoUri()`.
- **Enabling `autoIndex: true` in high-scale production**: Auto-indexing causes Mongoose to issue `createIndex` commands across every collection upon startup. In high-traffic production databases, this causes index builds that lock or degrade replica sets.
- **Missing timeout configuration**: Using default timeouts (30s) causes server health checks (like Render or Kubernetes probes) to fail and kill containers prematurely.

### 10. Interview Questions & Answers
**Q1: What are the distinct connection states in Mongoose, and how do you monitor them in a health check endpoint?**
*Answer:* Mongoose tracks connection status via `mongoose.connection.readyState`, which is an integer:
- `0`: Disconnected
- `1`: Connected
- `2`: Connecting
- `3`: Disconnecting
In StayLocal ([server/src/config/db.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/config/db.ts#L31-L45)), `getDatabaseStatus()` evaluates `readyState`. If `1`, it returns `'connected'`; if `2`, it returns `'connecting'`; otherwise `'disconnected'`. The health endpoint (`/api/health`) reads this state to determine whether the service should return HTTP 200 or HTTP 503 Service Unavailable.

**Q2: Why should `autoIndex` be disabled in production when working with Mongoose?**
*Answer:* In development, having Mongoose automatically build indexes defined in schemas (`autoIndex: true`) is convenient. However, in production, every application instance that boots up would simultaneously send `createIndex` commands to MongoDB. For large collections, building indexes can consume significant memory and I/O, leading to replica lag or request timeouts. Production index migrations should be executed out-of-band via controlled database migration scripts.

### 11. Practical Exercise
Open your terminal and inspect `server/src/config/db.ts`. Trace `getConnectedDatabaseName()`. In Node REPL or a scratch script, verify that calling `sanitizeMongoUri("mongodb+srv://admin:MySecret123@cluster0.abc.mongodb.net/staylocal")` correctly yields `"mongodb+srv://***:***@cluster0.abc.mongodb.net/staylocal"`.

---

## Concept 2: Schemas, Subdocuments, Models, and the Mongoose Type System

### 1. Concept Name
Mongoose Schemas, Subdocument Schemas, Models, and Document Interfaces.

### 2. Simple Definition
MongoDB is fundamentally a schema-less document database, meaning it can store arbitrary JSON-like (BSON) structures in a collection. **Mongoose Schemas** impose an application-level contract on top of MongoDB, enforcing field types, required constraints, default values, validators, and transformation rules before data ever touches disk.

### 3. Real-World Analogy
Think of MongoDB as an open, empty binder of paper. You could technically slip in a napkin with scribbles or a formal legal brief. Mongoose acts as the strict compliance clerk who stamps every sheet of paper: if a form is missing the guest's name, has a negative number of nights, or uses an unrecognized status code, the clerk rejects it before it can be filed.

### 4. Why Developers Need It
Without schema enforcement at the application layer:
1. Inconsistent data types enter collections (e.g., string `"10"` vs integer `10`).
2. Typos in field names silently create orphaned attributes (`guestCnt` vs `guestCount`).
3. Sensitive fields (like internal Mongo `_id` and version key `__v`) leak into public API responses.
4. Developers lose TypeScript auto-completion and compile-time type safety when querying documents.

### 5. How StayLocal Uses It
StayLocal models core business entities using strongly-typed Mongoose schemas in [server/src/models/](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/):
- `BookingModel` ([booking.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/booking.model.ts)): Implements a nested `BookingPriceBreakdownSchema` subdocument with `{ _id: false }`, strict enum validation for booking status, and custom `toJSON` serialization.
- `StayModel` ([stay.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/stay.model.ts)): Models homestay amenities, rooms, bed capacity, host assignment details, and assignment audit history.
- `UserModel` ([user.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/user.model.ts)): Models roles (`tourist`, `host`, `admin`, `guide`), password hashes, and profile metadata.

### 6. Actual File Location
- File: [server/src/models/booking.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/booking.model.ts)
- Types: `BookingDoc`, `BookingDocument`, `BookingModelType`
- Schemas: `BookingPriceBreakdownSchema`, `BookingSchema`

### 7. Code Explanation
Here is the schema structure from [server/src/models/booking.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/booking.model.ts#L26-L55):

```typescript
const BookingPriceBreakdownSchema = new Schema(
  {
    nights: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    baseAmount: { type: Number, required: true, min: 0 },
    communityFee: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
  },
  { _id: false }
);

const BookingSchema = new Schema<BookingDoc, BookingModelType>(
  {
    id: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    // ...
    pricing: {
      type: BookingPriceBreakdownSchema,
      required: true,
    },
    status: {
      type: String,
      required: [true, 'Booking status is required'],
      enum: {
        values: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'] as BookingStatus[],
        message: 'Invalid booking status',
      },
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const record = ret as Record<string, unknown>;
        delete record._id;
        delete record.__v;
        // Transform Dates to ISO strings
        return record;
      },
    },
  }
);
```

- **Line 36 (`{ _id: false }`)**: Prevents Mongoose from auto-generating an unnecessary `_id` ObjectId for embedded subdocuments. A price breakdown has no independent lifecycle outside of its parent booking document.
- **Line 39**: Generics `<BookingDoc, BookingModelType>` tie TypeScript compile-time types directly to Mongoose runtime schema validation.
- **Line 44 & 51 (`unique: true, trim: true`)**: Strips accidental leading/trailing whitespace and sets unique database constraints on `id` and `bookingReference`.
- **Line 146–150 (`enum`)**: Enforces state validation. Inserting `"in_progress"` or `"refunded"` triggers an immediate Mongoose validation error.
- **Line 174 (`timestamps: true`)**: Automatically injects and manages `createdAt` and `updatedAt` Date properties on document write operations.
- **Line 175–202 (`toJSON.transform`)**: Strips MongoDB implementation details (`_id`, `__v`) when documents are serialized to JSON for API consumers, formatting ISO string timestamps cleanly.

### 8. Execution Flow
1. An incoming booking request is received by Express.
2. The controller instantiates a document via `new BookingModel(bookingData)` or calls `BookingModel.create(bookingData)`.
3. Mongoose executes the validation phase:
   - Evaluates subdocument rules inside `BookingPriceBreakdownSchema`.
   - Checks constraints (`min: 1`, `required`, regex, enums).
   - If invalid, throws `mongoose.Error.ValidationError` before sending BSON to the network.
4. Mongoose assigns `createdAt` and `updatedAt` timestamps.
5. The document is converted to BSON and transmitted via the connection pool to MongoDB Atlas.
6. When `res.json(booking)` is called, the `toJSON.transform` hook executes, stripping `_id` and `__v`.

### 9. Common Mistakes
- **Confusing MongoDB `_id` with custom UUID `id`**: MongoDB automatically assigns an `ObjectId` to `_id`. StayLocal uses string business identifiers (e.g., `"stay-mun-01"` or `"bk-173000-xyz"`). Failing to specify `{ _id: false }` on subdocuments causes MongoDB to scatter random ObjectIds across child arrays.
- **Relying solely on `unique: true` for duplicate prevention**: `unique: true` is not a validator; it instructs Mongoose to build a unique index in the background. If the index fails to build, duplicate records can still be inserted.
- **Mutating objects directly after query without `.markModified()`**: If you modify mixed or loosely-typed fields in a Mongoose document, Mongoose change tracking may not realize the field changed unless you call `doc.markModified('fieldName')`.

### 10. Interview Questions & Answers
**Q1: What is the difference between an embedded subdocument schema and a Mongoose reference (`ref`) with `populate()`?**
*Answer:* An embedded subdocument (like `pricing: BookingPriceBreakdownSchema` in `BookingModel`) is stored directly inside the parent BSON document. It requires zero network joins, provides atomic updates with the parent document, and has lower read latency. A reference (`ref`) stores only the ObjectId/ID of another document in a separate collection. Querying it requires `populate()`, which executes an additional query under the hood. StayLocal uses embedded structures for tightly-coupled data (like pricing breakdowns and assignment audit logs) to maximize read performance and maintain atomicity.

**Q2: What is the purpose of the `toJSON.transform` option in a Mongoose schema?**
*Answer:* When an Express route passes a Mongoose document to `res.json(doc)`, JavaScript automatically invokes `JSON.stringify(doc)`, which in turn calls `doc.toJSON()`. The `transform` function allows developers to intercept the serialized dictionary. In StayLocal, this hook deletes internal database fields (`_id`, `__v`) and normalizes Date instances into ISO 8601 strings, ensuring a clean, contract-compliant API response that doesn't expose underlying database implementation quirks.

### 11. Practical Exercise
Inspect `server/src/models/stay.model.ts`. Locate `AssignmentHistorySchema`. Notice how `{ _id: false }` is configured on the subdocument schema so each historical entry does not receive an unwanted `_id`.

---

## Concept 3: Pre-Save Document Middleware Hooks and Model Methods

### 1. Concept Name
Mongoose Document Middleware (`pre('save')`) and Schema Instance Methods.

### 2. Simple Definition
**Document Middleware** (often called pre- or post-hooks) are functions executed automatically by Mongoose at specific stages of a document's lifecycle, such as before saving (`pre('save')`), before validating (`pre('validate')`), or before removing. Schema methods are custom functions attached directly to document instances.

### 3. Real-World Analogy
Consider an international passport application office. When you hand your completed form to the agent, before the form is officially stamped and locked in the vault (`save`), an automated scanner automatically encrypts your biometric data (`pre-save hook`). You never have to manually remind the clerk to encrypt it—the system guarantees it happens on every submission.

### 4. Why Developers Need It
Security logic like password hashing must be completely airtight. If password hashing was manually written in the controller, any developer who created a new user registration route, seed script, or password reset API might forget to call `bcrypt.hash()`, accidentally saving plain text passwords to the database. Encapsulating hashing inside a `pre('save')` hook guarantees that plain text passwords can *never* enter the database, regardless of which controller or script initiates the write.

### 5. How StayLocal Uses It
StayLocal attaches a `pre('save')` hook to `UserSchema` in [server/src/models/user.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/user.model.ts). It checks `this.isModified('password')`. If true, it hashes the password with 10 salt rounds before persisting. Additionally, it attaches an instance method `comparePassword()` to verify incoming login credentials safely.

### 6. Actual File Location
- File: [server/src/models/user.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/user.model.ts)
- Hooks: `UserSchema.pre<UserDocument>('save', ...)`
- Methods: `UserSchema.methods.comparePassword`

### 7. Code Explanation
Here is the implementation from [server/src/models/user.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/user.model.ts#L86-L109):

```typescript
// Pre-save hook: Hash password if modified
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
```

- **Line 87 (`UserSchema.pre<UserDocument>('save', ...)`)**: Registers a pre-save hook. Notice the standard `function` keyword is used instead of an arrow function so that `this` correctly binds to the target `UserDocument`.
- **Line 88 (`this.isModified('password')`)**: Essential performance and safety guard. If an admin updates a user's `email` or `role`, `isModified('password')` returns `false`, preventing the already-hashed password from being double-hashed into gibberish.
- **Line 92 (`bcrypt.genSalt(10)`)**: Generates a cryptographic salt with 10 rounds of computational complexity.
- **Line 93 (`bcrypt.hash(...)`)**: Replaces the plain-text password on the document with the resulting bcrypt hash string.
- **Line 107–109 (`comparePassword`)**: Attaches an instance method callable on any hydrated user document (`await user.comparePassword(candidate)`).

### 8. Execution Flow
1. A controller creates a user: `const user = new UserModel({ email, password: 'plainPassword123' })`.
2. The controller calls `await user.save()`.
3. Mongoose triggers the `pre('save')` pipeline:
   - Evaluates `this.isModified('password')`. Since the document is new, this is `true`.
   - Generates salt and hashes the plain text string asynchronously.
   - Overwrites `user.password` with `$2b$10$...`.
   - Calls `next()`.
4. Mongoose sends the document with the hash to MongoDB Atlas.
5. In the future, when the user updates their profile name and calls `user.save()`, `this.isModified('password')` evaluates to `false`, immediately calling `next()` and skipping bcrypt.

### 9. Common Mistakes
- **Using arrow functions for Mongoose hooks**: Arrow functions (`() => {}`) inherit `this` from the lexical outer scope rather than binding `this` to the Mongoose document. Writing `UserSchema.pre('save', async () => { this.password ... })` causes `this` to be `undefined`.
- **Forgetting `isModified()`**: Without `if (!this.isModified('password')) return next();`, every time a user profile update is saved, the already-hashed password is treated as plain text and hashed again, permanently locking the user out of their account.
- **Expecting hooks to run on `updateMany()` or `findOneAndUpdate()`**: Mongoose query middleware is separate from document middleware. Calling `UserModel.updateMany()` bypasses `pre('save')` hooks entirely! Password updates must either load the document and call `.save()`, or handle hashing explicitly.

### 10. Interview Questions & Answers
**Q1: Why does `UserSchema.pre('save')` not run when using `UserModel.findByIdAndUpdate()` or `updateMany()`?**
*Answer:* `pre('save')` is a **document middleware hook**; it requires a fully hydrated Mongoose document instance in Node.js memory. Methods like `findByIdAndUpdate()` and `updateMany()` are **query-level operations** that compile directly into raw MongoDB database commands sent over the wire without instantiating document instances. To run logic during direct updates, developers must either define `pre('findOneAndUpdate')` query hooks or query the document first with `findById()`, apply modifications, and execute `.save()`.

**Q2: What is the risk of using an arrow function when registering a Mongoose pre-save hook?**
*Answer:* In JavaScript, arrow functions capture the `this` value of the enclosing lexical execution context. Mongoose relies on dynamic `this` binding to inject the document being saved into the hook function scope. If an arrow function is passed, `this` will refer to the module exports or global object rather than the document instance, causing runtime `TypeError: Cannot read property 'isModified' of undefined`.

### 11. Practical Exercise
Check [server/src/models/user.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/user.model.ts#L86-L109). Look at lines 86–109. Verify how `next()` is called on success, and how errors are forwarded into `next(err)` to halt saving.

---

## Concept 4: Database Indexing: Single-Field, Unique, Sparse, and Compound Indexes

### 1. Concept Name
Database Indexing Strategy (Single-Field, Unique, and Compound Indexes).

### 2. Simple Definition
An **index** in MongoDB is a specialized, sorted data structure (typically a B-tree) that stores a small portion of the collection's data in an easy-to-traverse form. Without indexes, MongoDB must perform a **collection scan** (`COLLSCAN`), inspecting every single document in a collection one-by-one to find matching records.

### 3. Real-World Analogy
Imagine a 1,000-page encyclopedia. If there is no index at the back, finding every article mentioning "Manali" requires reading all 1,000 pages from start to finish. An index at the back of the book lists "Manali -> pages 42, 115, 890", allowing the reader to flip directly to the correct pages in fractions of a second.

### 4. Why Developers Need It
As databases grow from 10 records to 500,000 records:
1. Unindexed queries cause CPU usage on MongoDB Atlas to spike to 100%.
2. API response times degrade from 15ms to several seconds.
3. Availability queries (checking whether rooms are booked during date ranges) can freeze the database if they perform full collection scans on every tourist search.
4. Compound indexes optimize queries that filter on multiple criteria simultaneously (e.g. `stayId + checkIn + checkOut`).

### 5. How StayLocal Uses It
StayLocal defines indexing strategies across all its collections:
- `BookingModel` ([booking.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/booking.model.ts#L206-L211)):
  - Unique single indexes: `id` (hash lookup) and `bookingReference` (lookup by guest confirmation code).
  - Single indexes: `touristId`, `hostId`, `stayId`, `checkIn`, `checkOut`, `status`, `expiresAt`.
  - **Compound indexes**:
    - `{ stayId: 1, status: 1 }`: Instantly filters bookings for a specific stay that are `'confirmed'` or `'pending'`.
    - `{ stayId: 1, checkIn: 1, checkOut: 1 }`: Empowers the booking engine's availability calculation to find date overlaps without scanning other homestays.
    - `{ touristId: 1, createdAt: -1 }`: Optimizes the "My Bookings" tourist dashboard to display newest bookings first.
    - `{ hostId: 1, status: 1 }`: Optimizes the host dashboard booking view.

### 6. Actual File Location
- File: [server/src/models/booking.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/booking.model.ts)
- Lines: 206–211

### 7. Code Explanation
Here are the compound indexes defined in [server/src/models/booking.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/booking.model.ts#L206-L211):

```typescript
// Compound indexes for fast overlap and role lookups
BookingSchema.index({ stayId: 1, status: 1 });
BookingSchema.index({ stayId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ touristId: 1, createdAt: -1 });
BookingSchema.index({ hostId: 1, status: 1 });
```

- **Line 207 (`{ stayId: 1, status: 1 }`)**: A 2-key compound index. When calculating remaining bed inventory, StayLocal only cares about bookings where `status IN ['confirmed', 'pending']` for a specific `stayId`. MongoDB uses this index to jump directly to the stay and scan only active statuses, ignoring cancelled and rejected bookings entirely.
- **Line 208 (`{ stayId: 1, checkIn: 1, checkOut: 1 }`)**: Powers the date-overlap timeline algorithm. The index is sorted by `stayId` ascending, then `checkIn` ascending, then `checkOut` ascending.
- **Line 209 (`{ touristId: 1, createdAt: -1 }`)**: Compound index with descending order (`-1`) on `createdAt`. When a tourist opens their dashboard, the query `find({ touristId }).sort({ createdAt: -1 })` can read the B-tree directly in order, avoiding an expensive in-memory sort (`SORT` stage in MongoDB explain plans).

### 8. Execution Flow
1. An incoming request queries: `BookingModel.find({ stayId: 'stay-mun-01', status: 'confirmed' })`.
2. MongoDB's query planner evaluates available indexes.
3. The planner selects the compound index `{ stayId: 1, status: 1 }`.
4. MongoDB performs an **index scan** (`IXSCAN`) directly on the B-tree keys for `'stay-mun-01'` and `'confirmed'`.
5. Only the specific matching document pointers are fetched from disk/RAM (**FETCH** stage).
6. Total documents examined equals total documents returned (Execution ratio: 1:1, optimal performance).

### 9. Common Mistakes
- **Index Prefix Rule Ignorance**: In a compound index `{ stayId: 1, status: 1 }`, queries on `stayId` alone CAN use the index (because `stayId` is the prefix), but queries filtering on `status` alone CANNOT use the index efficiently.
- **Over-indexing**: Every index requires RAM and slows down write operations (`insert`, `update`, `delete`) because every index B-tree must be updated on disk whenever a document is written.
- **Missing index on sort keys**: Querying `find({ touristId }).sort({ createdAt: -1 })` without an index on `createdAt` causes MongoDB to load all records into RAM and sort them in memory. If the data exceeds 32MB, MongoDB aborts the query with an error.

### 10. Interview Questions & Answers
**Q1: What is the "Equality, Sort, Range" (ESR) rule when designing MongoDB compound indexes?**
*Answer:* The ESR rule is a proven architectural guideline for ordering keys in a compound index:
1. **Equality (`E`)**: Put fields queried with exact matches first (e.g., `stayId: 'stay-mun-01'`).
2. **Sort (`S`)**: Put fields used for sorting next (e.g., `createdAt: -1`), allowing the query to return sorted results without in-memory sorting.
3. **Range (`R`)**: Put fields queried with range operators (`$gte`, `$lte`, `$in`) last (e.g., `checkIn: { $lt: targetDate }`).
Following the ESR rule minimizes the number of index keys scanned during execution.

**Q2: What is the difference between `COLLSCAN` and `IXSCAN` in MongoDB query execution plans?**
*Answer:* In MongoDB's `explain("executionStats")` plan:
- `COLLSCAN` (Collection Scan): The database engine inspects every document in the collection sequentially. This has $O(N)$ time complexity and causes high CPU and disk I/O.
- `IXSCAN` (Index Scan): The database traverses a B-tree structure to find pointers to matching documents. This has $O(\log N)$ time complexity and fetches only relevant documents, providing predictable sub-millisecond query performance.

### 11. Practical Exercise
Examine [server/src/models/stay.model.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/models/stay.model.ts). Search for `.index(`. Notice how indexes are created on `id`, `slug`, `hostId`, `destinationId`, and `status` to optimize search and filter queries across the Himalayan region.

---

## Concept 5: High-Performance Queries with `.lean()` vs. Hydrated Documents

### 1. Concept Name
High-Performance Queries with `.lean()` vs. Hydrated Mongoose Documents.

### 2. Simple Definition
When Mongoose queries MongoDB, by default it converts every raw BSON document into a **hydrated Mongoose document**. A hydrated document is a complex JavaScript object packed with internal state, change tracking, getters, setters, virtuals, and methods (`.save()`, `.validate()`). Appending **`.lean()`** tells Mongoose to skip hydration and return high-speed, plain JavaScript objects (POJOs).

### 3. Real-World Analogy
Imagine ordering a piece of furniture online.
- A **hydrated document** is like receiving the furniture with an entire assembly team, repair technicians, warranty inspectors, and an instruction manual standing by inside your living room (`.save()`, change-tracking, validation).
- A **lean document** (`.lean()`) is simply having the furniture delivered and set down. If you just want to sit on the chair and look at it (read-only API response), having the full technician crew in your room is unnecessary overhead.

### 4. Why Developers Need It
1. **Memory Footprint**: Hydrated Mongoose documents consume up to 5x–10x more RAM than raw JavaScript objects because of internal property descriptors and tracking metadata.
2. **CPU & Latency**: Hydrating 500 documents from a collection can add 20–80 milliseconds of CPU parsing time in Node.js.
3. **Throughput**: For read-only endpoints (e.g., listing homestays or rendering search results), `.lean()` dramatically increases request-per-second throughput and reduces garbage collection pressure.

### 5. How StayLocal Uses It
StayLocal uses `.lean()` extensively in read-heavy queries, such as homestay catalog retrieval and availability calculation in [server/src/controllers/stays.controller.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/stays.controller.ts) and [server/src/services/availability.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/availability.service.ts).

### 6. Actual File Location
- File: [server/src/controllers/stays.controller.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/stays.controller.ts)
- Line: 28–36

### 7. Code Explanation
Here is how StayLocal queries homestays in [server/src/controllers/stays.controller.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/stays.controller.ts#L28-L36):

```typescript
const stays = await StayModel.find(query)
  .sort({ featured: -1, createdAt: -1 })
  .lean();
```

- **`StayModel.find(query)`**: Compiles the MongoDB query filter (e.g. filtering by destination or eco-credentials).
- **`.sort(...)`**: Instructs MongoDB Atlas to sort documents on the database engine.
- **`.lean()`**: Tells Mongoose: "Do not instantiate Mongoose Document instances. Return plain JSON-compatible objects directly from the MongoDB driver stream."

### 8. Execution Flow
```mermaid
sequenceDiagram
    participant API as Controller / Route
    participant Mongoose as Mongoose Query
    participant Driver as MongoDB Wire Protocol

    alt Standard Query (Without .lean())
        API->>Mongoose: StayModel.find()
        Mongoose->>Driver: OP_QUERY / find Command
        Driver-->>Mongoose: Raw BSON Documents
        Mongoose->>Mongoose: Hydration Loop (Attach internal properties, setters, prototype)
        Mongoose-->>API: Array of Hydrated Mongoose Documents (Heavy RAM)
    else Lean Query (With .lean())
        API->>Mongoose: StayModel.find().lean()
        Mongoose->>Driver: OP_QUERY / find Command
        Driver-->>Mongoose: Raw BSON Documents
        Mongoose->>Mongoose: BSON to POJO Deserialization Only
        Mongoose-->>API: Array of Plain JavaScript Objects (Fast, Low RAM)
    end
```

### 9. Common Mistakes
- **Calling `.save()` on a lean document**: Writing `const user = await UserModel.findById(id).lean(); user.name = 'New'; await user.save();` crashes at runtime with `TypeError: user.save is not a function`. Plain objects have no `.save()` method!
- **Expecting Mongoose virtuals or getters to run**: Lean documents bypass schema getters and virtual properties unless explicit plugins or options (`lean({ virtuals: true })`) are configured.
- **Expecting `pre('save')` hooks to trigger**: Since you cannot call `.save()` on a lean document, document hooks will never execute.

### 10. Interview Questions & Answers
**Q1: Under what circumstances should you NOT use `.lean()` in Mongoose?**
*Answer:* You should avoid `.lean()` when:
1. You plan to mutate the document and persist changes via `document.save()`.
2. Your business logic relies on custom schema instance methods (e.g. `await user.comparePassword(pass)`).
3. You need Mongoose schema virtuals or lifecycle hooks (`pre('save')`, `post('save')`) to execute.
For all read-only API queries where data is directly serialized to JSON and sent to the client, `.lean()` should be preferred.

**Q2: How does `.lean()` improve Node.js Garbage Collection (GC) performance under heavy load?**
*Answer:* When handling thousands of concurrent requests, instantiating thousands of complex Mongoose document objects creates significant heap allocations with deep prototype chains. The V8 garbage collector must traverse and clean up these complex object structures, causing "Stop-the-World" GC pauses that increase API p99 latency. Returning plain JavaScript objects with `.lean()` creates shallow, lightweight memory allocations that the V8 Scavenger garbage collector can reclaim almost instantaneously.

### 11. Practical Exercise
Inspect [server/src/services/admin-assignment.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/admin-assignment.service.ts). Notice how update operations use `StayModel.findOneAndUpdate()` with `{ new: true }` and `.lean()` to immediately return a clean, updated plain object without hydration overhead.

---

## Concept 6: Client Sessions, Transactions, and Atomic Rollbacks

### 1. Concept Name
MongoDB Client Sessions, Multi-Document ACID Transactions, and Error Rollbacks.

### 2. Simple Definition
A **transaction** is a sequence of database operations executed as a single, atomic unit of work. Under ACID guarantees, either **all** operations succeed and are permanently committed to the database, or if any assertion or error occurs, **all** modifications are completely aborted (rolled back), leaving the database in its exact original state.

### 3. Real-World Analogy
Imagine transferring ₹5,000 from your bank account to a Himalayan homestay host. Two things must happen:
1. Deduct ₹5,000 from your account.
2. Add ₹5,000 to the host's account.
If the system crashes after step 1 but before step 2, money would vanish into thin air. A transaction ensures that if step 2 fails, step 1 is automatically reversed as if it never happened.

### 4. Why Developers Need It
In complex backend operations—such as resetting host assignments, confirming multi-room bookings, or processing payments:
1. An update might touch multiple documents or collections.
2. A server crash or validation failure halfway through leaves the database in a corrupted, half-updated state.
3. Transactions provide atomicity across replica sets in MongoDB Atlas.

### 5. How StayLocal Uses It
In production data maintenance tasks—such as the safe host assignment cleanup script ([server/src/scripts/reset-host-assignments.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/scripts/reset-host-assignments.ts))—StayLocal executes sensitive database operations inside a MongoDB transaction session (`client.startSession()`). It verifies pre-conditions, executes updates, validates post-conditions inside the transaction, and only calls `session.commitTransaction()` if every assertion succeeds. If any check fails, `session.abortTransaction()` reverses all changes.

### 6. Actual File Location
- File: [server/src/scripts/reset-host-assignments.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/scripts/reset-host-assignments.ts)
- Methods: `mongoose.startSession()`, `session.startTransaction()`, `session.commitTransaction()`, `session.abortTransaction()`, `session.endSession()`

### 7. Code Explanation
Here is the transaction workflow pattern utilized in StayLocal's production safety scripts:

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Step 1: Perform targeted update within the transaction session
  const updateResult = await StayModel.updateMany(
    {
      $and: [
        { id: { $in: APPROVED_IDS } },
        targetedSelector
      ]
    },
    updatePayload,
    { session } // Note: Session passed explicitly
  );

  // Step 2: Validate update counts
  if (updateResult.matchedCount !== 3 || updateResult.modifiedCount !== 3) {
    throw new Error('Update count mismatch inside transaction.');
  }

  // Step 3: Verify post-conditions inside transaction
  const updatedDocs = await StayModel.find({ id: { $in: APPROVED_IDS } }, null, { session });
  for (const doc of updatedDocs) {
    if (doc.hostId || doc.assignmentStatus !== 'unassigned') {
      throw new Error('Post-condition assertion failed.');
    }
  }

  // Step 4: Commit transaction permanently
  await session.commitTransaction();
  console.info('Transaction committed successfully.');
} catch (error) {
  // Step 5: Roll back all writes on any failure
  await session.abortTransaction();
  console.error('Transaction aborted and changes rolled back:', error);
  throw error;
} finally {
  // Step 6: Always release the session resource
  await session.endSession();
}
```

- **`mongoose.startSession()`**: Allocates a client session on the MongoDB Atlas connection pool.
- **`session.startTransaction()`**: Signals to the replica set that subsequent operations within this session belong to a shared atomic boundary.
- **`{ session }` option**: Every database command (`updateMany`, `find`, `save`) must explicitly receive `{ session }`. Any query executed without this option runs outside the transaction!
- **`await session.commitTransaction()`**: Permanently persists all writes to the replica set write concern majority.
- **`await session.abortTransaction()`**: Reverts the collection back to the state prior to the transaction.
- **`finally { await session.endSession(); }`**: Guarantees that the session socket is closed and returned to the pool, preventing memory leaks even if an error is thrown.

### 8. Execution Flow
```mermaid
sequenceDiagram
    participant App as Backend Script / Service
    participant Session as Mongo ClientSession
    participant Atlas as MongoDB Atlas (Replica Set)

    App->>Session: mongoose.startSession()
    App->>Session: session.startTransaction()
    App->>Atlas: StayModel.updateMany(..., { session })
    Atlas-->>App: updateResult (3 modified)
    App->>Atlas: StayModel.find(..., { session })
    Atlas-->>App: documents
    alt All Assertions Pass
        App->>Session: session.commitTransaction()
        Session->>Atlas: Commit Oplog Writes (Majority Write Concern)
        Atlas-->>App: Success
    else Any Assertion Fails / Error Thrown
        App->>Session: session.abortTransaction()
        Session->>Atlas: Discard Uncommitted Changes
        Atlas-->>App: Clean Rollback
    end
    App->>Session: session.endSession()
```

### 9. Common Mistakes
- **Forgetting to pass `{ session }` in queries**: If you start a transaction but execute `StayModel.updateMany(filter, update)` without `{ session }`, the query runs immediately as a standalone operation outside the transaction and will NOT be rolled back if `abortTransaction()` is called!
- **Running transactions on standalone MongoDB instances**: MongoDB transactions require a **Replica Set** architecture (standard on MongoDB Atlas). Running transactions on an unconfigured local standalone instance (`mongod`) will fail with `Transaction numbers are only allowed on a replica set member or mongos`.
- **Long-running transactions**: Transactions hold locks on modified documents. Keeping a transaction open for more than a few seconds (e.g. awaiting an external email or Stripe API call) will lead to transaction timeout errors (`TransactionExceededLifetimeLimitSeconds`) and block concurrent queries.

### 10. Interview Questions & Answers
**Q1: What prerequisites must be satisfied to use multi-document transactions in MongoDB?**
*Answer:* Two primary requirements must be met:
1. **Replica Set Architecture**: The MongoDB cluster must run as a replica set or sharded cluster (MongoDB Atlas provides this by default). Transactions cannot execute on a single standalone `mongod` process without replica set initialization.
2. **Feature Compatibility Version (FCV)**: Multi-document transactions require MongoDB 4.0+ for replica sets (and 4.2+ for sharded clusters) with the appropriate driver support. In application code, all operations must share the same `ClientSession`.

**Q2: Why should external third-party API calls (e.g., Stripe payment or SendGrid email) never be executed inside a database transaction block?**
*Answer:* Database transactions hold lock resources in the database engine and have strict lifetime limits (default 60 seconds in MongoDB). Network requests to third-party APIs have unpredictable latency (hundreds of milliseconds to seconds) and cannot be rolled back by the database. If the database transaction later fails and rolls back, the email has already been sent or the credit card has already been charged. Best practice is to complete the database transaction first, or use the Outbox Pattern to trigger external side-effects only after the transaction successfully commits.

### 11. Practical Exercise
Open [server/src/scripts/reset-host-assignments.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/scripts/reset-host-assignments.ts). Search for `session.startTransaction()`. Review how the script guarantees safety by verifying that the connected database name is strictly `'staylocal'` before the session is created.

---

## Summary of Key MongoDB & Mongoose Learnings

| Concept | Primary File | Core Technique | Key Production Rule |
| :--- | :--- | :--- | :--- |
| **Connection Lifecycle** | `config/db.ts` | Exponential backoff, timeout caps | Never leak passwords in connection error logs |
| **Schema Validation** | `models/booking.model.ts` | Subdocuments with `{ _id: false }`, enums | Validate data types before BSON serialization |
| **Pre-save Hooks** | `models/user.model.ts` | `UserSchema.pre('save')` | Always check `isModified()` and avoid arrow functions |
| **Database Indexing** | `models/booking.model.ts` | Compound B-tree indexes | Follow the ESR (Equality, Sort, Range) rule |
| **Lean Queries** | `controllers/stays.controller.ts` | `.lean()` | Use on read-only queries to eliminate hydration RAM |
| **Transactions** | `scripts/reset-host-assignments.ts` | `ClientSession`, commit/abort | Always pass `{ session }` to every operation |