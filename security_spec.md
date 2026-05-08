# Firebase Security Specification - KTA Portfolio

## Data Invariants
- An analytics event must have a `visitorId`, `type`, and `timestamp`.
- The `type` must be one of: `page_view`, `project_click`, `session_end`.
- The `visitorId` must be a non-empty string.
- Only the admin (identifiable by a specific rule or being signed in if we added Auth) should be able to read all events.
- New events can be created by anyone (public site visitors).
- Existing events cannot be updated or deleted (immutable logs).

## The "Dirty Dozen" Payloads (Testing for rejection)

1. **Identity Spoofing (Write as someone else)**
   - Payload: `{ "visitorId": "attacker", "type": "page_view", "timestamp": "2024-05-08T12:00:00Z", "isAdmin": true }`
   - Goal: Ensure users can't grant themselves admin privileges in the data.

2. **Resource Poisoning (Huge ID)**
   - Path: `/analytics_events/a-very-long-id-that-is-way-more-than-128-characters-long-and-designed-to-bloat-the-database-indexes-and-cause-resource-exhaustion-attacks`
   - Goal: Block oversized document IDs.

3. **State Shortcutting (Invalid Type)**
   - Payload: `{ "visitorId": "v1", "type": "HACKED", "timestamp": "..." }`
   - Goal: Enforce enum values for `type`.

4. **Value Poisoning (Wrong Type)**
   - Payload: `{ "visitorId": 123, "type": "page_view", "timestamp": "..." }`
   - Goal: Enforce string types.

5. **Missing Fields**
   - Payload: `{ "visitorId": "v1", "type": "page_view" }`
   - Goal: Enforce required fields.

6. **Shadow Update (Update-Gap)**
   - Action: Update an existing event adding `maliciousField: true`.
   - Goal: Block all updates.

7. **Orphaned Writes (Invalid Timestamp)**
   - Payload: `{ "visitorId": "v1", "type": "page_view", "timestamp": 123456 }`
   - Goal: Enforce ISO string.

8. **PII Leakage (Guessing IDs)**
   - Action: Read a specific visitor's event without being admin.
   - Goal: Block non-admin reads.

9. **Unauthorized List (Scraping)**
   - Action: List all events via `getDocs(collection(db, 'analytics_events'))`.
   - Goal: Block public listing.

10. **Self-Assigned Permissions**
    - Action: Write to a non-existent `admins` collection.
    - Goal: Block all non-defined paths.

11. **Malicious ID (Poisoning)**
    - Path: `/analytics_events/../system/config`
    - Goal: Block path traversal style IDs.

12. **Double Delete**
    - Action: User tries to delete an event.
    - Goal: Block deletes.

## Test Runner (Logic)
The `firestore.rules` will be evaluated against these constraints.
Since we don't have a full Node.js test environment running the emulator right now, I will use manual analysis and ESLint.
