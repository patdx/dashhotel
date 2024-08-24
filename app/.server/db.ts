import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { once } from 'lodash-es';
import * as schema from './schema';

export { schema };

export const getClient = once(() => {
	console.log('initializing database connection');
	return createClient({
		url: 'file:./db.sqlite',
	});
});

export const getDb = once(() =>
	drizzle(getClient(), {
		schema,
	}),
);
