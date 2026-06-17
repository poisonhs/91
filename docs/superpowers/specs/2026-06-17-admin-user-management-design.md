# Admin User Management Design

## Summary

This design adds admin-side management for frontend viewer accounts.

The scope is intentionally narrow:

- list frontend users in the admin panel
- enable or disable frontend users
- reset frontend user passwords
- delete frontend users
- invalidate frontend sessions immediately when an admin disables a user, resets a password, or deletes a user

This design does not change the existing admin authentication model and does not introduce a shared role system.

## Current State

The repository already has a separate frontend viewer auth system alongside the existing admin auth flow.

- admin login uses its current `/admin/api/*` endpoints and `vs_admin` cookie
- frontend viewers use `vs_user`
- frontend viewer records are stored in `users`
- frontend viewer sessions are stored in `user_sessions`
- the `users` table already includes a `status` column
- the admin UI already has a routed shell for feature pages, but no viewer user management page yet

The project therefore already has the right storage model for admin-side viewer management. The missing pieces are admin APIs, UI controls, and runtime enforcement of viewer account status.

## Goals

- Add a dedicated admin page for managing frontend viewer users
- Allow admins to list all viewer users
- Allow admins to enable or disable viewer users
- Allow admins to reset a viewer user's password
- Allow admins to delete a viewer user
- Ensure disabled users cannot log in
- Ensure disabled, reset, or deleted users lose active viewer sessions immediately

## Non-Goals

- No changes to admin setup, admin login, or admin session storage
- No migration to a unified user and role model
- No batch operations in the first version
- No search or pagination in the first version
- No profile editing for viewer users
- No email-based password reset flow
- No new moderation or audit log system
- No new business rules for favorites, comments, or other viewer-owned records beyond current database behavior

## Proposed Approach

Use the existing frontend `users` and `user_sessions` tables and add a small admin management layer on top.

This is the recommended approach because it matches the current architecture and avoids destabilizing the admin authentication flow. The key behavior change is that viewer account `status` becomes actively enforced at login time and session-validation time.

### Why this approach

- smallest safe change set for the requested feature
- reuses the existing viewer auth storage already in production
- keeps admin auth isolated from viewer auth
- makes disable, reset-password, and delete behavior consistent through explicit session invalidation
- leaves room for future user search, pagination, or moderation without rewriting the core flow

## Architecture

### Admin authentication

The existing admin auth model remains unchanged.

- admin endpoints stay under `/admin/api/*`
- admin cookie stays `vs_admin`
- admin auth middleware remains the gate for the management page and APIs

### Viewer user management

Admin-side management targets frontend viewer accounts only.

- managed records come from the existing `users` table
- managed sessions come from the existing `user_sessions` table
- the admin UI adds a new page under `/admin/users`
- management actions are exposed through new admin APIs

### Viewer auth enforcement

Viewer status must be enforced in two places:

1. Login:
   - only users with `status = active` can authenticate successfully
2. Session-based access:
   - if a session belongs to a user whose status is no longer `active`, treat the viewer as unauthenticated

This ensures disabling a user is effective both for future logins and for already-issued viewer cookies.

## Data Model

No new tables are required.

### Existing `users` table

Relevant fields:

- `id`
- `username`
- `password_hash`
- `status`
- `created_at`
- `updated_at`

For this feature, `status` uses only:

- `active`
- `disabled`

### Existing `user_sessions` table

Relevant fields:

- `token`
- `user_id`
- `created_at`
- `expires_at`

This table is reused for immediate session invalidation when management actions require it.

## Backend API

Add the following admin endpoints.

### `GET /admin/api/users`

Returns the full list of frontend viewer users.

Response shape:

```json
[
  {
    "id": "user-1",
    "username": "demo",
    "status": "active",
    "createdAt": "2026-06-17T10:00:00Z",
    "updatedAt": "2026-06-17T10:00:00Z"
  }
]
```

Behavior:

- returns viewer users only
- excludes password hashes
- default ordering should be stable and easy to read, such as `created_at ASC`

### `POST /admin/api/users/{id}/status`

Request body:

```json
{
  "status": "disabled"
}
```

Behavior:

- accepts only `active` or `disabled`
- updates the user status
- if the new status is `disabled`, deletes all sessions for that user
- if the user does not exist, returns `404`

Recommended idempotent behavior:

- setting a user to their current status still succeeds

### `POST /admin/api/users/{id}/reset-password`

Request body:

```json
{
  "password": "new-secret"
}
```

Behavior:

- validates the new password length using the same minimum used by existing viewer registration and admin setup flows
- hashes the password before storage
- updates `password_hash`
- deletes all existing sessions for that user
- if the user does not exist, returns `404`

### `DELETE /admin/api/users/{id}`

Behavior:

- deletes the user record
- explicitly clears user sessions before or alongside deletion
- if the user does not exist, returns `404`

Deletion of related viewer-owned data should follow current schema and runtime behavior. This version does not add new cleanup or anonymization rules beyond what the existing database and code already do.

## Catalog Layer Changes

Add catalog methods to support the admin API.

Required methods:

- list frontend users
- update a frontend user's status
- update a frontend user's password hash
- delete a frontend user
- delete all sessions for a frontend user

Implementation should keep these methods narrowly focused so the admin API layer can compose actions cleanly:

- disable user = update status + delete sessions
- enable user = update status
- reset password = update password hash + delete sessions
- delete user = delete sessions + delete user

## Frontend Admin UI

Add a new admin page for viewer user management.

### Routing

- add `/admin/users` to the admin route tree
- add a `用户管理` navigation item in the admin layout

### API client

Add admin client helpers for:

- `listUsers()`
- `setUserStatus(id, status)`
- `resetUserPassword(id, password)`
- `deleteUser(id)`

### Page layout

Create a new `UsersPage` that follows the existing admin page patterns.

Display columns:

- username
- status
- created time
- updated time
- actions

### Row actions

Each user row should expose:

- `禁用` when status is `active`
- `启用` when status is `disabled`
- `重置密码`
- `删除`

### Interaction model

- use the existing confirmation modal style for `禁用` and `删除`
- use the existing modal style for `重置密码`
- reset-password modal validates:
  - password is not empty
  - password length is at least 6
  - confirmation matches
- after a successful action:
  - show a toast
  - refresh the list

### First-version limits

Do not add the following in this phase:

- search
- pagination
- bulk actions

These can be added later without changing the backend contract introduced here.

## Authorization Rules

- admin users can access `/admin/users` and the new `/admin/api/users*` endpoints
- frontend viewers cannot access admin routes or admin APIs
- disabled viewer users cannot log in
- disabled viewer users with existing `vs_user` cookies are treated as logged out
- password-reset viewer users with existing `vs_user` cookies are treated as logged out
- deleted viewer users with existing `vs_user` cookies are treated as logged out

## Error Handling

Keep error behavior aligned with current admin API style.

- `400` for invalid input
- `404` for unknown user IDs
- `500` for unexpected storage or hashing failures

Specific validation rules:

- invalid status values return `400`
- password shorter than 6 characters returns `400`

## Testing Strategy

### Backend

Add or extend tests for:

- listing users
- disabling a user updates status
- disabling a user invalidates existing sessions
- disabled users cannot log in
- disabled users with an existing session fail current-user lookup
- resetting a password invalidates existing sessions
- resetting a password makes the old password fail and the new password succeed
- deleting a user removes the user
- deleting a user invalidates existing sessions

### Frontend

At minimum, verify:

- the admin users page loads and renders rows
- enable and disable actions refresh state and show toasts
- reset password modal validates mismatched or short passwords
- delete action refreshes the list and shows a toast

## Implementation Order

Implement the work in this order:

1. catalog methods for user listing, mutation, and session deletion
2. viewer auth enforcement for disabled accounts
3. admin API endpoints for user management
4. admin API client updates
5. admin users page and navigation wiring
6. backend and frontend verification

## Risks

### Session invalidation gaps

The biggest functional risk is forgetting to invalidate existing viewer sessions after disable, reset-password, or delete actions. This must be covered by tests.

### Partial status enforcement

If status is enforced only at login but not during session lookup, disabled users could remain logged in. The implementation must enforce both paths.

### Future related-data expectations

Deleting a user may later need more explicit handling for favorites, comments, or other user-owned records. This design intentionally defers that policy decision so the first version stays small and predictable.

## Future Extensions

This design leaves clean room for future additions:

- search and pagination for large user lists
- bulk enable, disable, or delete actions
- richer account states such as suspended or banned
- admin visibility into viewer activity
- explicit policy for deleting or anonymizing viewer-generated content
