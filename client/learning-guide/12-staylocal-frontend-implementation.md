# Phase 11: StayLocal Domain Subsystems & Business Logic

> **Scope:** Deep-dive into the specialized domain systems powering StayLocal: Tourist, Host, and Admin portals, bed-level inventory tracking, time-based booking policies, host assignment workflows, and real-time availability synchronization.  
> **Target Mastery:** Level 3 (Advanced)

---

## Subsystem 1: Bed-Level Inventory & Time-Based Booking Engine

### 1. Concept Name
Granular Bed-Level Availability & Time-Based Reservation Engine

### 2. Why It Exists
Traditional travel platforms (like Airbnb or Booking.com) treat properties as monolithic "rooms" or "entire homes". However, Himalayan village homestays often operate with flexible shared or private bed capacities across stone-and-timber rooms. Moreover, mountain properties need explicit **cleaning buffer times** (e.g. 60 minutes) between guest check-out and check-in for sanitization, solar heating recovery, and traditional linen preparation.

### 3. How It Works
- Instead of checking dates alone, StayLocal constructs full **ISO UTC timestamps** combining the date and specific time policy:
  - Check-in time: default `12:00 PM`
  - Check-out time: default `10:00 AM`
- **Cleaning Buffer:** The backend enforces a 60-minute cleaning window where the room is unavailable for turnover.
- **Bed Tracking:** Rather than blocking an entire home for a solo trekker, the system checks whether `occupiedBeds + requestedBeds <= totalBeds`.
- **Live Pricing Engine:** Calculates base price (`pricePerNight * nights`), 5% Community Fund contribution, and displays total.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/booking/BookingModal.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/booking/BookingModal.tsx#L97-L150)
- **Component:** `BookingModal`

### 5. Actual Code Example
```typescript
// client/src/components/booking/BookingModal.tsx
const fullCheckInIso = useMemo(() => {
  try {
    const d = new Date(`${checkInDate}T${checkInTime}:00`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  } catch {
    return undefined;
  }
}, [checkInDate, checkInTime]);

const handleCheckAvailability = useCallback(async () => {
  if (!stay || !fullCheckInIso || !fullCheckOutIso) return;
  setCheckingAvailability(true);
  try {
    const res = await apiService.checkStayAvailability(stay.id, {
      checkIn: fullCheckInIso,
      checkOut: fullCheckOutIso,
      bedsRequired,
    });
    setAvailability(res);
  } catch (err) {
    setErrorMessage(err instanceof Error ? err.message : 'Availability check failed');
  } finally {
    setCheckingAvailability(false);
  }
}, [stay, fullCheckInIso, fullCheckOutIso, bedsRequired]);
```

### 6. Line-by-Line Explanation
- **Lines 1–8:** Combines date picker (`YYYY-MM-DD`) and time selector (`HH:MM`) into a valid UTC ISO timestamp string (`2026-12-01T12:00:00.000Z`).
- **Lines 10–24:** Automatically checks availability against the backend engine, receiving `{ available: boolean, remainingBeds: number }`.

### 7. Execution Flow
1. Tourist adjusts check-in date or changes beds needed from 1 to 3.
2. `useMemo` recomputes ISO timestamp.
3. Debounced availability check fires to `/api/stays/:id/availability`.
4. If 3 beds are available, a green checkmark appears: *"Available: 4 of 6 beds remaining"*.
5. If requested beds exceed capacity, submit is disabled with a clear warning: *"Only 2 beds remaining for these dates"*.

### 8. Interview Questions
1. *Why does StayLocal track beds rather than just whole rooms?*
2. *How do time-based check-in/out policies prevent same-day turnover conflicts?*
3. *Why are timestamps converted to UTC ISO strings before transmitting to the server?*

### 9. Practical Exercise
Inspect [client/src/components/booking/BookingModal.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/booking/BookingModal.tsx#L120-L135). Trace how `communityFee` is computed as 5% of base price and displayed in the price breakdown table.

### 10. Prerequisites
Date math, ISO 8601 formatting, and `useCallback`.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 3.0 hours

---

## Subsystem 2: Host Portal & Reservation Management

### 1. Concept Name
Host Operational Dashboard & Inventory Lifecycle

### 2. Why It Exists
Homestay hosts are local community residents who manage real-world physical accommodations. When a booking request arrives, hosts need a clean interface to inspect traveler details (guest counts, adult/child breakdown, check-in time), and choose to either **confirm** the reservation (locking capacity) or **decline** it (freeing bed inventory for other travelers).

### 3. How It Works
- [client/src/pages/HostBookingsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HostBookingsPage.tsx) queries `apiService.getHostBookings()`, which returns all reservations for properties owned by this host.
- Offers segmented views: **All**, **Pending**, **Confirmed**, and **Timeline**.
- **Confirm Flow:** Calls `apiService.confirmBooking(id)`, executing an atomic status change from `'pending'` to `'confirmed'`.
- **Decline Flow:** Prompts the host for an optional reason (e.g., seasonal maintenance), calls `apiService.rejectBooking(id, reason)`, and releases reserved beds.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/HostBookingsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HostBookingsPage.tsx#L49-L87)
- **Component:** `HostBookingsPage`

### 5. Actual Code Example
```typescript
// client/src/pages/HostBookingsPage.tsx
const handleReject = async (bookingId: string) => {
  const reason = window.prompt(
    'Please provide an optional reason for declining this request:',
    'Seasonal room maintenance'
  );
  if (reason === null) return; // user cancelled prompt

  try {
    setProcessingId(bookingId);
    const updated = await apiService.rejectBooking(bookingId, reason || undefined);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    setActionSuccess(`Request ${updated.bookingReference} declined and bed inventory released.`);
  } catch (err) {
    setActionError(err instanceof Error ? err.message : 'Unable to decline request');
  } finally {
    setProcessingId(null);
  }
};
```

### 6. Line-by-Line Explanation
- **Line 2:** Captures decline reason from the host.
- **Line 9:** Calls `apiService.rejectBooking`, sending the reason to the backend.
- **Line 10:** Updates the booking row status to `'rejected'` without a full page refresh.
- **Line 11:** Green toast alert informs the host that bed inventory has been released.

### 7. Execution Flow
1. Guest submits a pending booking request.
2. Host opens `/host/bookings` and sees the card under the "Pending" tab.
3. Host clicks "Confirm".
4. The server runs the ACID check to ensure no double-booking occurred, commits the status change, and returns the confirmed record.
5. Host sees the card turn into an active green confirmation badge.

### 8. Interview Questions
1. *What happens to occupied beds when a booking transitions from `pending` to `rejected`?*
2. *Why does the server lock capacity inside a database session during confirmation?*
3. *How does `HostBookingsPage` prevent duplicate button clicks while an API call is inflight?*

### 9. Practical Exercise
Inspect [client/src/pages/HostListingsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HostListingsPage.tsx#L78-L96). Trace `handleDeactivate` and explain how a host can toggle a listing between `'published'` and `'draft'` mode.

### 10. Prerequisites
Asynchronous JavaScript, React state updates, and status transitions.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 2.5 hours

---

## Subsystem 3: Admin Governance & Host Property Assignment Portal

### 1. Concept Name
Preloaded Homestay Lead Governance & Host Assignment Architecture

### 2. Why It Exists
In rural Himalayan regions, many indigenous homestays are initially documented through local field research by tourism teams (preloaded leads). These homestays do not initially have registered digital host user accounts. StayLocal's administrative governance portal allows platform administrators to:
1. View all preloaded homestays segregated by assignment status (`assigned` vs. `unassigned`).
2. Search and filter registered, active hosts.
3. Assign a preloaded property to an eligible registered host.
4. Reassign a property to a different host with a mandatory audit reason.
5. Unassign a property (which strictly aborts if active upcoming confirmed bookings exist).
6. Inspect the full audit trail in `assignmentHistory`.

### 3. How It Works
- [client/src/pages/AdminHostAssignmentsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/AdminHostAssignmentsPage.tsx) queries `apiService.getAdminHostAssignments()` and `apiService.getAdminEligibleHosts()`.
- **Assignment Guard:** Only users with `role: 'host'` and `status: 'active'` are eligible. Tourists and guides cannot be assigned properties.
- **Assignment Fields Cleaned on Unassign:**
  `hostId`, `assignedHostId`, `assignedHostName`, `assignedHostEmail`, `assignedAt`, `assignedBy`, `assignedByName`.
- **Audit Preservation:** `assignmentHistory` is preserved and appended with an action log `{ action: 'assigned' | 'reassigned' | 'unassigned', timestamp, reason, assignedByName }`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/AdminHostAssignmentsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/AdminHostAssignmentsPage.tsx#L23-L80)
- **Component:** `AdminHostAssignmentsPage`

### 5. Actual Code Example
```typescript
// client/src/pages/AdminHostAssignmentsPage.tsx
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const [assignmentsRes, hostsRes] = await Promise.all([
      apiService.getAdminHostAssignments({
        search: searchQuery || undefined,
        district: districtFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
      apiService.getAdminEligibleHosts(),
    ]);

    setStays(assignmentsRes.stays);
    setEligibleHosts(hostsRes);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load assignment data.');
  } finally {
    setLoading(false);
  }
}, [searchQuery, districtFilter, statusFilter]);
```

### 6. Line-by-Line Explanation
- **Line 1:** `fetchData` fetches assignment data and eligible hosts concurrently.
- **Lines 7–11:** Passes search, district, and assignment status filters to the backend.
- **Lines 16–17:** Sets both stays and eligible host candidates into state simultaneously.

### 7. Execution Flow
1. Admin opens `/admin/assignments`.
2. Admin filters by `status: 'unassigned'`.
3. Table displays unassigned properties (e.g. Sarmoli homestays).
4. Admin clicks "Assign Host", selects a registered host account, enters justification, and confirms.
5. The homestay is now bound to that host, appearing in that host's `/host/listings` dashboard.

### 8. Interview Questions
1. *Why must assignment and verification be managed as two separate states on a homestay?*
2. *Why does the unassignment operation strictly block if active upcoming confirmed bookings exist?*
3. *How does `assignmentHistory` maintain an immutable audit trail in MongoDB?*

### 9. Practical Exercise
Inspect lines 369–444 of [server/src/services/admin-assignment.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/admin-assignment.service.ts#L369-L444). Verify which 7 fields are cleared when a property is unassigned, and explain how this matches the frontend UI behavior.

### 10. Prerequisites
Role-based access control, Promise.all, and MongoDB data modeling.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 3.0 hours
