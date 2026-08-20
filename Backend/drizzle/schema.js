import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// Role-based access control values: ROLE_ADMIN and ROLE_USER
export const userRoleEnum = pgEnum("user_role", ["ROLE_ADMIN", "ROLE_USER"]);

// Blog / News categories
export const blogCategoryEnum = pgEnum("blog_category", [
  "article",
  "press",
  "announcement",
]);

// Gallery media types
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

// Donation / payment lifecycle states
export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "paid",
  "failed",
  "refunded",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // argon2 password hash
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("ROLE_USER").notNull(),
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
export const refreshTokensTable = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
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
export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  summary: varchar("summary", { length: 500 }),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  eventDate: timestamp("event_date").notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  published: boolean("published").default(true).notNull(),
  createdBy: integer("created_by").references(() => usersTable.id, {
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
export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  category: blogCategoryEnum("category").default("article").notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  content: text("content").notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  author: varchar("author", { length: 255 }),
  published: boolean("published").default(true).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => usersTable.id, {
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
export const galleryItemsTable = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  caption: varchar("caption", { length: 500 }),
  mediaType: mediaTypeEnum("media_type").default("image").notNull(),
  mediaUrl: varchar("media_url", { length: 500 }).notNull(),
  eventId: integer("event_id").references(() => eventsTable.id, {
    onDelete: "set null",
  }),
  createdBy: integer("created_by").references(() => usersTable.id, {
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
 * `amount` is stored in the smallest currency unit (paise for INR) to avoid
 * floating-point money bugs — divide by 100 only for display.
 */
export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  // Our internal reference, also sent to Razorpay as the order receipt.
  receipt: varchar("receipt", { length: 40 }).notNull().unique(),
  donorName: varchar("donor_name", { length: 255 }).notNull(),
  donorEmail: varchar("donor_email", { length: 255 }).notNull(),
  donorPhone: varchar("donor_phone", { length: 20 }),
  message: varchar("message", { length: 500 }),
  amount: integer("amount").notNull(), // paise
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  status: paymentStatusEnum("status").default("created").notNull(),
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
