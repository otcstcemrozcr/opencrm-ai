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
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const ratingEnum = pgEnum("rating", ["hot", "warm", "cold"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "inactive"]);
export const forecastCategoryEnum = pgEnum("forecast_category", [
  "pipeline",
  "best_case",
  "commit",
  "omitted",
]);

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
  legalName: text("legal_name"),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("UTC"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  taxNumber: text("tax_number"),
  telegramChatId: text("telegram_chat_id"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
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
    isActive: boolean("is_active").notNull().default(true),
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

export const campaignTypeEnum = pgEnum("campaign_type", [
  "email",
  "event",
  "webinar",
  "linkedin",
  "other",
]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "planned",
  "active",
  "completed",
]);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: campaignTypeEnum("type").notNull().default("email"),
    status: campaignStatusEnum("status").notNull().default("planned"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    budget: numeric("budget", { precision: 14, scale: 2 }),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("campaigns_org_idx").on(t.orgId),
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
    name2: text("name2"),
    type: accountTypeEnum("type").notNull().default("prospect"),
    industry: text("industry"),
    website: text("website"),
    phone: text("phone"),
    employees: integer("employees"),
    annualRevenue: numeric("annual_revenue", { precision: 14, scale: 2 }),
    taxNumber: text("tax_number"),
    taxOffice: text("tax_office"),
    currency: text("currency").notNull().default("USD"),
    paymentTerms: text("payment_terms"),
    creditLimit: numeric("credit_limit", { precision: 14, scale: 2 }),
    status: accountStatusEnum("status").notNull().default("active"),
    rating: ratingEnum("rating"),
    parentAccountId: uuid("parent_account_id").references(
      (): AnyPgColumn => accounts.id,
      { onDelete: "set null" }
    ),
    addressLine: text("address_line"),
    street2: text("street2"),
    postalCode: text("postal_code"),
    city: text("city"),
    region: text("region"),
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
    salutation: text("salutation"),
    name: text("name").notNull(),
    email: text("email"),
    secondaryEmail: text("secondary_email"),
    phone: text("phone"),
    mobile: text("mobile"),
    linkedin: text("linkedin"),
    title: text("title"),
    department: text("department"),
    doNotContact: boolean("do_not_contact").notNull().default(false),
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
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    status: leadStatusEnum("status").notNull().default("new"),
    score: integer("score").notNull().default(0),
    rating: ratingEnum("rating"),
    estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    doNotContact: boolean("do_not_contact").notNull().default(false),
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
    nextStep: text("next_step"),
    lossReason: text("loss_reason"),
    forecastCategory: forecastCategoryEnum("forecast_category").notNull().default("pipeline"),
    currency: text("currency").notNull().default("USD"),
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

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    relatedType: activityRelatedTypeEnum("related_type").notNull(),
    relatedId: uuid("related_id").notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    relatedIdx: index("notes_related_idx").on(t.orgId, t.relatedType, t.relatedId),
  })
);

export const savedViews = pgTable(
  "saved_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entity: text("entity").notNull(),
    name: text("name").notNull(),
    query: text("query").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index("saved_views_owner_idx").on(t.orgId, t.userId, t.entity),
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

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sku: text("sku"),
    kind: quoteLineKindEnum("kind").notNull().default("product"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("products_org_idx").on(t.orgId),
  })
);

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

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull().default("rep"),
    token: text("token").notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenUnique: uniqueIndex("invitations_token_unique").on(t.token),
    orgIdx: index("invitations_org_idx").on(t.orgId),
  })
);

export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenUnique: uniqueIndex("password_resets_token_unique").on(t.token),
    userIdx: index("password_resets_user_idx").on(t.userId),
  })
);

export const customFieldEntityEnum = pgEnum("custom_field_entity", [
  "account",
  "contact",
  "lead",
  "opportunity",
]);

export const customFieldTypeEnum = pgEnum("custom_field_type", [
  "text",
  "number",
  "date",
  "select",
  "checkbox",
]);

export const customFieldDefs = pgTable(
  "custom_field_defs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entity: customFieldEntityEnum("entity").notNull(),
    key: text("key").notNull(), // stable slug, unique per entity
    label: text("label").notNull(),
    type: customFieldTypeEnum("type").notNull().default("text"),
    options: text("options"), // JSON array of strings, for type=select
    required: boolean("required").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    keyUnique: uniqueIndex("custom_field_defs_key_unique").on(t.orgId, t.entity, t.key),
    entityIdx: index("custom_field_defs_entity_idx").on(t.orgId, t.entity),
  })
);

export const customFieldValues = pgTable(
  "custom_field_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => customFieldDefs.id, { onDelete: "cascade" }),
    entity: customFieldEntityEnum("entity").notNull(),
    recordId: uuid("record_id").notNull(),
    value: text("value"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    fieldRecordUnique: uniqueIndex("custom_field_values_field_record_unique").on(
      t.fieldId,
      t.recordId
    ),
    recordIdx: index("custom_field_values_record_idx").on(t.orgId, t.entity, t.recordId),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type Account = typeof accounts.$inferSelect;
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type AccountStatus = (typeof accountStatusEnum.enumValues)[number];
export type Rating = (typeof ratingEnum.enumValues)[number];
export type ForecastCategory = (typeof forecastCategoryEnum.enumValues)[number];
export type Contact = typeof contacts.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignType = (typeof campaignTypeEnum.enumValues)[number];
export type CampaignStatus = (typeof campaignStatusEnum.enumValues)[number];
export type Opportunity = typeof opportunities.$inferSelect;
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type OpportunityStage = (typeof opportunityStageEnum.enumValues)[number];
export type Activity = typeof activities.$inferSelect;
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
export type ActivityRelatedType = (typeof activityRelatedTypeEnum.enumValues)[number];
export type AuditLog = typeof auditLogs.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type SavedView = typeof savedViews.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type Product = typeof products.$inferSelect;
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
export type QuoteLineKind = (typeof quoteLineKindEnum.enumValues)[number];
export type Invitation = typeof invitations.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type CustomFieldDef = typeof customFieldDefs.$inferSelect;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type CustomFieldEntity = (typeof customFieldEntityEnum.enumValues)[number];
export type CustomFieldType = (typeof customFieldTypeEnum.enumValues)[number];
