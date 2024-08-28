import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect, useLoaderData } from '@remix-run/react';
import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '~/.server/db';
import {} from '~/components';
import { NewDashboard } from '~/components/new-dashboard';
import {} from '~/components/ui/resizable';
import { flattenValue } from '~/utils';

export const meta: MetaFunction = () => {
	return [
		{ title: 'New Remix App' },
		{
			name: 'description',
			content: 'Welcome to Remix on Cloudflare!',
		},
	];
};

export async function loader(args: LoaderFunctionArgs) {
	const db = getDb();
	const { id } = args.params;

	// const attributes = await db.all(sql`
	//   select *, (select json_group_array(value) from known_value where key = attribute.key) as known_values
	// 	from attribute
	// 	order by key
	// `);

	const attributes = await db.query.attribute.findMany({
		with: {
			known_values: true,
		},
	});

	const children = id
		? await db
				.select()
				.from(schema.row)
				.where(eq(schema.row.parent, id))
				.orderBy(desc(schema.row.timestamp))
				.limit(50)
		: await db
				.select()
				.from(schema.row)
				.where(eq(schema.row.subtype, 'record'))
				.orderBy(desc(schema.row.timestamp))
				.limit(50);

	// TODO: fetch all parents recursively(?)
	const details = id
		? await db.query.row.findFirst({
				where: eq(schema.row.id, id),
			})
		: null;

	// Fetch the parent if details exist
	const parent = details?.parent
		? await db.query.row.findFirst({
				where: eq(schema.row.id, details.parent),
			})
		: null;

	if (id && !details) {
		throw redirect('/');
	}

	return json({
		attributes,
		children: children?.map((row) => formatRow(row)),
		details: details ? formatRow(details) : null,
		parent: parent ? formatRow(parent) : null,
	});
}

function formatRow(row: any) {
	const json = row?.json;
	// const json = row?.json ? JSON.parse(row.json) : null;

	const niceJson = {
		...json,
		body: flattenValue(json?.body),
		attributes: flattenValue(json?.attributes),
		resource: {
			...json?.resource,
			attributes: flattenValue(json?.resource?.attributes),
		},
		// _raw: json,
	};

	return {
		...row,
		json: niceJson,
	};
}

export default function Index() {
	const { attributes, children, details, parent } =
		useLoaderData<typeof loader>();

	return <NewDashboard logs={children} attributes={attributes} />;
}
