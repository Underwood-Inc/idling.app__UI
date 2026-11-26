---
title: UserDetailsModal
description: Read-only admin profile drill-down for a user
---

# UserDetailsModal

Client modal showing extended user profile: avatar, username component, provider, bio/location flags, roles (with assignment metadata), subscriptions, and timeout history sections.

## Usage

Opened from `UserManagementPanel` with a enriched `User` object (see interfaces at top of source). Section headings use `SiteIcon`.

Primarily **read-only** inspection; destructive/edit flows route to other modals from the panel.

---

**Sources:** `src/app/admin/components/modals/UserDetailsModal.tsx`