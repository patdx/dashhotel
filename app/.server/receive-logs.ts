import type * as OT from '@opentelemetry/otlp-transformer';
import { createId } from '@paralleldrive/cuid2';
import { omit } from 'lodash-es';
import { getDb, schema } from '~/.server/db';
import { registerKeyValues } from './utils';

export async function handleLogRequest(data: OT.IExportLogsServiceRequest) {
	const db = getDb();

	for (const resourceLog of data.resourceLogs ?? []) {
		const resourceLogId = createId();

		await db.insert(schema.row).values({
			id: resourceLogId,
			parent: null,
			breadcrumb: [resourceLogId],
			children_count: resourceLog.scopeLogs.length ?? 0,
			type: 'log',
			subtype: 'resource',
			timestamp: new Date().toISOString(),
			json: omit(resourceLog, 'scopeLogs'),
		});

		await registerKeyValues(
			'RESOURCE.',
			resourceLog.resource?.attributes ?? [],
		);

		for (const scopeLog of resourceLog.scopeLogs ?? []) {
			const scopeLogId = createId();

			await db.insert(schema.row).values({
				id: scopeLogId,
				parent: resourceLogId,
				breadcrumb: [resourceLogId, scopeLogId],
				children_count: scopeLog.logRecords?.length ?? 0,
				type: 'log',
				subtype: 'scope',
				timestamp: new Date().toISOString(),
				json: omit(scopeLog, 'logRecords'),
			});

			await registerKeyValues('SCOPE.', scopeLog.scope?.attributes ?? []);

			for (const logRecord of scopeLog.logRecords ?? []) {
				const logRecordId = createId();
				await db.insert(schema.row).values({
					id: logRecordId,
					parent: scopeLogId,
					breadcrumb: [resourceLogId, scopeLogId, logRecordId],
					children_count: 0,
					type: 'log',
					subtype: 'record',
					timestamp: new Date().toISOString(),
					json: logRecord,
				});

				await registerKeyValues('RECORD.', logRecord.attributes ?? []);
			}
		}
	}
}
