import {
    boolean,
    integer,
    json,
    jsonb,
    numeric,
    pgTable,
    serial,
    text,
    timestamp,
} from 'drizzle-orm/pg-core';

export const playerCount = pgTable('player_count', {
    id: serial('id').primaryKey().notNull(),
    count: integer('count').notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const teamNotes = pgTable('team_notes', {
    id: serial('id').primaryKey().notNull(),
    user: text('user').notNull(),
    noterId: integer('noterId').notNull(),
    noterName: text('noterName').notNull(),
    note: text('note').notNull(),
    display: boolean('display').default(true).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const commandLog = pgTable('command_log', {
    id: serial('id').primaryKey().notNull(),
    user: numeric('user').notNull(),
    command: text('command').notNull(),
    channel: text('channel').notNull(),
    options: json('options'),
    jsonData: jsonb('jsonData').notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const faScans = pgTable('fa_scans', {
    id: serial('id').primaryKey().notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const faUsers = pgTable('fa_users', {
    id: serial('id').primaryKey().notNull(),
    scanid: serial('scanid')
        .notNull()
        .references(() => faScans.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    identifier: text('identifier').notNull(),
    icname: text('icname').notNull(),
    discordid: text('discordid').notNull(),
    bank: numeric('bank'),
    black: numeric('black'),
    cash: numeric('cash'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const faResult = pgTable('fa_result', {
    id: serial('id').primaryKey().notNull(),
    scanid: serial('scanid')
        .notNull()
        .references(() => faScans.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    identifier: text('identifier').notNull(),
    icname: text('icname').notNull(),
    discordid: text('discordid').notNull(),
    bank: numeric('bank'),
    black: numeric('black'),
    cash: numeric('cash'),
    vehicleGreen: numeric('vehicle_green'),
    vehicleBlack: numeric('vehicle_black'),
    housingGreen: numeric('housing_green'),
    immobayGreen: numeric('immobay_green'),
    totalGreen: numeric('total_green'),
    totalBlack: numeric('total_black'),
    totalMoney: numeric('total_money'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const faVehicles = pgTable('fa_vehicles', {
    id: serial('id').primaryKey().notNull(),
    scanid: serial('scanid')
        .notNull()
        .references(() => faScans.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    owner: text('owner').notNull(),
    plate: text('plate').notNull(),
    green: numeric('green'),
    black: numeric('black'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const faHousing = pgTable('fa_housing', {
    id: serial('id').primaryKey().notNull(),
    scanid: serial('scanid')
        .notNull()
        .references(() => faScans.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    owner: text('owner').notNull(),
    green: numeric('green'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const faImmobay = pgTable('fa_immobay', {
    id: serial('id').primaryKey().notNull(),
    scanid: serial('scanid')
        .notNull()
        .references(() => faScans.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    owner: text('owner').notNull(),
    green: numeric('green'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

