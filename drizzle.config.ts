import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './app/.server/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: 'file:./db.sqlite',
	},
	verbose: true,
});
