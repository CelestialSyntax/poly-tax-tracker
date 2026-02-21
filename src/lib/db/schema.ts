import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  numeric,
  integer,
  uniqueIndex,
  index,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Users ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  walletAddress: varchar("wallet_address", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  image: varchar("image", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
  wallets: many(wallets),
  transactions: many(transactions),
  taxLots: many(taxLots),
  settings: one(userSettings),
}));

// ─── NextAuth Accounts ─────────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 255 }),
  },
  (table) => [
    uniqueIndex("provider_account_idx").on(
      table.provider,
      table.providerAccountId
    ),
  ]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

// ─── NextAuth Sessions ──────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
  expires: timestamp("expires").notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// ─── Verification Tokens (NextAuth) ────────────────────
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [
    uniqueIndex("verification_token_idx").on(table.identifier, table.token),
  ]
);

// ─── API Keys ───────────────────────────────────────────
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keyHash: varchar("key_hash", { length: 255 }).unique().notNull(),
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

// ─── Wallets ────────────────────────────────────────────
export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: varchar("address", { length: 255 }).notNull(),
    label: varchar("label", { length: 255 }),
    isProxy: boolean("is_proxy").default(false).notNull(),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wallet_user_address_idx").on(table.userId, table.address),
  ]
);

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(transactions),
}));

// ─── Transactions ───────────────────────────────────────
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    walletId: uuid("wallet_id").references(() => wallets.id),
    marketId: varchar("market_id", { length: 255 }).notNull(),
    marketTitle: varchar("market_title", { length: 1000 }).notNull(),
    outcome: varchar("outcome", { length: 10 }).notNull(), // YES | NO
    type: varchar("type", { length: 20 }).notNull(), // BUY | SELL | SETTLEMENT | REDEEM
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    pricePerShare: numeric("price_per_share", {
      precision: 20,
      scale: 8,
    }).notNull(),
    totalAmount: numeric("total_amount", {
      precision: 20,
      scale: 8,
    }).notNull(),
    fee: numeric("fee", { precision: 20, scale: 8 }).default("0").notNull(),
    transactionHash: varchar("transaction_hash", { length: 255 }),
    timestamp: timestamp("timestamp").notNull(),
    importSource: varchar("import_source", { length: 20 }).notNull(), // api | csv | manual | bot
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("tx_user_timestamp_idx").on(table.userId, table.timestamp),
    index("tx_user_market_idx").on(table.userId, table.marketId),
    uniqueIndex("tx_user_hash_idx").on(table.userId, table.transactionHash),
  ]
);

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [transactions.userId],
      references: [users.id],
    }),
    wallet: one(wallets, {
      fields: [transactions.walletId],
      references: [wallets.id],
    }),
    taxLots: many(taxLots),
  })
);

// ─── Tax Lots ───────────────────────────────────────────
export const taxLots = pgTable(
  "tax_lots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    marketId: varchar("market_id", { length: 255 }).notNull(),
    outcome: varchar("outcome", { length: 10 }).notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    originalQuantity: numeric("original_quantity", {
      precision: 20,
      scale: 8,
    }).notNull(),
    costBasisPerShare: numeric("cost_basis_per_share", {
      precision: 20,
      scale: 8,
    }).notNull(),
    acquiredAt: timestamp("acquired_at").notNull(),
    disposedAt: timestamp("disposed_at"),
    proceedsPerShare: numeric("proceeds_per_share", {
      precision: 20,
      scale: 8,
    }),
    gainLoss: numeric("gain_loss", { precision: 20, scale: 8 }),
    holdingPeriod: varchar("holding_period", { length: 20 }), // short-term | long-term
    isOpen: boolean("is_open").default(true).notNull(),
  },
  (table) => [
    index("lot_user_open_idx").on(table.userId, table.isOpen),
    index("lot_user_market_outcome_idx").on(
      table.userId,
      table.marketId,
      table.outcome
    ),
  ]
);

export const taxLotsRelations = relations(taxLots, ({ one }) => ({
  user: one(users, { fields: [taxLots.userId], references: [users.id] }),
  transaction: one(transactions, {
    fields: [taxLots.transactionId],
    references: [transactions.id],
  }),
}));

// ─── User Settings ──────────────────────────────────────
export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  defaultTaxTreatment: varchar("default_tax_treatment", { length: 20 })
    .default("capital_gains")
    .notNull(),
  defaultCostBasis: varchar("default_cost_basis", { length: 20 })
    .default("fifo")
    .notNull(),
  taxYear: integer("tax_year")
    .default(new Date().getFullYear())
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));
