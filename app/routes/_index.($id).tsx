import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect, useLoaderData } from '@remix-run/react';
import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '~/.server/db';
import { Attribute, Row } from '~/components';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '~/components/ui/resizable';
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
	const parent = id
		? await db.query.row.findFirst({
				where: eq(schema.row.id, id),
			})
		: null;

	if (id && !parent) {
		throw redirect('/');
	}

	return json({
		attributes,
		children: children?.map((row) => formatRow(row)),
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
	const { attributes, children, parent } = useLoaderData<typeof loader>();

	return (
		<div className="inset-0 absolute">
			<ResizablePanelGroup direction="horizontal" className="">
				<ResizablePanel>
					<div className="p-4 overflow-y-auto overflow-x-hidden h-full">
						<h2 className="text-xl font-bold mb-4">Attributes</h2>
						{attributes.map((attribute, index) => (
							<Attribute
								key={index}
								name={attribute.key}
								type={attribute.type}
								knownValues={attribute.known_values}
							/>
						))}
					</div>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel>
					<div className="p-4 overflow-y-auto overflow-x-hidden h-full">
						{parent && (
							<>
								<h2 className="text-2xl font-bold">Details</h2>
								<Row row={parent} showParent expanded />
							</>
						)}
						<h2 className="text-2xl font-bold">Children</h2>
						<div className="flex flex-col gap-2">
							{children?.map((row, index) => (
								<Row key={index} row={row} />
							))}
						</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
