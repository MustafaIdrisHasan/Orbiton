# Orbiton Frontend UI Refinement Plan

## Summary
Refactor the current scaffolded authenticated UI away from the left sidebar into a production-style top-header shell, with a distinct public header and a shared authenticated layout. Keep one common app frame for all authenticated users, but define role-specific dashboard bodies inside it.

The first implementation pass should replace the current placeholder dashboard with a fully designed student dashboard, while also specifying equally detailed dashboard content plans for Recruiter, Faculty, Admin, and TPO so the shell and data contracts do not need to change later.

## Key Changes
### Shared layout and navigation
- Replace the authenticated sidebar shell in `apps/web/src/app/layouts/AppLayout.jsx` with a top header.
- Authenticated header structure:
  - left: logo placeholder container
  - center: reserved spacing for future search or contextual title
  - right: `Placements`, `Companies`, notifications bell, profile icon
- Keep public pages on a separate public header; do not reuse the authenticated nav on landing/auth/support pages.
- `Placements` should route to the drive discovery/listing experience.
- `Companies` should route to an employer showcase experience, not a workflow-heavy recruiter directory.
- Preserve a content container below the header that all role dashboards and profile/settings pages share.

### Dashboard behavior and routing
- Keep `/dashboard` as the authenticated dashboard route, but render role-specific content blocks from the same shell.
- Student dashboard becomes the reference implementation for the layout system and data-card language.
- Student dashboard structure:
  - hero greeting with italicized `Hello {name}`
  - two-column status card titled `Current Status`
  - show `Applications Submitted` and `Offers Received`
  - single full-width CTA button: `View Drives`
  - full-width `Featured Placements` carousel using featured-tagged placements personalized to the current student
  - `My Applications` section with color-coded status cards:
    - yellow: in progress
    - orange: action needed
    - red: rejected/denied
    - green: offer received
    - each card includes a `More Details` button
  - `Upcoming Rounds` section with round name, date/time, mode, and link/location
  - `All Drives` dynamic grid sorted chronologically with filters for department, open/closed status, and numeric package range
- Recruiter dashboard plan:
  - hero greeting
  - current drive counts and applicant funnel snapshot
  - active drives list
  - upcoming scheduled rounds
  - recent applicant actions needing review
  - issued offers summary
- Faculty dashboard plan:
  - hero greeting
  - assigned students summary
  - students requiring attention
  - recent academic/performance updates
  - upcoming placement rounds involving assigned students
- Admin dashboard plan:
  - hero greeting
  - user counts by role
  - recent user/role changes
  - audit activity snapshot
  - system-level placement overview
- TPO dashboard plan:
  - hero greeting
  - placement stats overview
  - active drives and participation metrics
  - upcoming rounds across institute
  - offer and placement confirmation queue
- Tighten protected route behavior so authenticated access is explicit and role-aware; current localStorage demo persistence should be treated as temporary scaffold behavior, not final auth UX.

### Data and UI interfaces
- Frontend data contracts to define before implementation:
  - dashboard summary payload by role
  - featured placements list payload
  - applications summary payload with UI status mapping
  - upcoming rounds list payload
  - drive listing payload with filter metadata
  - employer showcase payload for `Companies`
- Student dashboard API expectations:
  - current counts for submitted applications and received offers
  - featured placement records with personalization metadata
  - application cards with normalized status enum
  - upcoming rounds with mode and location/link
  - paginated or incrementally loaded drive list with filter support
- Introduce a frontend status-to-style mapping table so application colors are driven by data enums rather than free-form strings.
- Use one shared card system and spacing scale so dashboard blocks, profile tabs, and future role dashboards feel consistent.

### Profile and settings IA
- Build profile/settings as a tabbed workspace under a shared profile route rather than a single long page.
- Student profile tab set:
  - Personal
  - Academic Details
  - Skills
  - Certifications
  - Marks / SGPA
  - Resume Management
  - Account Settings
  - Privacy & Security
- Tab behavior:
  - overview header with profile summary
  - tab content rendered in a single reusable content panel
  - preserve unsaved-change handling and edit/view modes in the implementation
- Personal tab:
  - full name, contact details, date of birth, department, program, year
- Academic Details tab:
  - CGPA, backlog count, semester records, uploaded memoranda
- Skills tab:
  - skills list, proficiency levels
- Certifications tab:
  - certification cards, issuer, issue date, file reference
- Resume Management tab:
  - uploaded resumes list, active resume state, upload/delete actions, future score placeholder
- Account Settings tab:
  - editable account fields and password change entry point
- Privacy & Security tab:
  - session/security info, email verification state, MFA placeholder for future release
- Apply the same tabbed workspace pattern to other roles, but adjust tab labels by role:
  - Recruiter: Company Profile, Drives, Team/Contacts, Account Settings, Privacy & Security
  - Faculty: Personal, Assigned Students, Account Settings, Privacy & Security
  - Admin/TPO: Personal, Role/Operational Settings, Account Settings, Privacy & Security

## Test Plan
- Visual/layout validation:
  - authenticated pages show top header only, no legacy sidebar
  - public pages retain separate public header behavior
  - responsive behavior works on desktop and mobile without collapsing content unusably
- Dashboard routing validation:
  - `/dashboard` shows the correct role-specific body for each authenticated role
  - unauthenticated access redirects to login
  - role-specific cards and sections do not leak across roles
- Student dashboard scenarios:
  - greeting renders the current user name
  - current status counts render correctly
  - featured placements carousel loads featured data only
  - application status cards map colors correctly
  - upcoming rounds show correct mode and link/location fields
  - drive grid sorts chronologically and respects department/status/package filters
- Profile/settings scenarios:
  - profile tabs switch correctly without layout breakage
  - each tab renders the intended data block set
  - resume management tab supports active-state representation
  - account/security tabs clearly separate editable settings from future placeholders

## Assumptions
- The current scaffolded sidebar and placeholder dashboard are temporary and should be fully replaced, not incrementally preserved.
- `Companies` is an employer showcase experience in the authenticated app, not a recruiter-management directory.
- `/dashboard` remains the primary authenticated landing route, but its body varies by role.
- The student dashboard is implemented first, while all other role dashboards are fully specified now so the shared shell and dashboard data layer stay stable.
- Profile/settings should be planned at wireframe-level depth now using a tabbed workspace model.
- The current demo-auth localStorage behavior is not the intended production auth flow and should not drive final route-access rules.
