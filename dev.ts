import { migrate } from 'drizzle-orm/libsql/migrator';
import { fs, $, ProcessOutput, glob } from 'zx';
import { getDb } from '~/.server/db';

import { handleLogRequest } from '~/.server/receive-logs';

$.verbose = true;

// pnpm tsx dev.ts

try {
	// reset migrations
	await fs.emptyDir('./drizzle');
	// generate migrations
	await $`drizzle-kit generate --name="initial"`;
	// reset db
	await fs.rm('./db.sqlite', {
		recursive: true,
		force: true,
	});
	// migrate
	await migrate(getDb(), { migrationsFolder: './drizzle' });
	// seed
	console.log('seeding');

	const item = await glob('v1/logs/*.json');

	let i = 1;
	for (const file of item) {
		console.log(`processing ${i}/${item.length}`);
		const json = await fs.readJSON(file, 'utf8');
		await handleLogRequest(json);
		i++;
	}

	console.log('done');
} catch (err) {
	if (err instanceof ProcessOutput) {
		// already logged by $.verbose = true
	} else {
		throw err;
	}
}
