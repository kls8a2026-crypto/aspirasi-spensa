import {
  boolean,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const aspirations = pgTable('aspirations', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  message: text('message').notNull(),
  author: text('author').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  isHidden: boolean('is_hidden').notNull().default(false),
  isSample: boolean('is_sample').notNull().default(false),
  adminReply: text('admin_reply'),
  adminRepliedAt: timestamp('admin_replied_at', { withTimezone: true }),
});

export const mediaSettings = pgTable('media_settings', {
  id: text('id').primaryKey(),
  schoolLogoUrl: text('school_logo_url'),
  exploreGalleryUrls: jsonb('explore_gallery_urls')
    .$type<string[]>()
    .notNull(),
  writeGalleryUrls: jsonb('write_gallery_urls')
    .$type<string[]>()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
