# Confirm DU Firestore Security Specification

## 1. Data Invariants
1. **Student Profile Privacy (PII Protection):** A `/users/{userId}` document may only be read or written by the authenticated user whose `request.auth.uid == userId` (with `email_verified == true`), or a verified Admin.
2. **Lesson Notes Master Gate:** A `/users/{userId}/lessonNotes/{lessonId}` document can only exist and be accessed if its parent `/users/{userId}` profile exists and the caller is `isOwner(userId)` or `isAdmin()`.
3. **Admin-Only Content Management:** `/courses/{courseId}`, `/liveClasses/{liveClassId}`, and `/quizQuestions/{questionId}` are publicly readable catalog/curriculum collections (containing zero PII), and may ONLY be created, updated, or deleted by a verified Admin (`isAdmin()`).
4. **Leaderboard Integrity (Zero PII):** `/leaderboard/{attemptId}` entries contain only `studentName` (no email or phone), require `uid == request.auth.uid`, `isPublic == true`, `score <= total`, `accuracy >= 0 && accuracy <= 100`, and server timestamp `createdAt == request.time`. Leaderboard entries are immutable once submitted (`update, delete` denied to students, allowed only to Admin).
5. **Immutable Ownership & Timestamps:** `uid`, `createdBy`, and `createdAt` cannot be modified on update; `updatedAt` must equal `request.time`.

## 2. "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Profile Read:** Unauthenticated `get /users/student1` -> Denied.
2. **Cross-User PII Snooping:** Student A tries `get /users/studentB` -> Denied.
3. **UID Spoofing on Profile Create:** Student A creates `/users/studentA` with `uid: "studentB"` -> Denied.
4. **Ghost Field / Shadow Key Injection:** Student A creates `/users/studentA` with extra `isAdmin: true` -> Denied by `keys().hasOnly(...)`.
5. **Unverified Email Spoofing:** User with `email: "shahidulislamemail3@gmail.com"` and `email_verified: false` attempts admin course write -> Denied.
6. **Student Course Tampering:** Non-admin student tries to create `/courses/hacked` -> Denied.
7. **ID Poisoning:** Admin or user tries to create `/courses/a..150chars...` or invalid chars `bad/id` -> Denied by `isValidId()`.
8. **Client Timestamp Forgery:** User submits `/leaderboard/att1` with backdated `createdAt` -> Denied by `createdAt == request.time`.
9. **Score Manipulation:** User submits `/leaderboard/att2` with `score: 100, total: 5` -> Denied by `score <= total`.
10. **Leaderboard Tampering:** Student tries to `update` their submitted `/leaderboard/att1` score -> Denied.
11. **Oversized Note Exhaustion:** Student writes `/users/studentA/lessonNotes/l1` with 10,000+ chars -> Denied by `content.size() <= 5000`.
12. **Blanket User List Scraping:** Student tries `list /users` without `uid == request.auth.uid` constraint -> Denied.
