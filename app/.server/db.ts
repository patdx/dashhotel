import { createClient } from '@libsql/client';

export const db = createClient({
	url: 'file:./db.sqlite',
});

// create table for key and value (String)

await db.executeMultiple(`
	DROP TABLE IF EXISTS row;
	CREATE TABLE IF NOT EXISTS row (
		id TEXT PRIMARY KEY,
		parent TEXT,
		breadcrumb TEXT DEFAULT '[]',
		children_count INTEGER NOT NULL DEFAULT 0,
		type TEXT,
		subtype TEXT,
		timestamp TEXT,
		json TEXT
	);
	--
	DROP TABLE IF EXISTS attribute;
	CREATE TABLE IF NOT EXISTS attribute (
		key TEXT,
		type TEXT,
		PRIMARY KEY (key, type)
	);

	DROP TABLE IF EXISTS known_value;
	CREATE TABLE IF NOT EXISTS known_value (
		key TEXT,
		value TEXT,
		PRIMARY KEY (key, value)
	);
`);

const init = false;

export async function getDb() {
	// if (!init) {
	// 	await db.executeMultiple(`
	// 		DROP TABLE IF EXISTS key_value;
	// 		CREATE TABLE IF NOT EXISTS key_value (
	// 			key TEXT PRIMARY KEY,
	// 			value TEXT
	// 		);
	// 	`);
	// 	init = true;
	// }
	return db;
}
