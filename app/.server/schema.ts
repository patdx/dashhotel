import { relations, sql } from 'drizzle-orm';
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from 'drizzle-orm/sqlite-core';

export const row = sqliteTable('row', {
	id: text('id').primaryKey(),
	parent: text('parent'),
	breadcrumb: text('breadcrumb', { mode: 'json' })
		.$type<string[]>()
		.default(sql`'[]'`),
	children_count: integer('children_count').notNull().default(0),
	type: text('type'),
	subtype: text('subtype'),
	timestamp: text('timestamp'),
	json: text('json', { mode: 'json' }),
});

export const attribute = sqliteTable(
	'attribute',
	{
		key: text('key').notNull(),
		type: text('type').notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.key, t.type] }),
	}),
);

export const attribute_relations = relations(attribute, ({ many }) => ({
	known_values: many(known_value),
}));

export const known_value = sqliteTable(
	'known_value',
	{
		key: text('key').notNull(),
		value: text('value').notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.key, t.value] }),
	}),
);

export const known_value_relations = relations(known_value, ({ one }) => ({
	attribute: one(attribute, {
		fields: [known_value.key],
		references: [attribute.key],
	}),
}));
