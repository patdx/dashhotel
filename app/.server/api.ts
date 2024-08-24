import type * as OT from '@opentelemetry/otlp-transformer';
import { createId } from '@paralleldrive/cuid2';
import { Hono } from 'hono';
import { omit } from 'lodash-es';
import { db, getDb } from './db';

async function registerAttribute(key: string, type: string) {
	// console.log('registerAttribute', key, type);
	await db.execute({
		sql: `
			INSERT INTO attribute (key, type) VALUES (?, ?)
			ON CONFLICT DO NOTHING
		`,
		args: [key, type],
	});
}

async function registerKeyValues(prefix: string, values: OT.IKeyValue[]) {
	for (const value of values) {
		await registerValue(`${prefix}${value.key}`, value.value);
	}
}

async function registerArrayValue(key: string, arrayValue: OT.IArrayValue) {
	for (const elem of arrayValue?.values ?? []) {
		await registerValue(`${key}.$`, elem);
	}
}

async function registerValue(key: string, value: OT.IAnyValue) {
	const type = Object.keys(value).join(',');

	await registerAttribute(key, type);

	if (value.stringValue) {
		await db.execute({
			sql: `
				INSERT INTO known_value (key, value) VALUES (?, ?)
				ON CONFLICT DO NOTHING
			`,
			args: [key, value.stringValue],
		});

		// await db.execute({
		// 	sql: `INSERT INTO known_values (key, value) VALUES (?, ?)`,
		// 	args: [key, value.stringValue],
		// });
		// register enum values
		// await registerAttribute(`${key}.${value.stringValue}`, value.stringValue);
	}

	if (value.arrayValue) {
		await registerArrayValue(key, value.arrayValue);
	}

	if (value.kvlistValue) {
		await registerKeyValues(`${key}.`, value.kvlistValue.values);
	}
}

export const api = new Hono()
	.all('/v1/logs', async (c) => {
		const data = await c.req.json<OT.IExportLogsServiceRequest>();

		const db = await getDb();

		for (const resourceLog of data.resourceLogs ?? []) {
			const resourceLogId = createId();
			await db.execute({
				sql: `
				  INSERT INTO row (id, parent, breadcrumb, children_count, type, subtype, timestamp, json)
				  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`,
				args: [
					resourceLogId, // id
					null, // parent (assuming top-level log has no parent)
					JSON.stringify([resourceLogId]), // breadcrumb
					resourceLog.scopeLogs.length ?? 0, // children_count
					'log', // type
					'resource', // subtype (assuming this is a resource log)
					new Date().toISOString(), // timestamp
					JSON.stringify(omit(resourceLog, 'scopeLogs')), // json
				],
			});

			await registerKeyValues(
				'RESOURCE.',
				resourceLog.resource?.attributes ?? [],
			);

			for (const scopeLog of resourceLog.scopeLogs ?? []) {
				const scopeLogId = createId();
				await db.execute({
					sql: `
					  INSERT INTO row (id, parent, breadcrumb, children_count, type, subtype, timestamp, json)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					`,
					args: [
						scopeLogId, // id
						resourceLogId, // parent
						JSON.stringify([resourceLogId, scopeLogId]), // breadcrumb
						scopeLog.logRecords?.length ?? 0, // children_count
						'log', // type
						'scope', // subtype
						new Date().toISOString(), // timestamp
						JSON.stringify(omit(scopeLog, 'logRecords')), // json
					],
				});

				await registerKeyValues('SCOPE.', scopeLog.scope?.attributes ?? []);

				for (const logRecord of scopeLog.logRecords ?? []) {
					const logRecordId = createId();
					await db.execute({
						sql: `
						  INSERT INTO row (id, parent, breadcrumb, children_count, type, subtype, timestamp, json)
							VALUES (?, ?, ?, ?, ?, ?, ?, ?)
							`,
						args: [
							logRecordId, // id
							scopeLogId, // parent
							JSON.stringify([resourceLogId, scopeLogId, logRecordId]), // breadcrumb
							0, // children_count
							'log', // type
							'record', // subtype
							new Date().toISOString(), // timestamp
							JSON.stringify(logRecord), // json
						],
					});
					await registerKeyValues('RECORD.', logRecord.attributes ?? []);
				}
			}
		}

		// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
		const result = await db.execute(`select * from row`);

		// console.log(result);

		return c.json(result);
	})
	.all('/v1/traces', async (c) => {
		const data = await c.req.json<OT.IExportLogsServiceRequest>();
		// console.log('v1/traces', c.req.method, c.req.url, data);
		// fs.mkdirSync('v1/traces', { recursive: true });
		// fs.writeFileSync(
		// 	`v1/traces/${Date.now()}.json`,
		// 	JSON.stringify(data, null, 2),
		// );
		return c.json({});
	});
