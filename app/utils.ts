import type * as OT from '@opentelemetry/otlp-transformer';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function flattenValue(
	value?: OT.IAnyValue | OT.IKeyValue[] | null,
): any {
	if (!value) {
		return null;
	} else if (Array.isArray(value)) {
		return flattenValue({
			kvlistValue: {
				values: value,
			},
		});
	} else if (value.stringValue) {
		return value.stringValue;
	} else if (value.boolValue) {
		return value.boolValue ?? false;
	} else if (value.doubleValue) {
		return value.doubleValue ?? 0;
	} else if (value.intValue) {
		return value.intValue ?? 0;
	} else if (value.bytesValue) {
		return value.bytesValue;
	} else if (value.arrayValue) {
		return value.arrayValue.values.map((elem) => flattenValue(elem));
	} else if (value.kvlistValue) {
		const output: Record<string, any> = {};
		for (const entry of value.kvlistValue.values) {
			output[entry.key] = flattenValue(entry.value);
		}
		return output;
	} else {
		return null;
	}
}
