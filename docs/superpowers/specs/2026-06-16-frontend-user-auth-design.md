# Frontend User Authentication Design

## Summary

This design adds a minimal frontend user system to the existing project while leaving the current admin setup intact.

The goal of the first version is narrow:

- frontend users can register, log in, and log out
- only logged-in frontend users can browse the public site and access media
- frontend users cannot access `/admin` or `/admin/api/*`
- the existing admin setup, login flow, and admin session handling stay unchanged

This version explicitly does not add favorites, comments, password reset, email verification, moderation, or admin-side user management.

## Current State

The current repository is built around a single-admin private deployment model.

- admin credentials are stored in config under `server.admin.username` and `server.admin.password`
- admin setup is completed through `/admin/api/setup`
- admin login uses the `vs_admin` cookie
- admin sessions are stored in `admin_sessions`
- frontend API routes are currently accessible without a frontend user identity model

This means frontend user access control cannot be added by configuration alone. A separate frontend user authentication layer is required.

## Goals

- Add a frontend user account model for normal viewers
- Require a valid frontend login to access frontend JSON APIs and media routes
- Preserve the current admin authentication behavior
- Keep the first release small enough to implement and test safely

## Non-Goals

- No migration of admin accounts into a shared `users` table
- No role hierarchy beyond existing admin behavior and new frontend user behavior
- No favorites or comments in this phase
- No email, SMS, OAuth, invite codes, or approval flow
- No frontend user profile editing
- No admin UI for managing frontend users

## Proposed Approach

Use a separate frontend user authentication system alongside the existing admin authentication.

This is intentionally not a unified auth refactor. The project is currently centered on a config-based single-admin model, and the requested feature only needs frontend users to watch content. Keeping admin auth untouched reduces risk to existing deployment and setup flows.

### Why this approach

- smallest change set that satisfies the requirement
- avoids destabilizing `/admin/api/setup`, `/admin/api/login`, and current admin session behavior
- makes rollback easy if frontend auth introduces issues
- creates a clean path to add favorites or comments later using frontend user IDs

## Architecture

### Admin authentication

The current admin authentication remains unchanged.

- admin login endpoint stays `/admin/api/login`
- admin setup endpoint stays `/admin/api/setup`
- admin cookie stays `vs_admin`
- admin session table stays `admin_sessions`

### Frontend user authentication

Add a new frontend user auth flow with its own storage and cookie.

- frontend auth endpoints live under `/api/auth/*`
- frontend cookie name is `vs_user`
- frontend sessions are stored separately from admin sessions
- frontend users are not recognized as admins

This creates a hard boundary between viewer access and admin access.

## Data Model

Add two new tables.

### `users`

Fields:

- `id` text primary key
- `username` text unique not null
- `password_hash` text not null
- `status` text not null default `active`
- `created_at` integer not null
- `updated_at` integer not null

Notes:

- usernames are trimmed before validation
- usernames are unique case-insensitively at the application layer
- passwords are stored only as hashes
- first phase only supports `active` status, but the `status` column leaves room for future disable or ban behavior

### `user_sessions`

Fields:

- `token` text primary key
- `user_id` text not null
- `created_at` integer not null
- `expires_at` integer not null

Indexes:

- index on `user_id`
- optional index on `expires_at` if cleanup becomes necessary

Notes:

- this mirrors the simplicity of the existing admin session model
- tokens are random opaque session IDs stored in an HTTP-only cookie

## Backend API

Add these new endpoints.

### `POST /api/auth/register`

Request body:

```json
{
  "username": "demo",
  "password": "secret123"
}
```

Behavior:

- validates username is non-empty
- validates password length with the same minimum policy used for admin setup, unless a stronger minimum is chosen during implementation
- rejects duplicate usernames
- stores a hashed password
- may optionally auto-login the user after registration

Recommended behavior for phase one:

- auto-login after successful registration to reduce friction

### `POST /api/auth/login`

Request body:

```json
{
  "username": "demo",
  "password": "secret123"
}
```

Behavior:

- verifies credentials against the `users` table
- creates a `user_sessions` record
- sets the `vs_user` cookie

### `POST /api/auth/logout`

Behavior:

- deletes the current frontend session if present
- clears the `vs_user` cookie

### `GET /api/auth/me`

Response:

```json
{
  "authenticated": true,
  "username": "demo"
}
```

or

```json
{
  "authenticated": false
}
```

Behavior:

- returns frontend user auth state only
- does not expose admin session state

## Frontend Route Protection

Frontend page access should require a logged-in frontend user.

Implementation direction:

- add `/login`
- add `/register`
- check `/api/auth/me` on app boot or route entry
- if unauthenticated, redirect protected routes to `/login`

The login flow should preserve the original destination when practical so users can return to the page they intended to open.

## Protected Backend Routes

The frontend user auth middleware should protect both metadata APIs and actual media delivery routes.

### Protect frontend JSON APIs

At minimum:

- `GET /api/home`
- `GET /api/videos`
- `GET /api/video/{id}`
- `POST /api/video/{id}/view`
- `POST /api/video/{id}/like`
- `POST /api/video/{id}/unlike`

### Protect media and asset routes

Any route that can reveal actual watchable content or related media should require a valid frontend user session.

Expected protected route families include:

- `/p/stream/...`
- `/p/thumb/...`
- `/p/preview/...`
- `/p/upload/...`
- any other route serving video bytes or preview assets

This is important because protecting only the JSON APIs would still allow direct access if someone knows the media URL pattern.

## Authorization Rules

- frontend users can access protected frontend APIs and protected media routes
- frontend users cannot access `/admin` or `/admin/api/*`
- admin users continue to use the current admin auth flow
- admin auth does not automatically satisfy frontend auth requirements unless explicitly designed later

For phase one, admin and frontend sessions remain intentionally separate.

## Security Considerations

- use password hashing such as bcrypt for frontend users
- set `HttpOnly` on the `vs_user` cookie
- use `SameSite=Lax` unless a stronger setting is compatible with the deployment model
- set cookie `Path=/`
- set cookie expiry consistently with session expiry
- validate and normalize usernames before storage
- avoid leaking whether a username exists beyond standard duplicate-registration handling

If the app is served only behind HTTPS in production, the implementation should also set `Secure` on frontend cookies.

## Error Handling

Registration and login responses should stay simple and consistent.

Examples:

- `400` for invalid input
- `401` for invalid login credentials
- `409` for duplicate usernames on registration
- `401` for unauthenticated access to protected frontend resources

The frontend should treat `401` on protected routes as a signal to redirect to `/login`.

## Testing Strategy

### Backend

Add tests for:

- user registration success
- duplicate username rejection
- login success
- login failure
- session validation
- logout clearing the session
- protected frontend API requires `vs_user`
- protected media route requires `vs_user`
- admin routes do not accept `vs_user` as admin auth

### Frontend

Add tests for:

- login page submission flow
- register page submission flow
- unauthenticated users being redirected before protected page content loads
- authenticated users reaching protected routes

## Implementation Plan Shape

The work should be implemented in this order:

1. schema and catalog support for frontend users and sessions
2. frontend auth backend module and `/api/auth/*` endpoints
3. middleware protection for frontend APIs and media routes
4. frontend login and register pages plus route guarding
5. tests for backend and frontend auth flows

## Risks

### Route coverage gaps

The main security risk is forgetting to protect a media-serving route. Implementation should review route registration carefully and test direct URL access.

### Frontend boot regressions

The current frontend appears to assume public access. Adding auth checks can introduce flashing, redirect loops, or repeated `401` requests if done inconsistently.

### Cookie confusion

The project will have both `vs_admin` and `vs_user`. Tests should ensure they do not satisfy each other's middleware.

## Future Extensions

This design intentionally leaves room for later additions:

- favorites tied to `users.id`
- comments tied to `users.id`
- user moderation or disable flow using `status`
- admin-side viewer management

Those features are out of scope for this first phase.
