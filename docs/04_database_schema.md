# 04 — Database Schema

**Last updated:** 2026-06-07
**Convention:** every business table has `id` (uuid/pk), `org_id` (fk → organizations),
`created_at`, `updated_at`. Most have `owner_id` and `created_by`. All queries are org-scoped.

## Tables

### organizations
`id`, `name`, `slug` (unique), `settings` (jsonb), timestamps.

### users
`id`, `org_id`, `email` (unique per org), `password_hash`, `email_verified` (bool),
`role` (`admin|manager|rep|viewer`), `name`, `last_login_at`, timestamps.

### sessions (refresh tokens)
`id`, `user_id`, `org_id`, `refresh_token_hash`, `expires_at`, `revoked_at`, `created_at`.

### org_invitations
`id`, `org_id`, `email`, `role`, `token_hash`, `invited_by`, `accepted_at`, `expires_at`, timestamps.

### accounts
`id`, `org_id`, `name`, `industry`, `website`, `owner_id`, timestamps.

### contacts
`id`, `org_id`, `account_id` (fk), `name`, `email`, `phone`, `linkedin`, `title`, `owner_id`, timestamps.

### leads
`id`, `org_id`, `company`, `contact_name`, `email`, `phone`, `linkedin`, `source`, `industry`,
`status` (`new|working|qualified|unqualified|converted`), `score` (int), `owner_id`,
`ai_summary` (text), `converted_account_id`, `converted_contact_id`, `converted_opportunity_id`,
`last_activity_at`, timestamps.

### opportunities
`id`, `org_id`, `account_id` (fk), `name`,
`stage` (`new|qualified|discovery|meeting|proposal|negotiation|won|lost`),
`value` (numeric), `probability` (int 0–100), `expected_close` (date), `owner_id`,
`competitor`, `notes` (text), `closed_at`, `last_activity_at`, timestamps.

### activities
`id`, `org_id`, `type` (`call|meeting|demo|site_visit|follow_up`), `subject`, `due_at`,
`completed_at`, `related_type` (`lead|opportunity|account|contact`), `related_id`, `owner_id`, timestamps.

### quotes
`id`, `org_id`, `account_id` (fk), `opportunity_id` (fk, nullable), `quote_no`, `version` (int),
`status` (`draft|sent|accepted|rejected|expired`), `subtotal`, `discount`, `tax`, `total`,
`valid_until` (date), timestamps.

### quote_lines
`id`, `org_id`, `quote_id` (fk), `kind` (`product|service`), `name`, `description`, `qty`,
`unit_price`, `discount`, `tax_rate`, `line_total`, `sort_order`.

### audit_logs
`id`, `org_id`, `actor_id`, `action` (`create|update|delete`), `entity_type`, `entity_id`,
`diff` (jsonb), `created_at`.

## Key Relationships
- lead → (convert) → account + contact + opportunity (back-references stored on lead).
- account 1—N contacts, opportunities, quotes, activities (timeline source).
- opportunity 1—N quotes; quote 1—N quote_lines.
- activities polymorphic via `related_type` + `related_id`.

## Indexing (initial)
`(org_id)` on every table; `(org_id, status)` on leads; `(org_id, stage)` and
`(org_id, expected_close)` on opportunities; `(org_id, status)` on quotes;
`(org_id, related_type, related_id)` on activities.
