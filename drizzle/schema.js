import {
  mysqlTable,
  mysqlEnum,
  int,
  decimal,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";

export const usersTable = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // argon2 password hash
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["ROLE_ADMIN", "ROLE_USER"])
    .default("ROLE_USER")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Refresh-token sessions. Each row is one logged-in device/session.
 * The JWT refresh token only carries this row's id; validity is checked
 * here (and mirrored in an in-memory cache for O(1) lookups).
 */
export const refreshTokensTable = mysqlTable("refresh_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  valid: boolean("valid").default(true).notNull(),
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Events — upcoming & past events/camps with details.
 * `eventDate` drives the upcoming/past split shown to visitors.
 */
export const eventsTable = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  summary: varchar("summary", { length: 500 }),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  eventDate: timestamp("event_date").notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  published: boolean("published").default(true).notNull(),
  createdBy: int("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Blog / News — articles, press coverage, announcements.
 */
export const blogPostsTable = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  category: mysqlEnum("category", ["article", "press", "announcement"])
    .default("article")
    .notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  content: text("content").notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  author: varchar("author", { length: 255 }),
  published: boolean("published").default(true).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdBy: int("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Gallery — photos and videos from events/camps.
 * `mediaUrl` is either an uploaded file path (/uploads/gallery/...) or an
 * external URL (e.g. a YouTube link) for videos.
 */
export const galleryItemsTable = mysqlTable("gallery_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }),
  caption: varchar("caption", { length: 500 }),
  mediaType: mysqlEnum("media_type", ["image", "video"])
    .default("image")
    .notNull(),
  mediaUrl: varchar("media_url", { length: 500 }).notNull(),
  eventId: int("event_id").references(() => eventsTable.id, {
    onDelete: "set null",
  }),
  createdBy: int("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Donations — one row per donation attempt, created the moment a Razorpay
 * order is opened. `status` starts at "created" and moves to "paid"/"failed"
 * once the payment is verified (client callback) or confirmed (webhook).
 *
 * `amount` is stored in rupees (decimal, 2 places) — the natural unit for
 * display and reporting. Razorpay's API always deals in paise (the smallest
 * currency unit), so the conversion happens only at the point of calling
 * Razorpay (see utils/payments.js `rupeesToPaise`) — never in this table.
 */
export const donationsTable = mysqlTable("donations", {
  id: int("id").autoincrement().primaryKey(),
  // Our internal reference, also sent to Razorpay as the order receipt.
  receipt: varchar("receipt", { length: 40 }).notNull().unique(),
  donorName: varchar("donor_name", { length: 255 }).notNull(),
  donorEmail: varchar("donor_email", { length: 255 }).notNull(),
  donorPhone: varchar("donor_phone", { length: 20 }),
  message: varchar("message", { length: 500 }),
  amount: decimal("amount", { precision: 12, scale: 2, mode: "number" }).notNull(), // rupees
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  status: mysqlEnum("status", ["created", "paid", "failed", "refunded"])
    .default("created")
    .notNull(),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 })
    .notNull()
    .unique(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  razorpaySignature: varchar("razorpay_signature", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/**
 * Contact form submissions — one row per message sent via /contact.
 */
export const contactSubmissionsTable = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
