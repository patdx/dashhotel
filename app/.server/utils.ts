import type * as OT from '@opentelemetry/otlp-transformer';
import { getDb, schema } from '~/.server/db';

async function registerAttribute(key: string, type: string) {
	const db = getDb();
	await db.insert(schema.attribute).values({ key, type }).onConflictDoNothing();
}

export async function registerKeyValues(
	prefix: string,
	values: OT.IKeyValue[],
) {
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
	const db = getDb();
	const type = Object.keys(value).join(',');

	await registerAttribute(key, type);

	if (value.stringValue) {
		await db
			.insert(schema.known_value)
			.values({ key, value: value.stringValue })
			.onConflictDoNothing();
	}

	if (value.arrayValue) {
		await registerArrayValue(key, value.arrayValue);
	}

	if (value.kvlistValue) {
		await registerKeyValues(`${key}.`, value.kvlistValue.values);
	}
}
