import type * as OT from '@opentelemetry/otlp-transformer';
import { Hono } from 'hono';
import { handleLogRequest } from './receive-logs';

export const api = new Hono()
	.all('/v1/logs', async (c) => {
		const data = await c.req.json<OT.IExportLogsServiceRequest>();

		return c.json({});
	})
	.all('/v1/traces', async (c) => {
		const data = await c.req.json<OT.IExportLogsServiceRequest>();

		await handleLogRequest(data);

		return c.json({});
	});
