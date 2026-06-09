import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "rep",
  "viewer",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull().default("rep"),
    emailVerified: boolean("email_verified").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailOrgUnique: uniqueIndex("users_email_org_unique").on(t.orgId, t.email),
    orgIdx: index("users_org_idx").on(t.orgId),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
    tokenIdx: index("sessions_token_idx").on(t.refreshTokenHash),
  })
);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "working",
  "qualified",
  "unqualified",
  "converted",
]);

export const opportunityStageEnum = pgEnum("opportunity_stage", [
  "new",
  "qualified",
  "discovery",
  "meeting",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "call",
  "meeting",
  "demo",
  "site_visit",
  "follow_up",
]);

export const activityRelatedTypeEnum = pgEnum("activity_related_type", [
  "lead",
  "opportunity",
  "account",
  "contact",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "prospect",
  "customer",
  "partner",
  "other",
]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull().default("prospect"),
    industry: text("industry"),
    website: text("website"),
    phone: text("phone"),
    employees: integer("employees"),
    annualRevenue: numeric("annual_revenue", { precision: 14, scale: 2 }),
    addressLine: text("address_line"),
    city: text("city"),
    country: text("country"),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("accounts_org_idx").on(t.orgId),
  })
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    linkedin: text("linkedin"),
    title: text("title"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("contacts_org_idx").on(t.orgId),
    accountIdx: index("contacts_account_idx").on(t.accountId),
  })
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    linkedin: text("linkedin"),
    source: text("source"),
    industry: text("industry"),
    status: leadStatusEnum("status").notNull().default("new"),
    score: integer("score").notNull().default(0),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    aiSummary: text("ai_summary"),
    convertedAccountId: uuid("converted_account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    convertedContactId: uuid("converted_contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    convertedOpportunityId: uuid("converted_opportunity_id"),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("leads_org_idx").on(t.orgId),
    statusIdx: index("leads_org_status_idx").on(t.orgId, t.status),
  })
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    stage: opportunityStageEnum("stage").notNull().default("new"),
    value: numeric("value", { precision: 14, scale: 2 }).notNull().default("0"),
    probability: integer("probability").notNull().default(0),
    expectedClose: date("expected_close"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    competitor: text("competitor"),
    notes: text("notes"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("opportunities_org_idx").on(t.orgId),
    stageIdx: index("opportunities_org_stage_idx").on(t.orgId, t.stage),
    closeIdx: index("opportunities_org_close_idx").on(t.orgId, t.expectedClose),
  })
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull().default("follow_up"),
    subject: text("subject").notNull(),
    notes: text("notes"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    relatedType: activityRelatedTypeEnum("related_type").notNull(),
    relatedId: uuid("related_id").notNull(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("activities_org_idx").on(t.orgId),
    relatedIdx: index("activities_related_idx").on(t.orgId, t.relatedType, t.relatedId),
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // create | update | delete | convert | status
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    diff: text("diff"), // JSON string of relevant detail
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("audit_logs_org_idx").on(t.orgId),
  })
);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
]);

export const quoteLineKindEnum = pgEnum("quote_line_kind", ["product", "service"]);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    quoteNo: text("quote_no").notNull(),
    version: integer("version").notNull().default(1),
    status: quoteStatusEnum("status").notNull().default("draft"),
    currency: text("currency").notNull().default("USD"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
    tax: numeric("tax", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    validUntil: date("valid_until"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("quotes_org_idx").on(t.orgId),
    statusIdx: index("quotes_org_status_idx").on(t.orgId, t.status),
  })
);

export const quoteLines = pgTable(
  "quote_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    kind: quoteLineKindEnum("kind").notNull().default("product"),
    name: text("name").notNull(),
    description: text("description"),
    qty: numeric("qty", { precision: 12, scale: 2 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull().default("0"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    quoteIdx: index("quote_lines_quote_idx").on(t.quoteId),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type Account = typeof accounts.$inferSelect;
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type Contact = typeof contacts.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type OpportunityStage = (typeof opportunityStageEnum.enumValues)[number];
export type Activity = typeof activities.$inferSelect;
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
export type ActivityRelatedType = (typeof activityRelatedTypeEnum.enumValues)[number];
export type AuditLog = typeof auditLogs.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
export type QuoteLineKind = (typeof quoteLineKindEnum.enumValues)[number];
